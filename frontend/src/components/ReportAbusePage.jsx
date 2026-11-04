import React, { useState } from 'react';
import API from '../api';

export default function ReportAbusePage() {
  const [formData, setFormData] = useState({
    reported_user_id: '',
    reported_job_id: '',
    reported_tool_id: '',
    report_type: 'user',
    reason: '',
    description: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const userLocal = JSON.parse(localStorage.getItem('user'));

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!userLocal || !userLocal._id) {
      setError('You must be logged in to submit a report.');
      setLoading(false);
      return;
    }

    try {
      const payload = { ...formData, reporter_id: userLocal._id };
      const response = await API.post('/reports', payload);
      setMessage('Report submitted successfully!');
      setFormData({
        reported_user_id: '',
        reported_job_id: '',
        reported_tool_id: '',
        report_type: 'user',
        reason: '',
        description: '',
      });
    } catch (err) {
      setError('Failed to submit report: ' + (err.response?.data?.message || err.message));
      console.error('Error submitting report:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Report Abuse</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md max-w-lg mx-auto space-y-4">
        <div>
          <label htmlFor="report_type" className="block text-sm font-medium text-gray-700">Report Type</label>
          <select name="report_type" id="report_type" value={formData.report_type} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
            <option value="user">User</option>
            <option value="job">Job</option>
            <option value="tool">Tool</option>
            <option value="other">Other</option>
          </select>
        </div>

        {formData.report_type === 'user' && (
          <div>
            <label htmlFor="reported_user_id" className="block text-sm font-medium text-gray-700">Reported User ID</label>
            <input type="text" name="reported_user_id" id="reported_user_id" value={formData.reported_user_id} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </div>
        )}

        {formData.report_type === 'job' && (
          <div>
            <label htmlFor="reported_job_id" className="block text-sm font-medium text-gray-700">Reported Job ID</label>
            <input type="text" name="reported_job_id" id="reported_job_id" value={formData.reported_job_id} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </div>
        )}

        {formData.report_type === 'tool' && (
          <div>
            <label htmlFor="reported_tool_id" className="block text-sm font-medium text-gray-700">Reported Tool ID</label>
            <input type="text" name="reported_tool_id" id="reported_tool_id" value={formData.reported_tool_id} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </div>
        )}

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason</label>
          <input type="text" name="reason" id="reason" value={formData.reason} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
          <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="3" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"></textarea>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300">
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
        {message && <p className="text-green-500 text-center mt-4">{message}</p>}
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </form>
    </div>
  );
}
