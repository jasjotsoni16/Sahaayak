import React, { useState } from 'react';
import { motion } from 'framer-motion';
import LoanSuggestionPage from './LoanSuggestionPage';
import MyLoanOffersPage from './MyLoanOffersPage';
import InvestorProposalPage from './InvestorProposalPage';

export default function LoanDashboard() {
  const [selectedTab, setSelectedTab] = useState('suggest'); // 'suggest', 'my-offers', 'proposals'

  return (
    <motion.div className="min-h-screen bg-background text-gray-800">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold mb-8 text-center">Loans & Investments</h1>

        <div className="flex justify-center mb-6">
          <button
            className={`py-2 px-6 rounded-t-lg font-semibold ${selectedTab === 'suggest' ? 'bg-white text-primary shadow' : 'bg-gray-200 text-gray-600'}`}
            onClick={() => setSelectedTab('suggest')}
          >
            Loan Suggestion
          </button>
          <button
            className={`py-2 px-6 rounded-t-lg font-semibold ${selectedTab === 'my-offers' ? 'bg-white text-primary shadow' : 'bg-gray-200 text-gray-600'}`}
            onClick={() => setSelectedTab('my-offers')}
          >
            My Loan Offers
          </button>
          <button
            className={`py-2 px-6 rounded-t-lg font-semibold ${selectedTab === 'proposals' ? 'bg-white text-primary shadow' : 'bg-gray-200 text-gray-600'}`}
            onClick={() => setSelectedTab('proposals')}
          >
            Investor Proposal
          </button>
        </div>

        <div className="bg-white rounded-b-lg shadow-xl p-6">
          {selectedTab === 'suggest' && <LoanSuggestionPage />}
          {selectedTab === 'my-offers' && <MyLoanOffersPage />}
          {selectedTab === 'proposals' && <InvestorProposalPage />}
        </div>
      </div>
    </motion.div>
  );
}
