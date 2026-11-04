import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { createJob, getSkills, getApplicationsBySeeker } from '../../api';
import PostJobPage from '../PostJobPage';
import ApplicationStatusPage from '../ApplicationStatusPage';
import { Toaster } from '../../ui/Toast';

jest.mock('../../api', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
  createJob: jest.fn(),
  getSkills: jest.fn(),
  getApplicationsBySeeker: jest.fn(),
}));
// The real picker is a Mapbox map. This stand-in just "picks" Mohali when asked.
jest.mock('../LocationPickerModal', () => ({ onSelect }) =>
  require('react').createElement('button', {
    onClick: () => onSelect({ city: 'Mohali', lat: 30.7046, lng: 76.7179, pincode: '160055' }),
  }, 'choose-mohali'));
jest.mock('../EmployerProfileView', () => ({ employerUserId }) =>
  require('react').createElement('div', null, `employer-profile:${employerUserId}`));

beforeEach(() => {
  jest.clearAllMocks();
  getSkills.mockResolvedValue({ data: [] }); // CRA resets mock implementations between tests
  localStorage.setItem('user', JSON.stringify({ _id: 'emp1', role: 'provider' }));
  localStorage.setItem('token', 't');
});

const fillAndSubmitJob = async () => {
  await userEvent.type(screen.getByLabelText('Job Title'), 'Delivery partner');
  await userEvent.type(screen.getByLabelText('Job Description'), 'Deliver orders');
  await userEvent.click(screen.getByRole('button', { name: 'Pick from Map' }));
  await userEvent.click(screen.getByText('choose-mohali'));
  await userEvent.click(screen.getByRole('button', { name: 'Post Job' }));
};

describe('Posting a job', () => {
  test('from the /post-job page (no onClose prop) it succeeds and returns to the jobs list', async () => {
    createJob.mockResolvedValue({ data: {} });
    render(
      <MemoryRouter initialEntries={['/post-job']}>
        <Routes>
          <Route path="/post-job" element={<PostJobPage />} />
          <Route path="/jobs" element={<div>jobs list</div>} />
        </Routes>
        <Toaster />
      </MemoryRouter>,
    );
    await fillAndSubmitJob();
    expect(await screen.findByText('jobs list')).toBeInTheDocument();
    expect(screen.queryByText(/onClose is not a function/i)).not.toBeInTheDocument();
    expect(createJob).toHaveBeenCalledTimes(1);
  });

  test('inside the Jobs popup it still calls the onClose it was given', async () => {
    createJob.mockResolvedValue({ data: {} });
    const onClose = jest.fn();
    render(<MemoryRouter><PostJobPage onClose={onClose} /></MemoryRouter>);
    await fillAndSubmitJob();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});

describe('My applications page', () => {
  const asSeeker = () => localStorage.setItem('user', JSON.stringify({ _id: 'seeker1', role: 'seeker' }));

  test('an application whose employer no longer exists does not offer a broken profile button', async () => {
    asSeeker();
    getApplicationsBySeeker.mockResolvedValue({ data: [
      { _id: 'a1', status: 'applied', job_id: { title: 'Fullstack Developer', employer_id: null } },
    ] });
    render(<ApplicationStatusPage />);
    expect(await screen.findByText('Fullstack Developer')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view employer profile/i })).not.toBeInTheDocument();
  });

  test('an application whose job was deleted still lists without crashing', async () => {
    asSeeker();
    getApplicationsBySeeker.mockResolvedValue({ data: [{ _id: 'a2', status: 'applied', job_id: null }] });
    render(<ApplicationStatusPage />);
    expect(await screen.findByText(/no longer available/i)).toBeInTheDocument();
  });

  test('with a real employer the profile button opens that employer', async () => {
    asSeeker();
    getApplicationsBySeeker.mockResolvedValue({ data: [
      { _id: 'a3', status: 'applied', job_id: { title: 'Cook', employer_id: { _id: 'emp9', name: 'Sharma Canteen' } } },
    ] });
    render(<ApplicationStatusPage />);
    await userEvent.click(await screen.findByRole('button', { name: /view employer profile/i }));
    expect(screen.getByText('employer-profile:emp9')).toBeInTheDocument();
  });
});
