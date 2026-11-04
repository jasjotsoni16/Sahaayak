import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ToolListingPage from './ToolListingPage';
import AddToolPage from './AddToolPage';
import MyToolLoansPage from './MyToolLoansPage';

export default function ToolSharingDashboard() {
  const [selectedTab, setSelectedTab] = useState('browse'); // 'browse', 'add', 'my-loans'
  const [selectedMyLoansSubTab, setSelectedMyLoansSubTab] = useState('my-tools'); // 'my-tools', 'borrowed', 'lendings', 'requests'

  return (
    <motion.div className="min-h-screen bg-background text-gray-800">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold mb-8 text-center">Tool Sharing</h1>

        <div className="flex justify-center mb-6">
          <button
            className={`py-2 px-6 rounded-t-lg font-semibold ${selectedTab === 'browse' ? 'bg-white text-primary shadow' : 'bg-gray-200 text-gray-600'}`}
            onClick={() => setSelectedTab('browse')}
          >
            Browse Tools
          </button>
          <button
            className={`py-2 px-6 rounded-t-lg font-semibold ${selectedTab === 'add' ? 'bg-white text-primary shadow' : 'bg-gray-200 text-gray-600'}`}
            onClick={() => setSelectedTab('add')}
          >
            List My Tool
          </button>
          <button
            className={`py-2 px-6 rounded-t-lg font-semibold ${selectedTab === 'my-loans' ? 'bg-white text-primary shadow' : 'bg-gray-200 text-gray-600'}`}
            onClick={() => setSelectedTab('my-loans')}
          >
            My Tool Loans
          </button>
        </div>

        <div className="bg-white rounded-b-lg shadow-xl p-6">
          {selectedTab === 'browse' && <ToolListingPage />}
          {selectedTab === 'add' && <AddToolPage />}
          {selectedTab === 'my-loans' && (
            <>
              <div className="flex justify-center mb-4">
                <button
                  className={`py-2 px-4 rounded-md font-semibold text-sm ${selectedMyLoansSubTab === 'my-tools' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setSelectedMyLoansSubTab('my-tools')}
                >
                  My Tools for Rent
                </button>
                <button
                  className={`ml-2 py-2 px-4 rounded-md font-semibold text-sm ${selectedMyLoansSubTab === 'borrowed' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setSelectedMyLoansSubTab('borrowed')}
                >
                  Borrowed
                </button>
                <button
                  className={`ml-2 py-2 px-4 rounded-md font-semibold text-sm ${selectedMyLoansSubTab === 'lendings' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setSelectedMyLoansSubTab('lendings')}
                >
                  Lendings
                </button>
                <button
                  className={`ml-2 py-2 px-4 rounded-md font-semibold text-sm ${selectedMyLoansSubTab === 'requests' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setSelectedMyLoansSubTab('requests')}
                >
                  Requests
                </button>
              </div>
              <MyToolLoansPage selectedSubTab={selectedMyLoansSubTab} />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
