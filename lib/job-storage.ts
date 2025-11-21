/**
 * Job Storage - Vercel Blob Integration
 * 
 * Stores jobs in Vercel Blob for unlimited storage and cross-device access.
 * Uses the same Blob store as the URPC database.
 */

import { Job } from './job-manager';

const BLOB_BASE_URL = 'https://cikjq7cnoxpkq7ue.public.blob.vercel-storage.com';

// ============================================================================
// BLOB OPERATIONS
// ============================================================================

/**
 * Save job to Vercel Blob
 */
export async function saveJobToBlob(tool: string, job: Job): Promise<boolean> {
  try {
    const blobUrl = `${BLOB_BASE_URL}/jobs/${tool}_${job.id}.json`;
    
    const response = await fetch(blobUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(job),
    });

    if (response.ok) {
      console.log(`[JobStorage] Saved job to Blob: ${tool}_${job.id}`);
      return true;
    } else {
      console.error(`[JobStorage] Failed to save job to Blob: ${response.status}`);
      return false;
    }
  } catch (e) {
    console.error('[JobStorage] Error saving to Blob:', e);
    return false;
  }
}

/**
 * Load job from Vercel Blob
 */
export async function loadJobFromBlob(tool: string, jobId: string): Promise<Job | null> {
  try {
    const blobUrl = `${BLOB_BASE_URL}/jobs/${tool}_${jobId}.json`;
    
    const response = await fetch(blobUrl);

    if (response.ok) {
      const job = await response.json();
      console.log(`[JobStorage] Loaded job from Blob: ${tool}_${jobId}`);
      return job;
    } else if (response.status === 404) {
      console.log(`[JobStorage] Job not found in Blob: ${tool}_${jobId}`);
      return null;
    } else {
      console.error(`[JobStorage] Failed to load job from Blob: ${response.status}`);
      return null;
    }
  } catch (e) {
    console.error('[JobStorage] Error loading from Blob:', e);
    return null;
  }
}

/**
 * Delete job from Vercel Blob
 */
export async function deleteJobFromBlob(tool: string, jobId: string): Promise<boolean> {
  try {
    const blobUrl = `${BLOB_BASE_URL}/jobs/${tool}_${jobId}.json`;
    
    const response = await fetch(blobUrl, {
      method: 'DELETE',
    });

    if (response.ok || response.status === 404) {
      console.log(`[JobStorage] Deleted job from Blob: ${tool}_${jobId}`);
      return true;
    } else {
      console.error(`[JobStorage] Failed to delete job from Blob: ${response.status}`);
      return false;
    }
  } catch (e) {
    console.error('[JobStorage] Error deleting from Blob:', e);
    return false;
  }
}

/**
 * List all jobs from Vercel Blob (using API route)
 */
export async function listJobsFromBlob(tool: string): Promise<Job[]> {
  try {
    // We'll need an API route to list Blob files
    // For now, fall back to localStorage list
    const jobs: Job[] = [];
    
    // Try to load from localStorage cache
    const cacheKey = `${tool}_job_list_cache`;
    const cache = localStorage.getItem(cacheKey);
    
    if (cache) {
      const jobIds = JSON.parse(cache);
      for (const jobId of jobIds) {
        const job = await loadJobFromBlob(tool, jobId);
        if (job) jobs.push(job);
      }
    }
    
    return jobs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (e) {
    console.error('[JobStorage] Error listing jobs from Blob:', e);
    return [];
  }
}

/**
 * Cache job ID in localStorage for listing (lightweight)
 */
export function cacheJobId(tool: string, jobId: string): void {
  try {
    const cacheKey = `${tool}_job_list_cache`;
    const cache = localStorage.getItem(cacheKey);
    const jobIds = cache ? JSON.parse(cache) : [];
    
    if (!jobIds.includes(jobId)) {
      jobIds.unshift(jobId); // Add to front
      
      // Keep only last 10 job IDs in cache
      const trimmed = jobIds.slice(0, 10);
      
      localStorage.setItem(cacheKey, JSON.stringify(trimmed));
    }
  } catch (e) {
    // If this fails, it's not critical
    console.warn('[JobStorage] Could not cache job ID:', e);
  }
}

