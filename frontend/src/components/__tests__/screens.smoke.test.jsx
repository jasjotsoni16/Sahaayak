import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import API, { getMySalaryAgreements, confirmSalaryPayment } from '../../api';
import LoginPage from '../LoginPage';
import SignupPage from '../SignupPage';
import JobCard from '../JobCard';
import SeekerSalaryPanel from '../SeekerSalaryPanel';
import SavingsGoalCard from '../SavingsGoalCard';
import { Toaster } from '../../ui/Toast';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts && opts.defaultValue) || key }) }));
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ login: jest.fn() }) }));
jest.mock('../LanguageSelector', () => () => require('react').createElement('div', { 'data-testid': 'lang' }));
jest.mock('../PlaceSearch', () => ({ value, onTextChange }) =>
  require('react').createElement('input', { 'aria-label': 'Location', value, onChange: (e) => onTextChange(e.target.value) }));
jest.mock('../../utils/translationHelpers', () => ({
  useDbTranslation: () => ({
    translateJobTitle: (x) => x, translateJobType: (x) => x, translateWageType: (x) => x, translateCityName: (x) => x,
  }),
}));
jest.mock('../../api', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
  BACKEND_ORIGIN: '',
  reverseGeocode: jest.fn(),
  getMySalaryAgreements: jest.fn(),
  confirmSalaryPayment: jest.fn(),
  disputeSalaryPayment: jest.fn(),
  updateSavingsGoal: jest.fn(),
}));

const inRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);
beforeEach(() => jest.clearAllMocks());

describe('LoginPage', () => {
  test('has labelled fields and a submit button', () => {
    inRouter(<LoginPage />);
    expect(screen.getByLabelText('Mobile number')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/signup');
  });

  test('shows the server error in an alert when login fails', async () => {
    API.post.mockRejectedValue({ response: { data: { error: 'Invalid credentials' } } });
    inRouter(<LoginPage />);
    await userEvent.type(screen.getByLabelText('Mobile number'), '9876543210');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
    expect(API.post).toHaveBeenCalledWith('/users/login', expect.objectContaining({ phone_number: '9876543210' }));
  });
});

describe('SignupPage', () => {
  test('employer fields appear only for the employer role', async () => {
    inRouter(<SignupPage />);
    expect(screen.queryByLabelText('Company name')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Employer' }));
    expect(screen.getByLabelText('Company name')).toBeInTheDocument();
    expect(screen.getByLabelText('GSTIN number')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Job seeker' }));
    expect(screen.queryByLabelText('Company name')).not.toBeInTheDocument();
  });

  test('sends the typed city and the role to the server', async () => {
    API.post.mockResolvedValue({ data: { user: { name: 'Asha', role: 'seeker' }, token: 't' } });
    inRouter(<SignupPage />);
    await userEvent.type(screen.getByLabelText('Full name'), 'Asha');
    await userEvent.type(screen.getByLabelText('Mobile number'), '9876543210');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.type(screen.getByLabelText('Location'), 'Chandigarh');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(API.post).toHaveBeenCalled());
    expect(API.post).toHaveBeenCalledWith('/users/signup', expect.objectContaining({ role: 'seeker', city: 'Chandigarh' }));
  });
});

describe('JobCard', () => {
  const job = { _id: 'j1', title: 'Cook', description: 'Canteen cook', job_type: 'full_time', wage_type: 'monthly',
    number_of_openings: 2, openings_hired: 0, salary_min: 10000, salary_max: 12000, city: 'Chandigarh',
    employer_id: { name: 'Sharma Canteen' }, distance_km: 1.2 };

  test('a seeker sees the details and can apply', async () => {
    const onApply = jest.fn();
    render(<JobCard job={job} userRole="seeker" applied={false} onApply={onApply} onViewDetails={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Cook' })).toBeInTheDocument();
    expect(screen.getByText(/Sharma Canteen/)).toBeInTheDocument();
    expect(screen.getByText(/1\.2 km/)).toBeInTheDocument();
    expect(screen.getByText(/₹10,000 – ₹12,000/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith('j1');
  });

  test('applied jobs offer "View details" instead of Apply', () => {
    render(<JobCard job={job} userRole="seeker" applied onApply={() => {}} onViewDetails={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View details' })).toBeInTheDocument();
  });

  test('a full job shows "No openings" and no Apply button', () => {
    render(<JobCard job={{ ...job, openings_hired: 2 }} userRole="seeker" applied={false} onApply={() => {}} onViewDetails={() => {}} />);
    expect(screen.getByText('No openings')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
  });

  test('an employer can open the applications', async () => {
    const onSee = jest.fn();
    render(<JobCard job={job} userRole="provider" onSeeApplications={onSee} />);
    await userEvent.click(screen.getByRole('button', { name: 'See applications' }));
    expect(onSee).toHaveBeenCalled();
  });
});

describe('SeekerSalaryPanel', () => {
  const agreement = {
    _id: 'a1', amount: 15000, frequency: 'monthly', status: 'active', description: 'Salary',
    next_due_date: '2026-12-01', employer_id: { name: 'Sharma Canteen' },
    payments: [{ _id: 'p1', amount: 15000, status: 'recorded', paid_on: '2026-11-01' }],
  };

  test('lists the agreement and lets the seeker confirm a recorded payment', async () => {
    getMySalaryAgreements.mockResolvedValue({ data: { agreements: [agreement] } });
    confirmSalaryPayment.mockResolvedValue({ data: {} });
    render(<><SeekerSalaryPanel /><Toaster /></>);
    expect(await screen.findByText('Sharma Canteen')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'I received this' }));
    expect(confirmSalaryPayment).toHaveBeenCalledWith('a1', 'p1');
    expect(await screen.findByText('Payment confirmed.')).toBeInTheDocument();
  });

  test('shows an empty state when there are no records', async () => {
    getMySalaryAgreements.mockResolvedValue({ data: { agreements: [] } });
    render(<SeekerSalaryPanel />);
    expect(await screen.findByText('No salary records yet.')).toBeInTheDocument();
  });
});

test('SavingsGoalCard rejects a negative goal with a toast and does not call the API', async () => {
  const { updateSavingsGoal } = require('../../api');
  render(<MemoryRouter><SavingsGoalCard initialGoal={0} /><Toaster /></MemoryRouter>);
  await userEvent.type(screen.getByLabelText('Amount per month (₹)'), '-5');
  await userEvent.click(screen.getByRole('button', { name: 'Save goal' }));
  expect(await screen.findByText('Enter a savings goal of 0 or more.')).toBeInTheDocument();
  expect(updateSavingsGoal).not.toHaveBeenCalled();
});
