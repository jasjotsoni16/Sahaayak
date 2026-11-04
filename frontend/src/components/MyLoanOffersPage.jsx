import React, { useState, useEffect } from 'react';
import API from '../api';

export default function MyLoanOffersPage() {
  const [loanOffers, setLoanOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchLoanOffers = async () => {
      if (!userId) {
        setError('User not logged in.');
        setLoading(false);
        return;
      }
      try {
        const response = await API.get(`/loans/user/${userId}`);
        setLoanOffers(response.data);
      } catch (err) {
        setError('Failed to fetch loan offers: ' + (err.response?.data?.message || err.message));
        console.error('Error fetching loan offers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoanOffers();
  }, [userId]);

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading your loan offers...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">My Loan Applications</h1>
      {loanOffers.length === 0 ? (
        <p className="text-center text-gray-500">You have not submitted any loan applications yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loanOffers.map((offer) => (
            <div key={offer._id} className="bg-white p-6 rounded-lg shadow-md space-y-2">
              <h2 className="text-xl font-semibold">Amount: ₹{offer.suggested_amount}</h2>
              <p><strong>Purpose:</strong> {offer.purpose}</p>
              <p><strong>Repayment Period:</strong> {offer.repayment_period_months} months</p>
              <p><strong>Interest Rate:</strong> {offer.interest_rate}%</p>
              <p><strong>Status:</strong> <span className="font-semibold capitalize">{offer.status}</span></p>
              <p className="text-sm text-gray-500">Applied On: {new Date(offer.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
