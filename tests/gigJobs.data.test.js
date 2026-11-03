const mongoose = require('mongoose');
const Job = require('../Model/Job');
const Employer = require('../Model/Employer');
const User = require('../Model/User');
const { EMPLOYERS, JOBS } = require('../scripts/data/gigJobs');

const SKILL_NAMES = ['cleaning', 'constructor_labour', 'mechanic', 'vehicle_cleaning', 'bartending', 'electric_work', 'carpentering',
  'warehouse_works', 'dishwashing', 'driving', 'waiter', 'painting', 'plumbing', 'security_guards', 'cooking', 'electronic_repair', 'laundry', 'gardening'];
const employerKeys = EMPLOYERS.map((e) => e.key);
const oid = () => new mongoose.Types.ObjectId();

test('there are between 10 and 20 jobs', () => {
  expect(JOBS.length).toBeGreaterThanOrEqual(10);
  expect(JOBS.length).toBeLessThanOrEqual(20);
});

test('every job is a gig job with a sensible, non-fake wage', () => {
  for (const j of JOBS) {
    expect(j.job_type).toBe('gig');
    expect(j.salary_min).toBeGreaterThan(0);
    expect(j.salary_max).toBeGreaterThanOrEqual(j.salary_min);
    if (j.wage_type === 'daily') { expect(j.salary_min).toBeGreaterThanOrEqual(300); expect(j.salary_max).toBeLessThanOrEqual(2500); }
    if (j.wage_type === 'weekly') { expect(j.salary_min).toBeGreaterThanOrEqual(1500); expect(j.salary_max).toBeLessThanOrEqual(15000); }
    if (j.wage_type === 'per_task') { expect(j.salary_min).toBeGreaterThanOrEqual(20); expect(j.salary_max).toBeLessThanOrEqual(5000); }
    expect(['daily', 'weekly', 'per_task']).toContain(j.wage_type);
  }
});

test('titles are unique and descriptions say something real', () => {
  expect(new Set(JOBS.map((j) => j.title)).size).toBe(JOBS.length);
  for (const j of JOBS) { expect(j.description.length).toBeGreaterThan(40); expect(j.responsibilities.length).toBeGreaterThan(15); }
});

test('every job points at a known employer and only at existing skills', () => {
  for (const j of JOBS) {
    expect(employerKeys).toContain(j.employer);
    expect(j.skills.length).toBeGreaterThan(0);
    j.skills.forEach((s) => expect(SKILL_NAMES).toContain(s));
  }
});

test('locations are real places around Chandigarh / Mohali / Panchkula', () => {
  for (const j of JOBS) {
    const [lng, lat] = j.coordinates;
    expect(lat).toBeGreaterThan(30.5); expect(lat).toBeLessThan(30.9);
    expect(lng).toBeGreaterThan(76.6); expect(lng).toBeLessThan(77.0);
    expect(['Chandigarh', 'Mohali', 'Panchkula', 'Zirakpur']).toContain(j.city);
    expect(j.area).toBeTruthy();
  }
});

test('every job passes the Job model validation', () => {
  for (const j of JOBS) {
    const doc = new Job({
      employer_id: oid(), title: j.title, description: j.description, responsibilities: j.responsibilities,
      skills_required: j.skills.map(oid), experience_required: j.experience_required, assessment_required: false,
      number_of_openings: j.number_of_openings, job_type: j.job_type, duration: j.duration, wage_type: j.wage_type,
      salary_min: j.salary_min, salary_max: j.salary_max, negotiable: j.negotiable, leaves_allowed: 0,
      city: j.city, location: { type: 'Point', coordinates: j.coordinates },
    });
    expect(doc.validateSync()).toBeUndefined();
  }
});

test('demo employers are clearly demo accounts and pass validation', () => {
  expect(new Set(EMPLOYERS.map((e) => e.phone_number)).size).toBe(EMPLOYERS.length);
  expect(new Set(EMPLOYERS.map((e) => e.gstin_number)).size).toBe(EMPLOYERS.length);
  for (const e of EMPLOYERS) {
    expect(e.gstin_number).toMatch(/^DEMO/);
    const employer = new Employer({ user_id: oid(), company_name: e.company_name, company_type: e.company_type, gstin_number: e.gstin_number });
    expect(employer.validateSync()).toBeUndefined();
    const user = new User({ name: e.name, phone_number: e.phone_number, password: 'x', role: 'provider', city: e.city });
    expect(user.validateSync()).toBeUndefined();
  }
});

test('every employer in the list actually has at least one job', () => {
  const used = new Set(JOBS.map((j) => j.employer));
  employerKeys.forEach((k) => expect(used.has(k)).toBe(true));
});
