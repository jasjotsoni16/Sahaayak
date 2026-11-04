// Pure helpers that turn API responses into what the seeker dashboard shows.

export const IN_PROGRESS = ['applied', 'discussion', 'negotiation'];

const time = (d) => (d ? new Date(d).getTime() : 0);

// Newest application first. The API returns them in insertion order, which is not guaranteed.
export const latestApplications = (applications, n = 3) =>
  [...(applications || [])].sort((a, b) => time(b.date_applied) - time(a.date_applied)).slice(0, n);

export const countInProgress = (applications) =>
  (applications || []).filter((a) => IN_PROGRESS.includes(a.status)).length;

// Jobs worth suggesting: not already applied to, still hiring, newest first.
export function jobsForYou(jobs, applications, n = 3) {
  const applied = new Set((applications || []).map((a) => a.job_id && String(a.job_id._id || a.job_id)).filter(Boolean));
  return (jobs || [])
    .filter((j) => !applied.has(String(j._id)))
    .filter((j) => !j.is_archived)
    .filter((j) => !(j.number_of_openings > 0 && (j.openings_hired || 0) >= j.number_of_openings))
    .sort((a, b) => time(b.createdAt) - time(a.createdAt))
    .slice(0, n);
}

export const isNewJob = (job, now = Date.now()) => job.createdAt && now - time(job.createdAt) < 2 * 864e5;

// Salary payments an employer recorded that the seeker has not confirmed (or disputed) yet.
export const pendingPayments = (agreements) =>
  (agreements || []).reduce((n, a) => n + (a.payments || []).filter((p) => p.status === 'recorded').length, 0);

// Same bands as the credit score page.
export function creditBand(score) {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'veryGood';
  if (score >= 50) return 'good';
  if (score >= 30) return 'fair';
  return 'poor';
}

export function greetingKey(hour) {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

// The employer as seekers know them: the business name when there is one.
export const employerName = (employer) =>
  (employer && ((employer.employer_profile && employer.employer_profile.company_name) || employer.name)) || '';
