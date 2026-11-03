const Job = require('../../Model/Job');
const UserExperience = require('../../Model/UserExperience');

// Creates a job for the employer and a (current) work experience linking the seeker to it.
exports.hire = async (employer, seeker, { left = false } = {}) => {
  const job = await Job.create({
    employer_id: employer.user._id, title: 'Helper', description: 'Test job', number_of_openings: 1,
    job_type: 'full_time', wage_type: 'monthly', salary_min: 1000, salary_max: 2000,
    city: 'Chandigarh', location: { type: 'Point', coordinates: [76.78, 30.73] },
  });
  const experience = await UserExperience.create({
    seeker_id: seeker.user._id, job_id: job._id, date_joined: new Date('2026-01-01'),
    ...(left ? { date_left: new Date('2026-02-01') } : {}),
  });
  return { job, experience };
};
