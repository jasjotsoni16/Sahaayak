import React, { useState } from 'react';
import API from '../api';

export default function ReportJobAbuseModal({ isOpen, onClose, jobId, reportedUserId, reporterId, employerName }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const REASONS = [
    'Unpaid wages',
    'Unsafe working conditions',
    'Harassment',
    'Misleading job description',
    'Other',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        reported_job_id: jobId,
        report_type: 'job',
        reason,
        description,
      };
      await API.post('/reports', payload);
      setMessage('Report submitted successfully!');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError('Failed to submit report: ' + (err.response?.data?.message || err.message));
      console.error('Error submitting report:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Report Abuse for Job</h2>
        <p className="mb-4">Reporting employer: <strong>{employerName}</strong> for job ID: <strong>{jobId}</strong></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason</label>
            <select name="reason" id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
              <option value="">Select a reason</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea name="description" id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"></textarea>
          </div>
          {message && <p className="text-green-500 text-sm">{message}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-md">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-red-500 text-white rounded-md">
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
