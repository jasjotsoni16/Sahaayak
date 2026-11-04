import React, { useEffect, useState } from 'react';
import { getMySalaryAgreements, confirmSalaryPayment, disputeSalaryPayment } from '../api';
import { rupees, shortDate, FREQUENCY_LABEL, STATUS_TONE, errorText } from './salaryFormat';
import { notify } from '../ui/toastBus';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';
import { Input } from '../ui/Field';

export default function SeekerSalaryPanel() {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [disputing, setDisputing] = useState(null); // { agreementId, paymentId }
  const [reason, setReason] = useState('');

  const load = async () => {
    try {
      const res = await getMySalaryAgreements();
      setAgreements(res.data.agreements);
    } catch (err) {
      setLoadError(errorText(err, 'Could not load your salary records.'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const confirm = async (agreementId, paymentId) => {
    try { await confirmSalaryPayment(agreementId, paymentId); notify.success('Payment confirmed.'); await load(); }
    catch (err) { notify.error(errorText(err, 'Could not confirm this payment.')); }
  };

  const submitDispute = async (e) => {
    e.preventDefault();
    try {
      await disputeSalaryPayment(disputing.agreementId, disputing.paymentId, reason);
      setDisputing(null); setReason('');
      notify.info('Dispute sent to your employer.');
      await load();
    } catch (err) { notify.error(errorText(err, 'Could not dispute this payment.')); }
  };

  const confirmedTotal = agreements.reduce((n, a) => n + a.payments.filter((p) => p.status === 'confirmed').length, 0);

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>;
  if (loadError) return <EmptyState title={loadError} />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Confirm each payment when you receive it. <Badge tone="success">{confirmedTotal} confirmed so far</Badge>
      </p>

      {agreements.length === 0 && (
        <Card><EmptyState title="No salary records yet." description="They appear here when an employer you worked for sets one up." /></Card>
      )}

      {agreements.map((a) => (
        <Card key={a._id} as="article">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-ink">{a.employer_id?.name || 'Employer'}</h3>
              <p className="text-sm text-muted">{rupees(a.amount)} per {FREQUENCY_LABEL[a.frequency]}{a.description ? ` · ${a.description}` : ''}</p>
              <p className="text-xs text-muted">Next due {shortDate(a.next_due_date)}</p>
            </div>
            <Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge>
          </div>

          {a.payments.length > 0 && (
            <ul className="mt-4 divide-y divide-line">
              {[...a.payments].reverse().map((p) => (
                <li key={p._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <span className="text-ink">{shortDate(p.paid_on)} — {rupees(p.amount)}{p.note ? ` · ${p.note}` : ''}</span>
                  <span className="flex items-center gap-2">
                    <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                    {p.status === 'recorded' && (
                      <>
                        <Button size="sm" onClick={() => confirm(a._id, p._id)}>I received this</Button>
                        <Button size="sm" variant="secondary" onClick={() => setDisputing({ agreementId: a._id, paymentId: p._id })}>Not received</Button>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {disputing && disputing.agreementId === a._id && (
            <form onSubmit={submitDispute} className="mt-4 flex flex-wrap items-end gap-2">
              <div className="min-w-[200px] flex-1">
                <Input label="What went wrong?" required maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <Button type="submit" variant="danger">Send dispute</Button>
              <Button variant="secondary" onClick={() => { setDisputing(null); setReason(''); }}>Cancel</Button>
            </form>
          )}
        </Card>
      ))}
    </div>
  );
}
