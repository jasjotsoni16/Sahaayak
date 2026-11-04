import {
  latestApplications, countInProgress, jobsForYou, isNewJob, pendingPayments, creditBand, greetingKey, employerName,
} from '../seekerData';

const day = 864e5;
const at = (daysAgo) => new Date(Date.now() - daysAgo * day).toISOString();

test('latest applications are newest first, whatever order the API used', () => {
  const apps = [{ _id: 'old', date_applied: at(9) }, { _id: 'new', date_applied: at(1) }, { _id: 'mid', date_applied: at(4) }];
  expect(latestApplications(apps, 2).map((a) => a._id)).toEqual(['new', 'mid']);
  expect(latestApplications(null)).toEqual([]);
});

test('in progress counts applied, discussion and negotiation only', () => {
  const apps = ['applied', 'discussion', 'negotiation', 'hired', 'left', 'fired'].map((status) => ({ status }));
  expect(countInProgress(apps)).toBe(3);
});

test('suggested jobs skip ones already applied to, full ones and archived ones, newest first', () => {
  const jobs = [
    { _id: 'applied', createdAt: at(0), number_of_openings: 3, openings_hired: 0 },
    { _id: 'full', createdAt: at(0), number_of_openings: 2, openings_hired: 2 },
    { _id: 'archived', createdAt: at(0), number_of_openings: 2, is_archived: true },
    { _id: 'older', createdAt: at(5), number_of_openings: 2, openings_hired: 1 },
    { _id: 'newer', createdAt: at(1), number_of_openings: 1 },
  ];
  const apps = [{ job_id: { _id: 'applied' } }, { job_id: null }];
  expect(jobsForYou(jobs, apps).map((j) => j._id)).toEqual(['newer', 'older']);
});

test('a job is new for two days', () => {
  expect(isNewJob({ createdAt: at(1) })).toBe(true);
  expect(isNewJob({ createdAt: at(3) })).toBe(false);
  expect(isNewJob({})).toBeFalsy();
});

test('pending payments are the recorded ones across all agreements', () => {
  const agreements = [
    { payments: [{ status: 'recorded' }, { status: 'confirmed' }] },
    { payments: [{ status: 'recorded' }, { status: 'disputed' }] },
    {},
  ];
  expect(pendingPayments(agreements)).toBe(2);
});

test('credit bands match the credit score page', () => {
  expect([90, 75, 55, 35, 10].map(creditBand)).toEqual(['excellent', 'veryGood', 'good', 'fair', 'poor']);
});

test('greeting follows the time of day', () => {
  expect([6, 13, 20].map(greetingKey)).toEqual(['morning', 'afternoon', 'evening']);
});

test('employer name prefers the business name', () => {
  expect(employerName({ name: 'Ravi', employer_profile: { company_name: 'Sharma Canteen' } })).toBe('Sharma Canteen');
  expect(employerName({ name: 'Ravi' })).toBe('Ravi');
  expect(employerName(null)).toBe('');
});
