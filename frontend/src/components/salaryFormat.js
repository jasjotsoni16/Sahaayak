export const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const shortDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const FREQUENCY_LABEL = { daily: 'day', weekly: 'week', monthly: 'month' };

// Badge tone for each agreement / payment status
export const STATUS_TONE = {
  active: 'success', paused: 'warning', ended: 'neutral',
  recorded: 'primary', confirmed: 'success', disputed: 'danger',
};

export const errorText = (err, fallback) => err.response?.data?.error || fallback;
