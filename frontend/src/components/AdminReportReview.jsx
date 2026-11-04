import React, { useState, useEffect } from 'react';
import API from '../api';

export default function AdminReportReview() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await API.get('/reports');
      setReports(response.data);
    } catch (err) {
      setError('Failed to fetch reports.');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId, status) => {
    setMessage('');
    setError('');
    try {
      await API.put(`/reports/${reportId}/status`, { status });
      setMessage(`Report ${status} successfully!`);
      fetchReports(); // Refresh list
    } catch (err) {
      setError(`Failed to update report status to ${status}: ` + (err.response?.data?.message || err.message));
      console.error(`Error updating report status to ${status}:`, err);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading reports...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Report Review</h1>

      {reports.length === 0 ? (
        <p className="text-center text-gray-500">No reports to review.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report._id} className="bg-white p-6 rounded-lg shadow-md space-y-3">
              <h2 className="text-xl font-bold">Report Type: {report.report_type}</h2>
              <p><strong>Reason:</strong> {report.reason}</p>
              {report.description && <p><strong>Description:</strong> {report.description}</p>}
              <p><strong>Reporter:</strong> {report.reporter_id ? report.reporter_id.name : 'N/A'}</p>
              {report.reported_user_id && (
                <div className="border-t pt-2 mt-2">
                  <p><strong>Reported User:</strong> {report.reported_user_id.name} ({report.reported_user_id.email})</p>
                  <p><strong>Role:</strong> {report.reported_user_id.role}</p>
                  {report.reported_user_id.role === 'provider' && report.reported_user_id.employer_profile && (
                    <div className="ml-2 text-sm text-gray-600">
                      <p>Company: {report.reported_user_id.employer_profile.company_name}</p>
                      <p>Type: {report.reported_user_id.employer_profile.company_type}</p>
                      <p>GSTIN: {report.reported_user_id.employer_profile.gstin_number}</p>
                      <p>Verified: {report.reported_user_id.employer_profile.is_verified ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                  {report.reported_user_id.role === 'seeker' && (
                    <div className="ml-2 text-sm text-gray-600">
                      <p>Skills: {report.reported_user_id.skill_set.join(', ') || 'N/A'}</p>
                      <p>Income History: {report.reported_user_id.income_history || 'N/A'}</p>
                      <p>Credit Score: {report.reported_user_id.credit_score || 'N/A'}</p>
                    </div>
                  )}
                </div>
              )}
              {report.reported_job_id && <p><strong>Reported Job:</strong> {report.reported_job_id.title}</p>}
              {report.reported_tool_id && <p><strong>Reported Tool:</strong> {report.reported_tool_id.name}</p>}
              <p><strong>Status:</strong> <span className="font-semibold capitalize">{report.status.replace(/_/g, ' ')}</span></p>
              <div className="flex space-x-2 mt-4">
                {report.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(report._id, 'abuse_true')}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      Abuse True
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(report._id, 'false_accusation')}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      False Accusation
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(report._id, 'misunderstanding')}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                    >
                      Misunderstanding
                    </button>
                  </>
                )}
                {report.status !== 'resolved' && report.status !== 'rejected' && report.status !== 'false_accusation' && report.status !== 'misunderstanding' && report.status !== 'abuse_true' && (
                  <button
                    onClick={() => handleStatusUpdate(report._id, 'resolved')}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
