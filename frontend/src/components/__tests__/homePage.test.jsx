import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import HomePage from '../HomePage';
import { useAuth } from '../../contexts/AuthContext';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts && opts.defaultValue) || key }) }));
jest.mock('../../contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../LanguageSelector', () => () => require('react').createElement('div', { 'data-testid': 'lang' }));

const renderHome = (auth) => {
  useAuth.mockReturnValue({ loading: false, user: null, ...auth });
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<div>seeker dashboard</div>} />
        <Route path="/employer-dashboard" element={<div>employer dashboard</div>} />
        <Route path="/admin/dashboard" element={<div>admin dashboard</div>} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('for a visitor who is not signed in', () => {
  test('explains the platform with one clear headline', () => {
    renderHome();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Work you can find Income you can prove');
    expect(screen.getByText(/gig jobs near you/i)).toBeInTheDocument();
  });

  test('offers Sign in and Get started, pointing to the right pages', () => {
    renderHome();
    const signIn = screen.getAllByRole('link', { name: 'Sign in' });
    const getStarted = screen.getAllByRole('link', { name: 'Get started' });
    expect(signIn.length).toBeGreaterThan(0);
    signIn.forEach((a) => expect(a).toHaveAttribute('href', '/login'));
    expect(getStarted.length).toBeGreaterThan(0);
    getStarted.forEach((a) => expect(a).toHaveAttribute('href', '/signup'));
  });

  test('the header has the sign in button visible at the top', () => {
    renderHome();
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });

  test('walks through how it works in three steps', () => {
    renderHome();
    const section = screen.getByRole('region', { name: 'How it works' });
    expect(within(section).getAllByRole('listitem')).toHaveLength(3);
    expect(within(section).getByText('Find work near you')).toBeInTheDocument();
    expect(within(section).getByText('Build verified skills')).toBeInTheDocument();
    expect(within(section).getByText('Keep a salary record')).toBeInTheDocument();
  });

  test('says who it is for: job seekers, employers and investors', () => {
    renderHome();
    const section = screen.getByRole('region', { name: 'Who it is for' });
    ['Job seekers', 'Employers', 'Investors'].forEach((who) => expect(within(section).getByRole('heading', { name: who })).toBeInTheDocument());
  });

  test('mentions the languages it supports and ends with a call to action', () => {
    renderHome();
    expect(screen.getByText('हिन्दी')).toBeInTheDocument();
    expect(screen.getByText('தமிழ்')).toBeInTheDocument();
    const closing = screen.getByRole('region', { name: 'Get started' });
    expect(within(closing).getByRole('link', { name: 'Create your account' })).toHaveAttribute('href', '/signup');
  });

  test('does not redirect', () => {
    renderHome();
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
  });
});

describe('for a visitor who is already signed in', () => {
  test('a job seeker goes straight to the seeker dashboard', () => {
    renderHome({ user: { role: 'seeker', name: 'Asha' } });
    expect(screen.getByText('seeker dashboard')).toBeInTheDocument();
  });

  test('an employer goes to the employer dashboard', () => {
    renderHome({ user: { role: 'provider', name: 'Rajesh' } });
    expect(screen.getByText('employer dashboard')).toBeInTheDocument();
  });

  test('an admin goes to the admin dashboard', () => {
    renderHome({ user: { role: 'admin', name: 'Admin' } });
    expect(screen.getByText('admin dashboard')).toBeInTheDocument();
  });

  test('while the session is still being checked it shows neither the pitch nor a redirect', () => {
    renderHome({ loading: true, user: null });
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });
});
