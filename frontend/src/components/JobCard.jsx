import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDbTranslation } from '../utils/translationHelpers';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { rupees } from './salaryFormat';

// One job in the list. Presentational: the page owns the data and the handlers.
export default function JobCard({ job, userRole, applied, archived = false, onApply, onViewDetails, onSeeApplications }) {
  const { t } = useTranslation();
  const { translateJobTitle, translateJobType, translateWageType, translateCityName } = useDbTranslation();
  const openings = job.number_of_openings - job.openings_hired;
  const closed = job.is_archived || openings <= 0;
  const employer = job.employer_id;
  const wage = job.salary_min && job.salary_max ? `${rupees(job.salary_min)} – ${rupees(job.salary_max)}` : null;

  return (
    <Card as="article">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-ink">{translateJobTitle(job.title)}</h3>
          <p className="mt-0.5 text-sm text-muted">
            {employer && employer.name ? `${employer.name} · ` : ''}{translateCityName(job.city)}
            {typeof job.distance_km === 'number' ? ` · ${job.distance_km} km` : ''}
          </p>
        </div>
        {wage && (
          <p className="text-right text-base font-semibold text-ink">
            {wage}
            <span className="block text-xs font-normal text-muted">{translateWageType(job.wage_type)}</span>
          </p>
        )}
      </div>

      {job.description && <p className="mt-3 line-clamp-2 text-sm text-muted">{job.description}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone="primary">{translateJobType(job.job_type)}</Badge>
        {!archived && <Badge>{t('jobs.openingsLeft', { defaultValue: 'Openings left' })}: {Math.max(openings, 0)}</Badge>}
        {(job.is_archived || archived) && <Badge tone="warning">{t('jobs.archived', { defaultValue: 'Archived' })}</Badge>}
      </div>

      {!archived && (
        <div className="mt-4 flex flex-wrap gap-2">
          {userRole === 'seeker' && (closed
            ? <span className="py-2 text-sm font-medium text-danger">{t('jobs.noOpenings', { defaultValue: 'No openings' })}</span>
            : applied
              ? <Button variant="secondary" onClick={() => onViewDetails(job)}>{t('common.view', { defaultValue: 'View details' })}</Button>
              : <Button onClick={() => onApply(job._id)}>{t('jobs.apply', { defaultValue: 'Apply' })}</Button>)}
          {userRole === 'seeker' && !closed && !applied && (
            <Button variant="ghost" onClick={() => onViewDetails(job)}>{t('common.view', { defaultValue: 'View details' })}</Button>
          )}
          {userRole === 'provider' && (
            <Button variant="secondary" onClick={() => onSeeApplications(job)}>{t('jobs.seeApplications', { defaultValue: 'See applications' })}</Button>
          )}
        </div>
      )}
    </Card>
  );
}
