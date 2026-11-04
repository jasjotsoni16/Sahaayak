import React, { useState, useEffect } from 'react';
import API from '../api';

export default function InvestmentOpportunitiesPage() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        // Assuming an endpoint for investors to browse proposals
        // This might be a filtered list (e.g., only 'accepted' or 'reviewed' proposals)
        const response = await API.get('/investors/proposals'); // Adjust this endpoint as needed
        setProposals(response.data.filter(p => p.status === 'accepted' || p.status === 'reviewed'));
      } catch (err) {
        setError('Failed to fetch investment opportunities.');
        console.error('Error fetching investment opportunities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProposals();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading investment opportunities...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Investment Opportunities</h1>

      {proposals.length === 0 ? (
        <p className="text-center text-gray-500">No investment opportunities available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proposals.map((proposal) => (
            <div key={proposal._id} className="bg-white p-6 rounded-lg shadow-md space-y-3">
              <h2 className="text-xl font-bold">Business Idea: {proposal.business_idea}</h2>
              <p><strong>Suggested Amount:</strong> ₹{proposal.suggested_amount}</p>
              <p><strong>Offered Equity:</strong> {proposal.offered_equity_percentage}%</p>
              {proposal.user_id && proposal.user_id.credit_score && (
                <p><strong>Credit Score:</strong> {proposal.user_id.credit_score.score}</p>
              )}
              <p><strong>Expected ROI:</strong> {proposal.expected_roi_months} months</p>
              {proposal.pitch_video_url && (
                <p><a href={proposal.pitch_video_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Watch Pitch Video</a></p>
              )}
              {/* Add more details and a button to express interest */}
              <button className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-300">
                Express Interest
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
