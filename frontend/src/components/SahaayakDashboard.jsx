import React, { useState } from 'react';
import HiredSeekersList from './HiredSeekersList';
import OfferedSahaayaksPage from './OfferedSahaayaksPage';

export default function SahaayakDashboard() {
  const [activeTab, setActiveTab] = useState('hired'); // 'hired' or 'archived'
  const user = JSON.parse(localStorage.getItem('user'));
  const employerId = user ? user._id : null;

  if (!employerId) {
    return <div className="text-center py-8">Please log in as an employer to view this page.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Sahaayak Dashboard</h1>

        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`py-2 px-4 text-lg font-medium ${activeTab === 'hired' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('hired')}
          >
            Hired Sahaayak
          </button>
          <button
            className={`ml-4 py-2 px-4 text-lg font-medium ${activeTab === 'archived' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('archived')}
          >
            Archived Sahaayak
          </button>
          <button
            className={`ml-4 py-2 px-4 text-lg font-medium ${activeTab === 'offered' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('offered')}
          >
            Offered Sahaayaks
          </button>
        </div>

        <div>
          {activeTab === 'hired' && (
            <HiredSeekersList employerId={employerId} showArchived={false} />
          )}
          {activeTab === 'archived' && (
            <HiredSeekersList employerId={employerId} showArchived={true} />
          )}
          {activeTab === 'offered' && (
            <OfferedSahaayaksPage employerId={employerId} />
          )}
        </div>
      </div>
    </div>
  );
}
