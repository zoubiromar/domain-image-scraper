/**
 * Job Manager - Handles job creation, updates, and persistence
 * 
 * Jobs are stored in Vercel Blob (server-side) with localStorage fallback.
 * This enables:
 * - URL-based job access (/urpc/{jobId})
 * - Resume interrupted processing
 * - Progress persistence
 * - Truly shareable links (across devices!)
 * - No storage quota issues
 */

import { saveJobToBlob, loadJobFromBlob, deleteJobFromBlob, cacheJobId } from './job-storage';

// ============================================================================
// TYPES
// ============================================================================

export type JobStatus = 'processing' | 'completed' | 'cancelled' | 'error';

export interface Job {
  id: string;
  tool: 'urpc' | 'domain' | 'qa';
  status: JobStatus;
  progress: {
    current: number;
    total: number;
    phase: string;
  };
  results: any[];
  costs?: any;
  config: any;
  timestamp: string;
  lastUpdated: string;
  error?: string;
}

// ============================================================================
// JOB ID GENERATION
// ============================================================================

export function generateJobId(): string {
  // Use timestamp + random for uniqueness
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${timestamp}-${random}`;
}

// ============================================================================
// JOB CRUD OPERATIONS
// ============================================================================

/**
 * Create a new job
 */
export function createJob(
  tool: 'urpc' | 'domain' | 'qa',
  config: any,
  totalItems: number
): Job {
  const jobId = generateJobId();
  const job: Job = {
    id: jobId,
    tool,
    status: 'processing',
    progress: {
      current: 0,
      total: totalItems,
      phase: 'Starting...',
    },
    results: [],
    config,
    timestamp: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  // Save to Blob (async, don't wait)
  saveJobToBlob(tool, job).catch(err => {
    console.warn('[JobManager] Blob save failed, using localStorage fallback');
  });
  
  // Cache job ID for listing (lightweight)
  cacheJobId(tool, jobId);
  
  // Also save to localStorage as fallback (but handle quota errors)
  try {
    localStorage.setItem(`${tool}_job_${jobId}`, JSON.stringify(job));
    console.log(`[JobManager] Created job: ${jobId}`);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('[JobManager] localStorage full, saved to Blob only');
    } else {
      console.error('[JobManager] Failed to create job:', e);
    }
  }

  return job;
}

/**
 * Get job by ID (checks localStorage first for speed, then Blob)
 */
export async function getJob(tool: string, jobId: string): Promise<Job | null> {
  // Try localStorage first (faster)
  try {
    const data = localStorage.getItem(`${tool}_job_${jobId}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('[JobManager] localStorage read failed, trying Blob');
  }

  // Fall back to Blob storage
  try {
    const job = await loadJobFromBlob(tool, jobId);
    
    // Cache in localStorage for future access (if space available)
    if (job) {
      try {
        localStorage.setItem(`${tool}_job_${jobId}`, JSON.stringify(job));
      } catch (e) {
        // Quota exceeded, no problem - Blob is source of truth
      }
    }
    
    return job;
  } catch (e) {
    console.error('[JobManager] Failed to get job from Blob:', e);
    return null;
  }
}

/**
 * Synchronous version that only checks localStorage
 * Use this for immediate checks, then upgrade to async version
 */
export function getJobSync(tool: string, jobId: string): Job | null {
  try {
    const data = localStorage.getItem(`${tool}_job_${jobId}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Update job progress (saves to both Blob and localStorage)
 */
export function updateJobProgress(
  jobId: string,
  progress: { current: number; total: number; phase: string },
  partialResults: any[]
): void {
  // Find the job's tool prefix
  let job: Job | null = null;
  let toolPrefix = '';
  
  for (const tool of ['urpc', 'domain', 'qa']) {
    const key = `${tool}_job_${jobId}`;
    const data = localStorage.getItem(key);
    if (data) {
      try {
        job = JSON.parse(data);
        toolPrefix = tool;
        break;
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }

  if (!job) {
    console.warn('[JobManager] Job not found for progress update:', jobId);
    return;
  }

  // Update job data
  job.progress = progress;
  job.results = partialResults;
  job.lastUpdated = new Date().toISOString();

  // Save to Blob (async, don't wait - updates happen frequently)
  saveJobToBlob(toolPrefix, job).catch(() => {
    console.warn('[JobManager] Blob update failed (non-critical)');
  });

  // Update localStorage (for immediate access)
  try {
    localStorage.setItem(`${toolPrefix}_job_${jobId}`, JSON.stringify(job));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      // Quota exceeded, but Blob has it - not critical
      console.warn('[JobManager] localStorage full (Blob has the data)');
    }
  }
}

/**
 * Mark job as completed (saves to Blob and localStorage)
 */
export function completeJob(jobId: string, results: any[], costs: any): void {
  let job: Job | null = null;
  let toolPrefix = '';
  
  for (const tool of ['urpc', 'domain', 'qa']) {
    const key = `${tool}_job_${jobId}`;
    const data = localStorage.getItem(key);
    if (data) {
      try {
        job = JSON.parse(data);
        toolPrefix = tool;
        break;
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }

  if (!job) {
    console.warn('[JobManager] Job not found for completion:', jobId);
    return;
  }

  job.status = 'completed';
  job.results = results;
  job.costs = costs;
  job.lastUpdated = new Date().toISOString();
  job.progress.current = job.progress.total;
  job.progress.phase = 'Completed';

  // Save to Blob (permanent storage)
  saveJobToBlob(toolPrefix, job);

  // Update localStorage
  try {
    localStorage.setItem(`${toolPrefix}_job_${jobId}`, JSON.stringify(job));
    console.log(`[JobManager] Job completed: ${jobId}`);
  } catch (e) {
    if (!(e instanceof DOMException && e.name === 'QuotaExceededError')) {
      console.error('[JobManager] Failed to complete job:', e);
    }
  }
}

/**
 * Mark job as cancelled
 */
export function cancelJob(jobId: string, partialResults: any[], costs: any): void {
  let job: Job | null = null;
  let toolPrefix = '';
  
  for (const tool of ['urpc', 'domain', 'qa']) {
    const key = `${tool}_job_${jobId}`;
    const data = localStorage.getItem(key);
    if (data) {
      try {
        job = JSON.parse(data);
        toolPrefix = tool;
        break;
      } catch (e) {
        continue;
      }
    }
  }

  if (!job) {
    console.warn('[JobManager] Job not found for cancellation:', jobId);
    return;
  }

  job.status = 'cancelled';
  job.results = partialResults;
  job.costs = costs;
  job.lastUpdated = new Date().toISOString();
  job.progress.phase = 'Cancelled';

  // Save to Blob
  saveJobToBlob(toolPrefix, job);

  // Update localStorage
  try {
    localStorage.setItem(`${toolPrefix}_job_${jobId}`, JSON.stringify(job));
    console.log(`[JobManager] Job cancelled: ${jobId}`);
  } catch (e) {
    // Quota exceeded is OK - Blob has it
  }
}

/**
 * Mark job as errored
 */
export function errorJob(jobId: string, error: string, partialResults: any[], costs: any): void {
  let job: Job | null = null;
  let toolPrefix = '';
  
  for (const tool of ['urpc', 'domain', 'qa']) {
    const key = `${tool}_job_${jobId}`;
    const data = localStorage.getItem(key);
    if (data) {
      try {
        job = JSON.parse(data);
        toolPrefix = tool;
        break;
      } catch (e) {
        continue;
      }
    }
  }

  if (!job) {
    console.warn('[JobManager] Job not found for error:', jobId);
    return;
  }

  job.status = 'error';
  job.error = error;
  job.results = partialResults;
  job.costs = costs;
  job.lastUpdated = new Date().toISOString();

  // Save to Blob
  saveJobToBlob(toolPrefix, job);

  // Update localStorage
  try {
    localStorage.setItem(`${toolPrefix}_job_${jobId}`, JSON.stringify(job));
    console.log(`[JobManager] Job errored: ${jobId}`);
  } catch (e) {
    // Quota exceeded OK
  }
}

/**
 * Get all jobs for a tool
 */
export function getAllJobs(tool: string): Job[] {
  try {
    const prefix = `${tool}_job_`;
    const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
    
    return keys.map(key => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) {
    console.error('[JobManager] Failed to get all jobs:', e);
    return [];
  }
}

/**
 * Delete a job
 */
export function deleteJob(tool: string, jobId: string): void {
  try {
    localStorage.removeItem(`${tool}_job_${jobId}`);
    console.log(`[JobManager] Deleted job: ${jobId}`);
  } catch (e) {
    console.error('[JobManager] Failed to delete job:', e);
  }
}

/**
 * Delete all jobs for a tool
 */
export function deleteAllJobs(tool: string): void {
  try {
    const prefix = `${tool}_job_`;
    const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
    keys.forEach(k => localStorage.removeItem(k));
    console.log(`[JobManager] Deleted all ${tool} jobs`);
  } catch (e) {
    console.error('[JobManager] Failed to delete all jobs:', e);
  }
}

/**
 * Alias for compatibility
 */
export function clearAllJobs(tool: string): void {
  deleteAllJobs(tool);
}
