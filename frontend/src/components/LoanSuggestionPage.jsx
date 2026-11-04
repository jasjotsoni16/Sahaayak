import React, { useState, useEffect } from 'react';
import API, { createLoanApplication } from '../api';

export default function LoanSuggestionPage() {
  const [loanSuggestions, setLoanSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyMessage, setApplyMessage] = useState('');
  const [applyError, setApplyError] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?._id;

  useEffect(() => {
    const fetchLoanSuggestions = async () => {
      if (!userId) {
        setError('User not logged in.');
        setLoading(false);
        return;
      }
      try {
        const response = await API.get(`/loan-suggestions/user/${userId}`);
        setLoanSuggestions(response.data);
      } catch (err) {
        setError('Failed to fetch loan suggestions: ' + (err.response?.data?.message || err.message));
        console.error('Error fetching loan suggestions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoanSuggestions();
  }, [userId]);

  const handleApplyLoan = async (suggestion) => {
    setApplyLoading(true);
    setApplyMessage('');
    setApplyError('');
    try {
      const payload = {
        user_id: userId,
        suggested_amount: suggestion.suggestedAmount,
        purpose: suggestion.businessPurpose,
        repayment_period_months: suggestion.loanTermYears * 12,
        interest_rate: suggestion.interestRate,
        business_name: suggestion.businessName,
        skill_name: suggestion.skillName,
        status: 'pending',
      };
      await createLoanApplication(payload);
      setApplyMessage(`Loan application submitted successfully for ${suggestion.skillName}!`);
    } catch (err) {
      setApplyError('Failed to submit loan application: ' + (err.response?.data?.message || err.message));
      console.error('Error submitting loan application:', err);
    } finally {
      setApplyLoading(false);
    }
  };

  const handleGenerateNewSuggestions = async () => {
    setGenerating(true);
    setError('');
    try {
      const response = await API.post(`/loan-suggestions/generate/${userId}`);
      setApplyMessage(response.data.message);
      // Refresh the suggestions
      const updatedResponse = await API.get(`/loan-suggestions/user/${userId}`);
      setLoanSuggestions(updatedResponse.data);
    } catch (err) {
      setError('Failed to generate new suggestions: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading loan suggestions...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-500 text-center mb-4">{error}</div>
        <div className="text-center">
          <button
            onClick={handleGenerateNewSuggestions}
            disabled={generating}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
          >
            {generating ? 'Generating...' : 'Generate Loan Suggestions'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI-Powered Loan Suggestions</h1>
        <button
          onClick={handleGenerateNewSuggestions}
          disabled={generating}
          className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
        >
          {generating ? 'Generating...' : 'Generate New Suggestions'}
        </button>
      </div>
      
      {applyMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{applyMessage}</div>}
      {applyError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{applyError}</div>}
      
      {loanSuggestions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loanSuggestions.map((suggestion, index) => (
            <div key={suggestion._id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-blue-600 mb-2">{suggestion.skillName} Business</h3>
                <p className="text-gray-600 text-sm mb-2">{suggestion.businessName}</p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="font-medium">Suggested Amount:</span>
                  <span className="text-green-600 font-bold">₹{suggestion.suggestedAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Loan Term:</span>
                  <span>{suggestion.loanTermYears} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Interest Rate:</span>
                  <span>{suggestion.interestRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Credit Score:</span>
                  <span className={`font-bold ${
                    suggestion.creditScoreAtSuggestion >= 80 ? 'text-green-600' :
                    suggestion.creditScoreAtSuggestion >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {suggestion.creditScoreAtSuggestion}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Monthly Savings:</span>
                  <span>₹{suggestion.monthlySavingsAtSuggestion?.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Purpose:</strong> {suggestion.businessPurpose}
                </p>
              </div>
              
              <button
                onClick={() => handleApplyLoan(suggestion)}
                disabled={applyLoading}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-300 disabled:opacity-50"
              >
                {applyLoading ? 'Applying...' : 'Apply for this Loan'}
              </button>
              
              <div className="mt-3 text-xs text-gray-500 text-center">
                Suggested on {new Date(suggestion.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No loan suggestions available</h3>
          <p className="text-gray-500 mb-4">Add skills to your profile to get personalized loan suggestions for starting skill-based businesses.</p>
          <button
            onClick={handleGenerateNewSuggestions}
            disabled={generating}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
          >
            {generating ? 'Generating...' : 'Generate Loan Suggestions'}
          </button>
        </div>
      )}
    </div>
  );
}
