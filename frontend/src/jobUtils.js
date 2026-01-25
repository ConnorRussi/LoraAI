/**
 * Returns the found job object if a similar job exists, otherwise null.
 */
function jobExists(jobs, newJob, threshold = 0.8) {
  for (const existingJob of jobs) {
    if (jobSimilarity(existingJob, newJob) >= threshold) {
      return existingJob;
    }
  }
  return null;
}
// jobUtils.js
// Utility functions for job similarity and hiring process comparison

/**
 * Basic string similarity using normalized Levenshtein distance.
 * Returns a score between 0 (no similarity) and 1 (exact match).
 */
function stringSimilarity(a, b) {
  if (!a || !b) return 0;
  a = a.toLowerCase();
  b = b.toLowerCase();
  if (a === b) return 1;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  const distance = matrix[b.length][a.length];
  return 1 - distance / Math.max(a.length, b.length);
}


function isGenericTitle(title, company) {
  if (!title || !company) return false;
  const pattern = new RegExp(`^\\s*${company}\\s+(role|position|job)\\s*$`, 'i');
  return pattern.test(title.trim());
}

/**
 * Compute similarity score between two job objects.
 * Improved logic for generic titles and company weighting.
 */
function jobSimilarity(job1, job2) {
  if (!job1 || !job2) return 0;
  const companyScore = stringSimilarity(job1.company, job2.company);
  const isGeneric1 = isGenericTitle(job1.job, job1.company);
  const isGeneric2 = isGenericTitle(job2.job, job2.company);
  if (isGeneric1 || isGeneric2) {
    // If either title is generic, only match if company matches exactly
    if (job1.company && job2.company && job1.company.toLowerCase() === job2.company.toLowerCase()) {
      return 0.95; // treat as strong match
    } else {
      return 0.1; // treat as weak match if company doesn't match
    }
  }
  // Otherwise, use normal weighted average
  const titleScore = stringSimilarity(job1.job, job2.job);
  return 0.7 * titleScore + 0.3 * companyScore;
}

/**
 * Compare two job objects and return the one farther along in the hiring process.
 * Tiers: [applied, technical assessment, interviewing, rejected]
 * Returns the job with the higher tier, or the first if equal/unknown.
 */
function getFartherJob(job1, job2) {
  const tiers = ['applied', 'technical assessment', 'interviewing', 'rejected'];
  const idx1 = tiers.findIndex(t => job1.status && job1.status.toLowerCase().includes(t));
  const idx2 = tiers.findIndex(t => job2.status && job2.status.toLowerCase().includes(t));
  if (idx1 === -1 && idx2 === -1) return job1;
  if (idx1 === -1) return job2;
  if (idx2 === -1) return job1;
  // If both are at the same tier, keep the one already added (job1)
  if (idx1 === idx2) return job1;
  // Lower index = earlier stage, so pick the higher index
  return idx1 > idx2 ? job1 : job2;
}

export { stringSimilarity, jobSimilarity, getFartherJob, jobExists };
