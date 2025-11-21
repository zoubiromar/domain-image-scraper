/**
 * Job Manager - Handles job creation, updates, and persistence
 * 
 * Jobs are stored in browser localStorage and enable:
 * - URL-based job access (/urpc/{jobId})
 * - Resume interrupted processing
 * - Progress persistence
 * - Shareable links (within same browser)
 */

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

  try {
    localStorage.setItem(`${tool}_job_${jobId}`, JSON.stringify(job));
    console.log(`[JobManager] Created job: ${jobId}`);
  } catch (e) {
    console.error('[JobManager] Failed to create job:', e);
  }

  return job;
}

/**
 * Get job by ID
 */
export function getJob(tool: string, jobId: string): Job | null {
  try {
    const data = localStorage.getItem(`${tool}_job_${jobId}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('[JobManager] Failed to get job:', e);
    return null;
  }
}

/**
 * Update job progress
 */
export function updateJobProgress(
  jobId: string,
  progress: { current: number; total: number; phase: string },
  partialResults: any[]
): void {
  try {
    // First try to get from any tool prefix
    let job: Job | null = null;
    let toolPrefix = '';
    
    for (const tool of ['urpc', 'domain', 'qa']) {
      const key = `${tool}_job_${jobId}`;
      const data = localStorage.getItem(key);
      if (data) {
        job = JSON.parse(data);
        toolPrefix = tool;
        break;
      }
    }

    if (!job) {
      console.warn('[JobManager] Job not found for progress update:', jobId);
      return;
    }

    job.progress = progress;
    job.results = partialResults;
    job.lastUpdated = new Date().toISOString();

    localStorage.setItem(`${toolPrefix}_job_${jobId}`, JSON.stringify(job));
  } catch (e) {
    console.error('[JobManager] Failed to update job progress:', e);
  }
}

/**
 * Mark job as completed
 */
export function completeJob(jobId: string, results: any[], costs: any): void {
  try {
    let job: Job | null = null;
    let toolPrefix = '';
    
    for (const tool of ['urpc', 'domain', 'qa']) {
      const key = `${tool}_job_${jobId}`;
      const data = localStorage.getItem(key);
      if (data) {
        job = JSON.parse(data);
        toolPrefix = tool;
        break;
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

    localStorage.setItem(`${toolPrefix}_job_${jobId}`, JSON.stringify(job));
    console.log(`[JobManager] Job completed: ${jobId}`);
  } catch (e) {
    console.error('[JobManager] Failed to complete job:', e);
  }
}

/**
 * Mark job as cancelled
 */
export function cancelJob(jobId: string, partialResults: any[], costs: any): void {
  try {
    let job: Job | null = null;
    let toolPrefix = '';
    
    for (const tool of ['urpc', 'domain', 'qa']) {
      const key = `${tool}_job_${jobId}`;
      const data = localStorage.getItem(key);
      if (data) {
        job = JSON.parse(data);
        toolPrefix = tool;
        break;
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

    localStorage.setItem(`${toolPrefix}_job_${jobId}`, JSON.stringify(job));
    console.log(`[JobManager] Job cancelled: ${jobId}`);
  } catch (e) {
    console.error('[JobManager] Failed to cancel job:', e);
  }
}

/**
 * Mark job as errored
 */
export function errorJob(jobId: string, error: string, partialResults: any[], costs: any): void {
  try {
    let job: Job | null = null;
    let toolPrefix = '';
    
    for (const tool of ['urpc', 'domain', 'qa']) {
      const key = `${tool}_job_${jobId}`;
      const data = localStorage.getItem(key);
      if (data) {
        job = JSON.parse(data);
        toolPrefix = tool;
        break;
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

    localStorage.setItem(`${toolPrefix}_job_${jobId}`, JSON.stringify(job));
    console.log(`[JobManager] Job errored: ${jobId}`);
  } catch (e) {
    console.error('[JobManager] Failed to mark job as errored:', e);
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
