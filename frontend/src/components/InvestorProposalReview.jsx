import React, { useState, useEffect } from 'react';
import API from '../api';
import AgreementViewModal from './AgreementViewModal';

export default function InvestorProposalReview() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [selectedAgreementId, setSelectedAgreementId] = useState(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      // Assuming an admin endpoint to get all pending investor proposals
      const response = await API.get('/investors/proposals'); // Adjust this endpoint as needed
      setProposals(response.data.filter(proposal => proposal.status === 'pending' || proposal.status === 'reviewed'));
    } catch (err) {
      setError('Failed to fetch investor proposals.');
      console.error('Error fetching investor proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (proposalId, status) => {
    setMessage('');
    setError('');
    try {
      const response = await API.put(`/investors/proposals/${proposalId}/status`, { status });
      setMessage(`Proposal ${status} successfully!`);
      fetchProposals(); // Refresh list
      if (status === 'funded' && response.data.agreement_id) {
        setSelectedAgreementId(response.data.agreement_id._id);
        setShowAgreementModal(true);
      }
    } catch (err) {
      setError(`Failed to update proposal status to ${status}: ` + (err.response?.data?.message || err.message));
      console.error(`Error updating proposal status to ${status}:`, err);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading investor proposals...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Investor Proposal Review</h1>

      {proposals.length === 0 ? (
        <p className="text-center text-gray-500">No investor proposals to review.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proposals.map((proposal) => (
            <div key={proposal._id} className="bg-white p-6 rounded-lg shadow-md space-y-3">
              <h2 className="text-xl font-bold">Business Idea: {proposal.business_idea}</h2>
              <p><strong>User ID:</strong> {proposal.user_id}</p>
              {proposal.user_id && proposal.user_id.credit_score && (
                <p><strong>Credit Score:</strong> {proposal.user_id.credit_score.score}</p>
              )}
              <p><strong>Suggested Amount:</strong> ₹{proposal.suggested_amount}</p>
              <p><strong>Offered Equity:</strong> {proposal.offered_equity_percentage}%</p>
              <p><strong>Expected ROI:</strong> {proposal.expected_roi_months} months</p>
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
              {proposal.pitch_video_url && (
                <p><a href={proposal.pitch_video_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Watch Pitch Video</a></p>
              )}
              <div className="flex space-x-2 mt-4">
                {proposal.status !== 'accepted' && proposal.status !== 'funded' && (
                  <button
                    onClick={() => handleStatusUpdate(proposal._id, 'accepted')}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Accept
                  </button>
                )}
                {proposal.status !== 'rejected' && (
                  <button
                    onClick={() => handleStatusUpdate(proposal._id, 'rejected')}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Reject
                  </button>
                )}
                {proposal.status === 'accepted' && (
                  <button
                    onClick={() => handleStatusUpdate(proposal._id, 'funded')}
                    className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                  >
                    Mark as Funded
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAgreementModal && selectedAgreementId && (
        <AgreementViewModal
          isOpen={showAgreementModal}
          onClose={() => setShowAgreementModal(false)}
          agreementId={selectedAgreementId}
          userId={JSON.parse(localStorage.getItem('user'))._id}
          userRole={JSON.parse(localStorage.getItem('user')).role}
          onAgreementSigned={fetchProposals}
        />
      )}
    </div>
  );
}