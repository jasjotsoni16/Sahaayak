import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import API, { getCreditScore, getApplicationsBySeeker, getMySalaryAgreements, getJobs } from '../../api';
import SeekerDashboard from '../SeekerDashboard';
import { useAuth } from '../../contexts/AuthContext';

// Returns the English default with {{placeholders}} filled in, like i18next does.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts = {}) => (opts.defaultValue || key).replace(/\{\{(\w+)\}\}/g, (_, k) => opts[k]),
    i18n: { language: 'en' },
  }),
}));
jest.mock('../../contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
  getCreditScore: jest.fn(),
  getApplicationsBySeeker: jest.fn(),
  getMySalaryAgreements: jest.fn(),
  getJobs: jest.fn(),
}));

const ago = (days) => new Date(Date.now() - days * 864e5).toISOString();
const company = (name) => ({ name: 'Owner', employer_profile: { company_name: name } });

// Deliberately oldest first, the way the API used to return them.
const applications = [
  { _id: 'a0', status: 'left', date_applied: ago(30), job_id: null },
  { _id: 'a1', status: 'applied', date_applied: ago(9), job_id: { _id: 'j9', title: 'Party cook', city: 'Chandigarh', employer_id: company('Sharma Canteen') } },
  { _id: 'a2', status: 'negotiation', date_applied: ago(1), job_id: { _id: 'j1', title: 'Wedding waiter', city: 'Chandigarh', employer_id: company('Royal Events') } },
  { _id: 'a3', status: 'hired', date_applied: ago(5), job_id: { _id: 'j8', title: 'Plumber visits', city: 'Mohali', employer_id: company('Gupta Home Services') } },
];
const agreements = [{ _id: 'g1', payments: [{ status: 'recorded' }, { status: 'confirmed' }, { status: 'recorded' }] }];
const jobs = [
  { _id: 'j1', title: 'Wedding waiter', city: 'Chandigarh', salary_min: 800, salary_max: 1200, wage_type: 'per_task', number_of_openings: 5, openings_hired: 0, createdAt: ago(1), employer_id: company('Royal Events') },
  { _id: 'j2', title: 'Car washer', city: 'Mohali', salary_min: 120, salary_max: 200, wage_type: 'per_task', number_of_openings: 2, openings_hired: 2, createdAt: ago(1), employer_id: company('Singh Auto Care') },
  { _id: 'j3', title: 'House painter', city: 'Zirakpur', salary_min: 700, salary_max: 1000, wage_type: 'daily', number_of_openings: 3, openings_hired: 2, createdAt: ago(0.5), employer_id: company('Bright Homes') },
];

const setup = ({ user = { _id: 's1', name: 'Asha Verma', monthlySavings: 0 }, skills = [], over = {} } = {}) => {
  useAuth.mockReturnValue({ user });
  getCreditScore.mockResolvedValue({ data: { creditScore: { score: 62 } } });
  getApplicationsBySeeker.mockResolvedValue({ data: applications });
  getMySalaryAgreements.mockResolvedValue({ data: { agreements } });
  getJobs.mockResolvedValue({ data: jobs });
  API.get.mockResolvedValue({ data: skills });
  Object.entries(over).forEach(([fn, impl]) => ({ getCreditScore, getApplicationsBySeeker, getMySalaryAgreements, getJobs, get: API.get })[fn].mockImplementation(impl));
  render(<MemoryRouter><SeekerDashboard /></MemoryRouter>);
};

const statCard = (label) => screen.getByRole('link', { name: label }).parentElement.parentElement;

test('greets the seeker by first name', async () => {
  setup();
  expect(await screen.findByRole('heading', { level: 1, name: /Good (morning|afternoon|evening), Asha/ })).toBeInTheDocument();
  expect(screen.queryByText(/Verma/)).not.toBeInTheDocument();
});

test('the stat cards summarise the account and link to their pages', async () => {
  setup({ skills: [{ _id: 's1', is_verified: true }, { _id: 's2', is_verified: false }] });
  expect(await screen.findByText('Good')).toBeInTheDocument();                       // 62 is in the "good" band
  expect(screen.getByRole('link', { name: 'Credit score' })).toHaveAttribute('href', '/credit-score');
  expect(within(statCard('In progress')).getByText('2')).toBeInTheDocument();         // applied + negotiation only
  expect(within(statCard('To confirm')).getByText('2')).toBeInTheDocument();          // two recorded payments
  expect(screen.getByRole('link', { name: 'To confirm' })).toHaveAttribute('href', '/salary');
  expect(within(statCard('Skills')).getByText('2')).toBeInTheDocument();
  expect(within(statCard('Skills')).getByText('1 verified')).toBeInTheDocument();
});

test('pending salary payments get a banner with a link to review them', async () => {
  setup();
  expect(await screen.findByText('2 salary payments are waiting for you')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Review payments' })).toHaveAttribute('href', '/salary');
});

test('no banner when nothing is waiting', async () => {
  setup({ over: { getMySalaryAgreements: () => Promise.resolve({ data: { agreements: [] } }) } });
  await screen.findByText('Party cook');
  expect(screen.queryByText(/waiting for you/)).not.toBeInTheDocument();
});

test('applications are newest first, with the business name and a readable status', async () => {
  setup();
  const list = (await screen.findByText('Party cook')).closest('ul');
  const titles = within(list).getAllByRole('link').map((l) => l.querySelector('p').textContent);
  expect(titles).toEqual(['Wedding waiter', 'Plumber visits', 'Party cook']);   // the old, deleted job drops off
  expect(within(list).getByText(/Royal Events/)).toBeInTheDocument();
  expect(within(list).queryByText(/Owner/)).not.toBeInTheDocument();
  expect(within(list).getByText('Negotiating')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /view all/i })).toHaveAttribute('href', '/jobs?view=applications');
});

test('suggested jobs skip ones already applied to and ones that are full', async () => {
  setup();
  expect(await screen.findByText('House painter')).toBeInTheDocument();
  const section = screen.getByRole('heading', { name: 'Jobs for you' }).closest('section');
  expect(within(section).queryByText('Wedding waiter')).not.toBeInTheDocument();   // already applied
  expect(within(section).queryByText('Car washer')).not.toBeInTheDocument();       // no openings left
  expect(within(section).getByText('/ day')).toBeInTheDocument();                  // pay has a unit
  expect(within(section).getByText('1 opening left')).toBeInTheDocument();
  expect(within(section).getByText('New')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /see all jobs/i })).toHaveAttribute('href', '/jobs');
});

test('the getting-started checklist reflects the account', async () => {
  setup({ skills: [] });
  expect(await screen.findByRole('link', { name: 'Add a skill you work in' })).toHaveAttribute('href', '/skills');
  expect(screen.getByRole('link', { name: 'Set a monthly savings goal' })).toHaveAttribute('href', '/profile');
  expect(screen.queryByRole('link', { name: 'Apply for your first job' })).not.toBeInTheDocument();  // already applied
  expect(screen.getByText('1 of 4')).toBeInTheDocument();
});

test('when every step is done it says so', async () => {
  setup({ user: { _id: 's1', name: 'Asha', monthlySavings: 3000 }, skills: [{ _id: 's1', is_verified: true }] });
  expect(await screen.findByText(/all set/i)).toBeInTheDocument();
});

test('with no applications it invites the seeker to browse jobs', async () => {
  setup({ over: { getApplicationsBySeeker: () => Promise.resolve({ data: [] }) } });
  expect(await screen.findByText(/haven.t applied/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Browse jobs' })).toHaveAttribute('href', '/jobs');
});

test('one failing request only affects its own card, and that card can retry', async () => {
  let calls = 0;
  setup({ over: { getCreditScore: () => (++calls === 1 ? Promise.reject(new Error('boom')) : Promise.resolve({ data: { creditScore: { score: 88 } } })) } });
  expect(await screen.findByText('Party cook')).toBeInTheDocument();           // other cards still render
  expect(screen.getByText('House painter')).toBeInTheDocument();
  const credit = statCard('Credit score');
  expect(within(credit).getByText(/couldn.t load/i)).toBeInTheDocument();
  await userEvent.click(within(credit).getByRole('button', { name: 'Try again' }));
  expect(await within(credit).findByText('Excellent')).toBeInTheDocument();
});
