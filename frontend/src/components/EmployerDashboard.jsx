import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../api';
import RatingModal from './RatingModal';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';

const QUICK_ACTIONS = [
  { to: '/employer-profile', label: 'View or edit profile' },
  { to: '/post-job', label: 'Post a new job' },
  { to: '/jobs', label: 'My job listings' },
  { to: '/employer-agreements', label: 'Agreements' },
  { to: '/salary', label: 'Salary records' },
];

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [employerProfile, setEmployerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hiredSeekers, setHiredSeekers] = useState([]);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [currentRatingProps, setCurrentRatingProps] = useState({});

  const fetchEmployerData = async () => {
    try {
      const employerRes = await API.get('/employer');
      setEmployerProfile(employerRes.data);

      const hiredSeekersRes = await API.get(`/user-experiences/hired-seekers/${employerRes.data.user_id}`);
      setHiredSeekers(hiredSeekersRes.data);
    } catch (err) {
      setError('Failed to load employer data.');
      console.error('Error fetching employer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployerData();
  }, []);

  const openRatingModal = (jobId, receiverId) => {
    setCurrentRatingProps({
      job_id: jobId,
      giver_user_id: user._id,
      receiver_user_id: receiverId,
      role_of_giver: user.role,
    });
    setIsRatingModalOpen(true);
  };

  const closeRatingModal = () => {
    setIsRatingModalOpen(false);
    setCurrentRatingProps({});
    fetchEmployerData(); // Refresh data after rating
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) return <EmptyState title={error} />;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Dashboard" subtitle={employerProfile ? `Welcome, ${employerProfile.company_name}` : undefined} />

      {employerProfile && (
        <Card title="Your company">
          <div className="mb-3">
            {employerProfile.is_verified
              ? <Badge tone="success">Verified employer</Badge>
              : <Badge tone="warning">Verification pending</Badge>}
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted">Company type</dt><dd className="capitalize text-ink">{employerProfile.company_type}</dd></div>
            <div><dt className="text-muted">GSTIN</dt><dd className="text-ink">{employerProfile.gstin_number}</dd></div>
          </dl>
        </Card>
      )}

      <Card title="Quick actions">
        <ul className="-mx-2">
          {QUICK_ACTIONS.map((a) => (
            <li key={a.to}>
              <Link to={a.to} className="flex min-h-[44px] items-center justify-between rounded-lg px-2 text-ink hover:bg-page">
                {a.label}<span aria-hidden="true" className="text-muted">›</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {employerProfile && hiredSeekers.length > 0 && (
        <Card title="Employees">
          <ul className="divide-y divide-line">
            {hiredSeekers.map((seekerExp) => (
              <li key={seekerExp._id} className="py-3 first:pt-0 last:pb-0">
                <p className="font-medium text-ink">{seekerExp.seeker_id.name}</p>
                <p className="text-sm text-muted">{seekerExp.job_id.title}</p>
                <p className="text-sm text-muted">
                  {new Date(seekerExp.date_joined).toLocaleDateString()} – {seekerExp.date_left ? new Date(seekerExp.date_left).toLocaleDateString() : 'Present'}
                </p>
                {seekerExp.date_left && (
                  <div className="mt-2">
                    <Button size="sm" variant="secondary" onClick={() => openRatingModal(seekerExp.job_id._id, seekerExp.seeker_id._id)}>
                      Rate {seekerExp.seeker_id.name}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isRatingModalOpen && (
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={closeRatingModal}
          job_id={currentRatingProps.job_id}
          giver_user_id={currentRatingProps.giver_user_id}
          receiver_user_id={currentRatingProps.receiver_user_id}
          role_of_giver={currentRatingProps.role_of_giver}
        />
      )}
    </div>
  );
}
