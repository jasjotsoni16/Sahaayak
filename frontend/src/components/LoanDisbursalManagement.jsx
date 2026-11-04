import React, { useState, useEffect } from 'react';
import API from '../api';

export default function LoanDisbursalManagement() {
  const [loanOffers, setLoanOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [disbursedAmount, setDisbursedAmount] = useState('');
  const [repaymentDueDate, setRepaymentDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchLoanOffers();
  }, []);

  const fetchLoanOffers = async () => {
    try {
      // Assuming an admin endpoint to get all pending loan offers
      const response = await API.get('/loans'); // Adjust this endpoint as needed
      setLoanOffers(response.data.filter(offer => offer.status === 'approved')); // Only show approved offers for disbursal
    } catch (err) {
      setError('Failed to fetch loan offers.');
      console.error('Error fetching loan offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisburse = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!selectedOffer) {
      setError('Please select a loan offer to disburse.');
      return;
    }

    try {
      const payload = {
        loan_offer_id: selectedOffer._id,
        disbursed_amount: parseFloat(disbursedAmount),
        repayment_due_date: repaymentDueDate,
        // payment_schedule: [], // This would be calculated based on repayment_due_date and period
      };
      await API.post('/loans/disburse', payload);
      setMessage('Loan disbursed successfully!');
      setSelectedOffer(null);
      setDisbursedAmount('');
      setRepaymentDueDate('');
      fetchLoanOffers(); // Refresh list
    } catch (err) {
      setError('Failed to disburse loan: ' + (err.response?.data?.message || err.message));
      console.error('Error disbursing loan:', err);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading loan offers...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Loan Disbursal Management</h1>

      <div className="bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Approved Loan Offers</h2>
        {loanOffers.length === 0 ? (
          <p className="text-gray-500">No approved loan offers to disburse.</p>
        ) : (
          <ul className="space-y-3">
            {loanOffers.map((offer) => (
              <li
                key={offer._id}
                className={`p-4 border rounded-md cursor-pointer ${selectedOffer && selectedOffer._id === offer._id ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-gray-200'}`}
                onClick={() => setSelectedOffer(offer)}
              >
                <p><strong>User ID:</strong> {offer.user_id}</p>
                <p><strong>Suggested Amount:</strong> ₹{offer.suggested_amount}</p>
                <p><strong>Purpose:</strong> {offer.purpose}</p>
                <p><strong>Interest Rate:</strong> {offer.interest_rate}%</p>
              </li>
            ))}
          </ul>
        )}

        {selectedOffer && (
          <form onSubmit={handleDisburse} className="mt-6 space-y-4 border-t pt-4">
            <h2 className="text-2xl font-bold mb-4">Disburse Loan for {selectedOffer.user_id}</h2>
            <div>
              <label htmlFor="disbursedAmount" className="block text-sm font-medium text-gray-700">Disbursed Amount (₹)</label>
              <input type="number" name="disbursedAmount" id="disbursedAmount" value={disbursedAmount} onChange={(e) => setDisbursedAmount(e.target.value)} required min="0" step="0.01" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label htmlFor="repaymentDueDate" className="block text-sm font-medium text-gray-700">Repayment Due Date</label>
              <input type="date" name="repaymentDueDate" id="repaymentDueDate" value={repaymentDueDate} onChange={(e) => setRepaymentDueDate(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <button type="submit" className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-300">
              Disburse Loan
            </button>
            {message && <p className="text-green-500 text-center mt-4">{message}</p>}
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
