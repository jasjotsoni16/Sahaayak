import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateSavingsGoal } from '../api';
import { notify } from '../ui/toastBus';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Input } from '../ui/Field';

// The monthly savings goal lives on the user profile. It feeds the credit score,
// loan suggestions and the investment analyzer.
export default function SavingsGoalCard({ initialGoal = 0, onSaved }) {
  const navigate = useNavigate();
  const [goal, setGoal] = useState(String(initialGoal || ''));
  const [saved, setSaved] = useState(initialGoal || 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    const amount = Number(goal);
    if (!Number.isFinite(amount) || amount < 0) {
      notify.error('Enter a savings goal of 0 or more.');
      return;
    }
    setSaving(true);
    try {
      const res = await updateSavingsGoal(amount);
      setSaved(res.data.monthly_savings_goal);
      notify.success('Savings goal updated.');
      if (onSaved) onSaved(res.data.monthly_savings_goal);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not save your goal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Monthly savings goal">
      <p className="mb-4 text-sm text-muted">Setting a goal helps your credit score and the loan amounts we suggest.</p>
      <form onSubmit={handleSave} className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-56">
          <Input label="Amount per month (₹)" type="number" min="0" step="100" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </div>
        <Button type="submit" loading={saving}>Save goal</Button>
        {saved > 0 && (
          <Button variant="secondary" onClick={() => navigate('/investment-analyzer', { state: { monthly_savings_goal: saved } })}>
            Plan my savings
          </Button>
        )}
      </form>
    </Card>
  );
}
