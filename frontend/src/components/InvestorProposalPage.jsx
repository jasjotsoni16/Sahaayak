import React, { useState, useEffect } from 'react';
import API from '../api';
import AgreementViewModal from './AgreementViewModal';

export default function InvestorProposalPage() {
  const [formData, setFormData] = useState({
    suggested_amount: '',
    offered_equity_percentage: '',
    business_idea: '',
    expected_monthly_revenue: '',
    expected_roi_months: '',
    pitch_video_url: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProposals, setUserProposals] = useState([]);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [selectedAgreementId, setSelectedAgreementId] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user ? user._id : null;

  useEffect(() => {
    if (userId) {
      fetchUserProposals();
    }
  }, [userId]);

  const fetchUserProposals = async () => {
    try {
      const response = await API.get(`/investors/proposals/user/${userId}`);
      setUserProposals(response.data);
    } catch (err) {
      console.error('Error fetching user proposals:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!userId) {
      setError('User not logged in. Please log in to submit a proposal.');
      setLoading(false);
      return;
    }

    try {
      const payload = { ...formData, user_id: userId };
      const response = await API.post('/investors/proposals', payload);
      setMessage('Investor proposal submitted successfully!');
      setFormData({
        suggested_amount: '',
        offered_equity_percentage: '',
        business_idea: '',
        expected_monthly_revenue: '',
        expected_roi_months: '',
        pitch_video_url: '',
      });
    } catch (err) {
      setError('Failed to submit proposal: ' + (err.response?.data?.message || err.message));
      console.error('Error submitting proposal:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Submit Investor Proposal</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md max-w-lg mx-auto space-y-4">
        <div>
          <label htmlFor="business_idea" className="block text-sm font-medium text-gray-700">Business Idea</label>
          <textarea name="business_idea" id="business_idea" value={formData.business_idea} onChange={handleChange} required rows="4" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"></textarea>
        </div>
        <div>
          <label htmlFor="suggested_amount" className="block text-sm font-medium text-gray-700">Suggested Investment Amount (₹)</label>
          <input type="number" name="suggested_amount" id="suggested_amount" value={formData.suggested_amount} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label htmlFor="offered_equity_percentage" className="block text-sm font-medium text-gray-700">Offered Equity Percentage (%)</label>
          <input type="number" name="offered_equity_percentage" id="offered_equity_percentage" value={formData.offered_equity_percentage} onChange={handleChange} required min="0" max="100" step="0.01" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label htmlFor="expected_monthly_revenue" className="block text-sm font-medium text-gray-700">Expected Monthly Revenue (₹)</label>
          <input type="number" name="expected_monthly_revenue" id="expected_monthly_revenue" value={formData.expected_monthly_revenue} onChange={handleChange} min="0" step="0.01" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label htmlFor="expected_roi_months" className="block text-sm font-medium text-gray-700">Expected ROI in Months</label>
          <input type="number" name="expected_roi_months" id="expected_roi_months" value={formData.expected_roi_months} onChange={handleChange} min="0" step="1" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label htmlFor="pitch_video_url" className="block text-sm font-medium text-gray-700">Pitch Video URL (Optional)</label>
          <input type="url" name="pitch_video_url" id="pitch_video_url" value={formData.pitch_video_url} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300">
          {loading ? 'Submitting...' : 'Submit Proposal'}
        </button>
        {message && <p className="text-green-500 text-center mt-4">{message}</p>}
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </form>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 text-center">Your Submitted Proposals</h2>
        {userProposals.length === 0 ? (
          <p className="text-center text-gray-500">You have not submitted any investment proposals yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProposals.map((proposal) => (
              <div key={proposal._id} className="bg-white p-6 rounded-lg shadow-md space-y-3">
                <h3 className="text-xl font-bold">Business Idea: {proposal.business_idea}</h3>
                <p><strong>Suggested Amount:</strong> ₹{proposal.suggested_amount}</p>
                <p><strong>Offered Equity:</strong> {proposal.offered_equity_percentage}%</p>
                <p><strong>Status:</strong> <span className="font-semibold capitalize">{proposal.status}</span></p>
                {proposal.status === 'funded' && proposal.agreement_id && (
                  <button
                    onClick={() => {
                      setSelectedAgreementId(proposal.agreement_id._id);
                      setShowAgreementModal(true);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mt-2"
                  >
                    View Agreement
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAgreementModal && selectedAgreementId && (
        <AgreementViewModal
          isOpen={showAgreementModal}
          onClose={() => setShowAgreementModal(false)}
          agreementId={selectedAgreementId}
          userId={userId}
          userRole={user.role}
          onAgreementSigned={fetchUserProposals}
        />
      )}
    </div>
  );
}
