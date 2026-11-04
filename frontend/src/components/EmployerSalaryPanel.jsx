import React, { useEffect, useState, useCallback } from 'react';
import {
  getHiredSeekers, createSalaryAgreement, getEmployerSalaryAgreements,
  setSalaryAgreementStatus, recordSalaryPayment,
} from '../api';
import { rupees, shortDate, FREQUENCY_LABEL, STATUS_TONE, errorText } from './salaryFormat';
import { notify } from '../ui/toastBus';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';
import { Input, Select } from '../ui/Field';

const EMPTY_FORM = { employee_id: '', amount: '', frequency: 'monthly', description: '' };

export default function EmployerSalaryPanel({ employerId }) {
  const [agreements, setAgreements] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [agr, hired] = await Promise.all([getEmployerSalaryAgreements(), getHiredSeekers(employerId)]);
      setAgreements(agr.data.agreements);
      // one entry per person, even if they worked on several of this employer's jobs
      const byId = new Map();
      hired.data.forEach((exp) => { if (exp.seeker_id?._id) byId.set(exp.seeker_id._id, exp.seeker_id); });
      setEmployees([...byId.values()]);
    } catch (err) {
      setLoadError(errorText(err, 'Could not load salary records.'));
    } finally {
      setLoading(false);
    }
  }, [employerId]);
  useEffect(() => { load(); }, [load]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createSalaryAgreement({
        employee_id: form.employee_id, amount: Number(form.amount),
        frequency: form.frequency, description: form.description || undefined,
      });
      setForm(EMPTY_FORM); setShowForm(false);
      notify.success('Salary record created.');
      await load();
    } catch (err) { notify.error(errorText(err, 'Could not create the salary record.')); }
    finally { setCreating(false); }
  };

  const act = async (fn, success, failure) => {
    try { await fn(); if (success) notify.success(success); await load(); } catch (err) { notify.error(errorText(err, failure)); }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-48" /><Skeleton className="h-32 w-full" /></div>;
  if (loadError) return <EmptyState title={loadError} />;

  return (
    <div className="space-y-4">
      <div>
        <Button onClick={() => setShowForm((v) => !v)} variant={showForm ? 'secondary' : 'primary'}>
          {showForm ? 'Close' : 'New salary record'}
        </Button>
      </div>

      {showForm && (
        <Card title="New salary record">
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Select label="Employee" name="employee_id" required value={form.employee_id} onChange={handleChange}>
                <option value="">Select someone who has worked for you</option>
                {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name}{emp.phone_number ? ` (${emp.phone_number})` : ''}</option>)}
              </Select>
            </div>
            <Input label="Amount (₹)" name="amount" type="number" min="1" required value={form.amount} onChange={handleChange} />
            <Select label="How often" name="frequency" value={form.frequency} onChange={handleChange}>
              <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
            </Select>
            <div className="sm:col-span-2">
              <Input label="Note (optional)" name="description" maxLength={200} value={form.description} onChange={handleChange} placeholder="e.g. Monthly salary" />
            </div>
            <div className="sm:col-span-2"><Button type="submit" loading={creating}>Create</Button></div>
          </form>
        </Card>
      )}

      {agreements.length === 0 && (
        <Card>
          <EmptyState title="No salary records yet."
            description={employees.length === 0 ? 'You can create a record once someone has been hired for one of your jobs.' : undefined} />
        </Card>
      )}

      {agreements.map((a) => (
        <Card key={a._id} as="article">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-ink">{a.employee_id?.name || 'Employee'}</h3>
              <p className="text-sm text-muted">{rupees(a.amount)} per {FREQUENCY_LABEL[a.frequency]}{a.description ? ` · ${a.description}` : ''}</p>
              <p className="text-xs text-muted">Next due {shortDate(a.next_due_date)}</p>
            </div>
            <Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {a.status === 'active' && (
              <Button size="sm" onClick={() => act(() => recordSalaryPayment(a._id), 'Payment recorded.', 'Could not record the payment.')}>
                Record {rupees(a.amount)} paid
              </Button>
            )}
            {a.status === 'active' && <Button size="sm" variant="secondary" onClick={() => act(() => setSalaryAgreementStatus(a._id, 'paused'), null, 'Could not pause.')}>Pause</Button>}
            {a.status === 'paused' && <Button size="sm" variant="secondary" onClick={() => act(() => setSalaryAgreementStatus(a._id, 'active'), null, 'Could not resume.')}>Resume</Button>}
            {a.status !== 'ended' && <Button size="sm" variant="ghost" className="text-danger hover:bg-danger-tint" onClick={() => act(() => setSalaryAgreementStatus(a._id, 'ended'), null, 'Could not end.')}>End</Button>}
          </div>

          {a.payments.length > 0 && (
            <ul className="mt-4 divide-y divide-line text-sm">
              {[...a.payments].reverse().map((p) => (
                <li key={p._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="text-ink">
                    {shortDate(p.paid_on)} — {rupees(p.amount)}{p.note ? ` · ${p.note}` : ''}
                    {p.status === 'disputed' && p.dispute_reason ? ` · "${p.dispute_reason}"` : ''}
                  </span>
                  <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}
