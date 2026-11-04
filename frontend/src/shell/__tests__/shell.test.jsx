import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppShell from '../AppShell';
import { useAuth } from '../../contexts/AuthContext';

jest.mock('../../contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts && opts.defaultValue) || key }) }));
// createElement (not JSX) inside factories: babel-plugin-jest-hoist rejects out-of-scope JSX helpers
jest.mock('../../components/NotificationBell', () => () => require('react').createElement('div', { 'data-testid': 'bell' }));
jest.mock('../../components/LanguageSelector', () => () => require('react').createElement('div', { 'data-testid': 'lang' }));

const renderShell = (user, path = '/jobs', logout = jest.fn()) => {
  useAuth.mockReturnValue({ user, loading: false, logout });
  render(<MemoryRouter initialEntries={[path]}><AppShell><div>page content</div></AppShell></MemoryRouter>);
  return logout;
};

const seeker = { name: 'Asha', role: 'seeker' };

test('logged-out visitors get the page without any chrome', () => {
  useAuth.mockReturnValue({ user: null, loading: false, logout: jest.fn() });
  render(<MemoryRouter><AppShell><div>login form</div></AppShell></MemoryRouter>);
  expect(screen.getByText('login form')).toBeInTheDocument();
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});

test('shows the page content and role-specific links in the top bar and tab bar', () => {
  renderShell(seeker);
  expect(screen.getByText('page content')).toBeInTheDocument();
  const top = screen.getByRole('navigation', { name: 'Main' });
  const tabs = screen.getByRole('navigation', { name: 'Primary' });
  expect(within(top).getByRole('link', { name: 'Jobs' })).toBeInTheDocument();
  expect(within(tabs).getByRole('link', { name: 'Salary' })).toBeInTheDocument();
  expect(screen.getByTestId('bell')).toBeInTheDocument();
});

test('the active destination is marked', () => {
  renderShell(seeker, '/salary');
  const tabs = screen.getByRole('navigation', { name: 'Primary' });
  expect(within(tabs).getByRole('link', { name: 'Salary' })).toHaveAttribute('aria-current', 'page');
  expect(within(tabs).getByRole('link', { name: 'Jobs' })).not.toHaveAttribute('aria-current');
});

test('"More" on a phone opens a sheet with the remaining links', async () => {
  renderShell(seeker);
  const tabs = screen.getByRole('navigation', { name: 'Primary' });
  await userEvent.click(within(tabs).getByRole('button', { name: 'More' }));
  const sheet = screen.getByRole('dialog', { name: 'More' });
  expect(within(sheet).getByRole('link', { name: 'Loans' })).toBeInTheDocument();
  expect(within(sheet).getByRole('link', { name: 'Profile' })).toBeInTheDocument();
});

test('log out is available and calls logout', async () => {
  const logout = renderShell(seeker);
  const tabs = screen.getByRole('navigation', { name: 'Primary' });
  await userEvent.click(within(tabs).getByRole('button', { name: 'More' }));
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Log out' }));
  expect(logout).toHaveBeenCalledTimes(1);
});
