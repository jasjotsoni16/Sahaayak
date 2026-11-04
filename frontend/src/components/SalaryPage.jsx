import React from 'react';
import PageHeader from '../ui/PageHeader';
import EmptyState from '../ui/EmptyState';
import EmployerSalaryPanel from './EmployerSalaryPanel';
import SeekerSalaryPanel from './SeekerSalaryPanel';

export default function SalaryPage() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Salary records"
        subtitle="Employers record the salary they pay; employees confirm it. Confirmed payments build verified income."
      />
      {user?.role === 'provider' && <EmployerSalaryPanel employerId={user._id} />}
      {user?.role === 'seeker' && <SeekerSalaryPanel />}
      {user && user.role !== 'provider' && user.role !== 'seeker' && (
        <EmptyState title="Salary records are available to employers and job seekers." />
      )}
    </div>
  );
}
