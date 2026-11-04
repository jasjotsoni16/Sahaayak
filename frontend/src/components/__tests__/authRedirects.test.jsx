import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import API from '../../api';
import LoginPage from '../LoginPage';
import SignupPage from '../SignupPage';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts && opts.defaultValue) || key }) }));
const mockLogin = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ login: mockLogin }) }));
jest.mock('../LanguageSelector', () => () => require('react').createElement('div'));
jest.mock('../PlaceSearch', () => ({ value, onTextChange }) =>
  require('react').createElement('input', { 'aria-label': 'Location', value, onChange: (e) => onTextChange(e.target.value) }));
jest.mock('../../api', () => ({ __esModule: true, default: { post: jest.fn(), get: jest.fn() }, reverseGeocode: jest.fn() }));

const stubs = (
  <>
    <Route path="/dashboard" element={<div>seeker dashboard</div>} />
    <Route path="/employer-dashboard" element={<div>employer dashboard</div>} />
    <Route path="/investment-opportunities" element={<div>investor home</div>} />
    <Route path="/profile" element={<div>profile page</div>} />
    <Route path="/skills" element={<div>skills page</div>} />
  </>
);
const renderAt = (path, element) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes><Route path={path} element={element} />{stubs}</Routes>
  </MemoryRouter>,
);

const logIn = async (role) => {
  API.post.mockResolvedValue({ data: { user: { _id: 'u1', name: 'Asha', role }, token: 'tok' } });
  renderAt('/login', <LoginPage />);
  await userEvent.type(screen.getByLabelText('Mobile number'), '9876543210');
  await userEvent.type(screen.getByLabelText('Password'), 'secret123');
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
};

beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); });

describe('after logging in each role lands on its own dashboard', () => {
  test('a job seeker goes to /dashboard (even with no skills yet; the dashboard nudges them)', async () => {
    await logIn('seeker');
    expect(await screen.findByText('seeker dashboard')).toBeInTheDocument();
    expect(API.get).not.toHaveBeenCalled(); // no extra request just to decide where to go
    expect(mockLogin).toHaveBeenCalledWith(expect.objectContaining({ role: 'seeker' }), 'tok');
  });
  test('an employer goes to the employer dashboard', async () => {
    await logIn('provider');
    expect(await screen.findByText('employer dashboard')).toBeInTheDocument();
  });
  test('an investor goes to the investment opportunities page', async () => {
    await logIn('investor');
    expect(await screen.findByText('investor home')).toBeInTheDocument();
  });
});

describe('after signing up', () => {
  const signUp = async (role) => {
    API.post.mockResolvedValue({ data: { user: { _id: 'n1', name: 'Asha', role }, token: 'tok' } });
    renderAt('/signup', <SignupPage />);
    if (role === 'provider') {
      await userEvent.click(screen.getByRole('radio', { name: 'Employer' }));
      await userEvent.type(screen.getByLabelText('Company name'), 'Sharma Canteen');
      await userEvent.selectOptions(screen.getByLabelText('Company type'), 'business');
      await userEvent.type(screen.getByLabelText('GSTIN number'), '22AAAAA0000A1Z5');
    }
    await userEvent.type(screen.getByLabelText('Full name'), 'Asha');
    await userEvent.type(screen.getByLabelText('Mobile number'), '9876543210');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await screen.findByText(/Welcome, Asha/); // the short welcome step, then the redirect
  };
  const redirected = { timeout: 3000 };

  test('a new seeker is taken to the seeker dashboard and the session is started', async () => {
    await signUp('seeker');
    await waitFor(() => expect(screen.getByText('seeker dashboard')).toBeInTheDocument(), redirected);
    expect(mockLogin).toHaveBeenCalledWith(expect.objectContaining({ role: 'seeker' }), 'tok');
  });

  test('a new employer reaches the employer dashboard (the old /employer/profile link did not exist)', async () => {
    await signUp('provider');
    await waitFor(() => expect(screen.getByText('employer dashboard')).toBeInTheDocument(), redirected);
  });
});
