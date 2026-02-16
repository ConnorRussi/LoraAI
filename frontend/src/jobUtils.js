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
  // Escape company string before embedding in RegExp to avoid accidental metacharacter interpretation
  const esc = escapeRegExp(company);
  const pattern = new RegExp(`^\\s*${esc}\\s+(role|position|job)\\s*$`, 'i');
  return pattern.test(title.trim());
}

function normalizeTitle(title) {
  if (!title) return '';
  return title.trim();
}

// Escape string for safe use in RegExp construction
function escapeRegExp(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Score based on token count after removing company mentions and generic words
function descriptiveScore(title, company) {
  if (!title) return 0;
  // Remove company mentions and simple generic words, then score by token count
  let t = title.toLowerCase();
  if (company) {
    const esc = escapeRegExp(company.toLowerCase());
    t = t.replace(new RegExp(esc, 'g'), '');
  }
  t = t.replace(/\b(role|position|job|opportunity|opening)\b/gi, '');
  // Count significant tokens
  const tokens = t.split(/\s+/).filter(s => s.length > 0);
  return tokens.length;
}

// Helper function to get job title from either format
function getJobTitle(job) {
  return job.job_title || job.job || '';
}

/**
 * Compute similarity score between two job objects.
 * Improved logic for generic titles and company weighting.
 */
function jobSimilarity(job1, job2) {
  if (!job1 || !job2) return 0;
  const companyScore = stringSimilarity(job1.company, job2.company);
  const title1 = getJobTitle(job1);
  const title2 = getJobTitle(job2);
  const isGeneric1 = isGenericTitle(title1, job1.company);
  const isGeneric2 = isGenericTitle(title2, job2.company);
  if (isGeneric1 || isGeneric2) {
    // If either title is generic, only match if company matches exactly
    if (job1.company && job2.company && job1.company.toLowerCase() === job2.company.toLowerCase()) {
      return 0.95; // treat as strong match
    } else {
      return 0.1; // treat as weak match if company doesn't match
    }
  }
  // Otherwise, use normal weighted average
  const titleScore = stringSimilarity(title1, title2);
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
/**
 * Merge two job objects into a single representative job.
 * - Keeps the status from the job farther along the process.
 * - Chooses the more descriptive title (non-generic, more tokens).
 * - Prefers non-empty existing company over incoming.
 */  return idx1 > idx2 ? job1 : job2;
}

/**
 * Merge two job objects into a single representative job.
 * - Keeps the status from the job farther along the process.
 * - Chooses the more descriptive title (non-generic, more tokens).
 * - Prefers non-empty company, date, url, notes when available.
 */
function mergeJobs(existingJob, incomingJob) {
  const farther = getFartherJob(existingJob, incomingJob);
  const status = (farther && farther.status) ? farther.status : (existingJob.status || incomingJob.status || '');

  const t1 = getJobTitle(existingJob) || '';
  const t2 = getJobTitle(incomingJob) || '';
  const company1 = existingJob.company || '';
  const company2 = incomingJob.company || '';

  // Prefer non-generic title
  const generic1 = isGenericTitle(t1, company1);
  const generic2 = isGenericTitle(t2, company2);
  let chosenTitle = '';
  if (generic1 && !generic2) chosenTitle = normalizeTitle(t2);
  else if (!generic1 && generic2) chosenTitle = normalizeTitle(t1);
  else {
    // pick by descriptive score (more tokens)
    //Not the best method but it helps in some cases where the title is generic but one has more info than the other (e.g. "Software Engineer" vs "Software Engineer - Frontend")
    //Will run into issues with titles that are long but not descriptive, but in those cases it doesn't really matter which one we pick since they're both not great
    const s1 = descriptiveScore(t1, company1);
    const s2 = descriptiveScore(t2, company2);
    if (s2 > s1) chosenTitle = normalizeTitle(t2);
    else chosenTitle = normalizeTitle(t1);
  }

  // Company: prefer existing non-empty, otherwise incoming
  const company = existingJob.company && existingJob.company.trim() ? existingJob.company : incomingJob.company || '';


  return {
    job: chosenTitle,
    company,
    status
  };
}

export { stringSimilarity, jobSimilarity, getFartherJob, jobExists, mergeJobs };
