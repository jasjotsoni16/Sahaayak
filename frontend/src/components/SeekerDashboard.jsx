import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API, { getCreditScore, getApplicationsBySeeker, getMySalaryAgreements, getJobs } from '../api';
import { useAuth } from '../contexts/AuthContext';
import useLoad from '../hooks/useLoad';
import Badge from '../ui/Badge';
import Skeleton from '../ui/Skeleton';
import { Icon } from '../ui/icons';
import { ScoreRing } from './home/Illustrations';
import { rupees } from './salaryFormat';
import {
  latestApplications, countInProgress, jobsForYou, isNewJob, pendingPayments, creditBand, greetingKey, employerName,
} from './dashboard/seekerData';

const STATUS_TONE = { applied: 'neutral', discussion: 'primary', negotiation: 'warning', hired: 'success', fired: 'danger', left: 'neutral' };
const BAND_TONE = { excellent: 'text-success', veryGood: 'text-success', good: 'text-primary', fair: 'text-warning', poor: 'text-danger' };

// "2 days ago" in the reader's language.
function relativeTime(date, lang) {
  if (!date) return '';
  const days = Math.round((new Date(date).getTime() - Date.now()) / 864e5);
  try {
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    if (Math.abs(days) < 7) return rtf.format(days, 'day');
    if (Math.abs(days) < 60) return rtf.format(Math.round(days / 7), 'week');
    return rtf.format(Math.round(days / 30), 'month');
  } catch (e) {
    return new Date(date).toLocaleDateString();
  }
}

// A white panel with a heading row (title on the left, an optional link on the right).
function Panel({ title, action, className = '', children }) {
  return (
    <section className={`rounded-card bg-surface p-5 shadow-card sm:p-6 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const PanelLink = ({ to, children }) => (
  <Link to={to} className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-primary hover:underline">
    {children}<Icon name="arrow" size={14} />
  </Link>
);

// Shown in place of a card's content when its request failed. Retrying only reloads that card.
function LoadError({ state, d }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
      <span>{d('couldNotLoad', "Couldn't load")}</span>
      <button type="button" onClick={state.reload} className="relative z-10 font-medium text-primary hover:underline">
        {d('retry', 'Try again')}
      </button>
    </div>
  );
}

// One summary tile. The whole tile is a link (stretched over the card) but it owns its own loading and
// error display, so a failed request stays local and can be retried without leaving the page.
function Stat({ to, icon, label, state, d, children }) {
  return (
    <div className="group relative rounded-card bg-surface p-5 shadow-card transition-shadow hover:shadow-overlay">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-tint text-primary">
          <Icon name={icon} size={18} />
        </span>
        <Link to={to} className="text-sm font-medium text-muted after:absolute after:inset-0 after:rounded-card group-hover:text-ink">
          {label}
        </Link>
      </div>
      <div className="mt-4 min-h-[3.5rem]">
        {state.loading ? <Skeleton className="h-9 w-20" /> : state.error ? <LoadError state={state} d={d} /> : children}
      </div>
    </div>
  );
}

const StatValue = ({ value, sub }) => (
  <>
    <p className="font-display text-3xl font-bold tracking-tight text-ink">{value}</p>
    {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
  </>
);

export default function SeekerDashboard() {
  const { t, i18n } = useTranslation();
  const lang = (i18n && i18n.language) || 'en';
  const d = (key, en, opts) => t(`dashboard.${key}`, { defaultValue: en, ...opts });
  const { user } = useAuth();
  const firstName = (user && user.name ? user.name : '').split(' ')[0];

  const credit = useLoad(() => getCreditScore().then((r) => r.data.creditScore), []);
  const applications = useLoad(() => getApplicationsBySeeker(user._id).then((r) => r.data), [user._id]);
  const salary = useLoad(() => getMySalaryAgreements().then((r) => r.data.agreements), []);
  const skills = useLoad(() => API.get(`/user-skills/${user._id}`).then((r) => r.data), [user._id]);
  const jobs = useLoad(() => getJobs({ showArchived: false }).then((r) => r.data), []);

  const greeting = {
    morning: d('goodMorning', 'Good morning'),
    afternoon: d('goodAfternoon', 'Good afternoon'),
    evening: d('goodEvening', 'Good evening'),
  }[greetingKey(new Date().getHours())];
  const today = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  const statusLabel = {
    applied: d('statusApplied', 'Applied'),
    discussion: d('statusDiscussion', 'In discussion'),
    negotiation: d('statusNegotiation', 'Negotiating'),
    hired: d('statusHired', 'Hired'),
    fired: d('statusEnded', 'Ended'),
    left: d('statusLeft', 'Left'),
  };
  const bandLabel = {
    excellent: d('bandExcellent', 'Excellent'),
    veryGood: d('bandVeryGood', 'Very good'),
    good: d('bandGood', 'Good'),
    fair: d('bandFair', 'Fair'),
    poor: d('bandPoor', 'Building up'),
  };
  const perUnit = {
    daily: d('perDay', '/ day'),
    weekly: d('perWeek', '/ week'),
    monthly: d('perMonth', '/ month'),
    per_task: d('perTask', '/ task'),
  };

  const pending = salary.data ? pendingPayments(salary.data) : 0;
  const skillCount = skills.data ? skills.data.length : 0;
  const verifiedSkills = skills.data ? skills.data.filter((s) => s.is_verified).length : 0;
  const score = credit.data ? credit.data.score : null;
  const band = score != null ? creditBand(score) : null;

  // Getting-started checklist. Each item is only judged once its data has loaded, so a failed
  // request never marks something done (or nags about it) by mistake.
  const checklist = [
    skills.data && { id: 'skill', to: '/skills', done: skillCount > 0, label: d('taskAddSkill', 'Add a skill you work in') },
    skills.data && { id: 'verify', to: '/skills', done: verifiedSkills > 0, label: d('taskVerifySkill', 'Get a skill verified') },
    applications.data && { id: 'apply', to: '/jobs', done: applications.data.length > 0, label: d('taskApply', 'Apply for your first job') },
    { id: 'goal', to: '/profile', done: Boolean(user && user.monthlySavings > 0), label: d('taskGoal', 'Set a monthly savings goal') },
  ].filter(Boolean);
  const doneCount = checklist.filter((c) => c.done).length;
  const checklistLoading = skills.loading || applications.loading;

  const recent = latestApplications(applications.data);
  const suggested = jobsForYou(jobs.data, applications.data);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{today}</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {firstName ? `${greeting}, ${firstName}` : greeting}
          </h1>
        </div>
        <Link to="/jobs" className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-card hover:bg-primary-hover">
          <Icon name="jobs" size={18} />{d('findWork', 'Find work')}
        </Link>
      </header>

      {pending > 0 && (
        <div role="status" className="flex flex-col gap-4 rounded-card border border-primary/20 bg-primary-tint p-5 sm:flex-row sm:items-center">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface text-primary shadow-card">
            <Icon name="salary" size={22} />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-ink">
              {d('pendingTitle', pending === 1 ? '1 salary payment is waiting for you' : '{{count}} salary payments are waiting for you', { count: pending })}
            </p>
            <p className="mt-0.5 text-sm text-muted">{d('pendingBody', 'Confirm the ones you received. Only confirmed payments count towards your credit score.')}</p>
          </div>
          <Link to="/salary" className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
            {d('reviewPayments', 'Review payments')}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat to="/credit-score" icon="chart" label={d('creditScore', 'Credit score')} state={credit} d={d}>
          <div className="flex items-center gap-3">
            <ScoreRing score={score || 0} size={56} stroke={6} />
            <div>
              <p className={`text-sm font-semibold ${BAND_TONE[band] || 'text-ink'}`}>{bandLabel[band]}</p>
              <p className="text-xs text-muted">{d('outOf100', 'out of 100')}</p>
            </div>
          </div>
        </Stat>
        <Stat to="/jobs" icon="jobs" label={d('inProgress', 'In progress')} state={applications} d={d}>
          <StatValue value={countInProgress(applications.data)} sub={d('applications', 'applications')} />
        </Stat>
        <Stat to="/salary" icon="salary" label={d('toConfirm', 'To confirm')} state={salary} d={d}>
          <StatValue value={pending} sub={d('salaryPayments', 'salary payments')} />
        </Stat>
        <Stat to="/skills" icon="skills" label={d('skills', 'Skills')} state={skills} d={d}>
          <StatValue value={skillCount} sub={d('verifiedCount', '{{count}} verified', { count: verifiedSkills })} />
          {skillCount > 0 && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
              <div className="h-full rounded-full bg-success" style={{ width: `${(verifiedSkills / skillCount) * 100}%` }} />
            </div>
          )}
        </Stat>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Panel
            title={d('myApplications', 'My applications')}
            action={applications.data && applications.data.length > 0 && <PanelLink to="/jobs?view=applications">{d('viewAll', 'View all')}</PanelLink>}
          >
            {applications.loading ? <ListSkeleton />
              : applications.error ? <LoadError state={applications} d={d} />
                : recent.length === 0 ? (
                  <EmptyHint
                    icon="document"
                    title={d('noApplications', "You haven't applied to any jobs yet.")}
                    body={d('noApplicationsBody', 'Apply in one tap. Employers near you will see your skills.')}
                    to="/jobs" cta={d('browseJobs', 'Browse jobs')}
                  />
                ) : (
                  <ul className="-mx-2 divide-y divide-line">
                    {recent.map((a) => {
                      const job = a.job_id;
                      return (
                        <li key={a._id}>
                          <Link to="/jobs?view=applications" className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-page">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-page text-muted">
                              <Icon name="jobs" size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`truncate font-medium ${job ? 'text-ink' : 'text-muted'}`}>
                                {job ? job.title : d('jobGone', 'Job no longer available')}
                              </p>
                              <p className="truncate text-sm text-muted">
                                {[job && employerName(job.employer_id), job && job.city, relativeTime(a.date_applied, lang)].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                            <Badge tone={STATUS_TONE[a.status] || 'neutral'}>{statusLabel[a.status] || a.status}</Badge>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
          </Panel>

          <Panel title={d('jobsForYou', 'Jobs for you')} action={<PanelLink to="/jobs">{d('seeAllJobs', 'See all jobs')}</PanelLink>}>
            {jobs.loading ? <ListSkeleton />
              : jobs.error ? <LoadError state={jobs} d={d} />
                : suggested.length === 0 ? (
                  <EmptyHint icon="pin" title={d('noJobs', 'No new jobs right now.')} body={d('noJobsBody', "We'll let you know when one near you opens up.")} />
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-3">
                    {suggested.map((j) => {
                      const left = j.number_of_openings - (j.openings_hired || 0);
                      return (
                        <li key={j._id}>
                          <Link to="/jobs" className="flex h-full flex-col rounded-xl border border-line p-4 transition-colors hover:border-primary/40 hover:bg-page">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium leading-snug text-ink">{j.title}</p>
                              {isNewJob(j) && <Badge tone="success" className="shrink-0">{d('new', 'New')}</Badge>}
                            </div>
                            <p className="mt-1 truncate text-sm text-muted">{employerName(j.employer_id)}</p>
                            <p className="mt-2 flex items-center gap-1 text-sm text-muted">
                              <Icon name="pin" size={14} />{j.city}
                            </p>
                            <div className="mt-auto pt-3">
                              {j.salary_min != null && j.salary_max != null && (
                                <p className="text-sm font-semibold text-ink">
                                  {rupees(j.salary_min)}–{rupees(j.salary_max)} <span className="font-normal text-muted">{perUnit[j.wage_type] || ''}</span>
                                </p>
                              )}
                              {left > 0 && (
                                <p className="mt-0.5 text-xs text-muted">
                                  {d('openingsLeft', left === 1 ? '1 opening left' : '{{count}} openings left', { count: left })}
                                </p>
                              )}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-6">
          <Panel
            title={d('gettingStarted', 'Getting started')}
            action={!checklistLoading && checklist.length > 0 && (
              <span className="text-sm text-muted">{d('progress', '{{done}} of {{total}}', { done: doneCount, total: checklist.length })}</span>
            )}
          >
            {checklistLoading ? <ListSkeleton rows={4} /> : (
              <>
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
                </div>
                {doneCount === checklist.length ? (
                  <p className="text-sm text-muted">{d('allSet', "You're all set. Nice work.")}</p>
                ) : (
                  <ul className="-mx-2">
                    {checklist.map((c) => (
                      <li key={c.id}>
                        {c.done ? (
                          <div className="flex min-h-[44px] items-center gap-3 px-2 text-sm text-muted">
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-success text-white"><Icon name="check" size={14} /></span>
                            <span className="line-through decoration-line">{c.label}</span>
                            <span className="sr-only">{d('done', 'Done')}</span>
                          </div>
                        ) : (
                          <Link to={c.to} className="flex min-h-[44px] items-center gap-3 rounded-lg px-2 text-sm font-medium text-ink hover:bg-page">
                            <span className="h-6 w-6 shrink-0 rounded-full border-2 border-line" aria-hidden="true" />
                            <span className="flex-1">{c.label}</span>
                            <Icon name="arrow" size={14} className="text-muted" />
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </Panel>

          <Panel title={d('shortcuts', 'Shortcuts')}>
            <ul className="grid grid-cols-2 gap-3">
              {[
                { to: '/map', icon: 'pin', label: d('jobsMap', 'Jobs map') },
                { to: '/credit-score', icon: 'chart', label: d('scoreReport', 'Score report') },
                { to: '/loan-suggestions', icon: 'money', label: d('loans', 'Loans') },
                { to: '/tool-sharing', icon: 'tools', label: d('tools', 'Borrow tools') },
              ].map((s) => (
                <li key={s.to}>
                  <Link to={s.to} className="flex h-full flex-col gap-2 rounded-xl border border-line p-3 text-sm font-medium text-ink transition-colors hover:border-primary/40 hover:bg-page">
                    <Icon name={s.icon} size={20} className="text-primary" />{s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ListSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div>
        </div>
      ))}
    </div>
  );
}

function EmptyHint({ icon, title, body, to, cta }) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-page text-muted"><Icon name={icon} size={22} /></span>
      <p className="mt-3 font-medium text-ink">{title}</p>
      {body && <p className="mt-1 max-w-xs text-sm text-muted">{body}</p>}
      {to && (
        <Link to={to} className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
          {cta}
        </Link>
      )}
    </div>
  );
}
