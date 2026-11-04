import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getOffersForEmployer } from '../api';
import AgreementViewModal from './AgreementViewModal';

const EmployerAgreementsPage = ({ employerId: propEmployerId }) => {
  const { user } = useAuth();
  const employerId = propEmployerId || user?._id;
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [selectedAgreementId, setSelectedAgreementId] = useState(null);

  const fetchAgreements = async () => {
    if (!employerId) {
      setError('Employer ID not available.');
      setLoading(false);
      return;
    }
    
    try {
      const response = await getOffersForEmployer(employerId);
      // Filter only accepted offers that have agreements
      const acceptedOffersWithAgreements = response.data.filter(offer => 
        offer.status === 'accepted' && offer.agreement_id
      );
      setAgreements(acceptedOffersWithAgreements);
    } catch (err) {
      setError('Failed to fetch agreements.');
      console.error('Error fetching agreements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, [employerId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'fully_signed':
        return 'text-green-600 bg-green-100';
      case 'signed_by_employer':
        return 'text-blue-600 bg-blue-100';
      case 'signed_by_seeker':
        return 'text-yellow-600 bg-yellow-100';
      case 'pending_signing':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'fully_signed':
        return 'Fully Signed';
      case 'signed_by_employer':
        return 'Signed by You';
      case 'signed_by_seeker':
        return 'Signed by Employee';
      case 'pending_signing':
        return 'Pending Signatures';
      default:
        return status;
    }
  };

  if (loading) return <div className="text-center p-8">Loading agreements...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Employment Agreements</h2>
      
      {agreements.length === 0 ? (
        <div className="text-center p-8">
          <div className="text-gray-500 text-lg mb-4">No agreements found</div>
          <p className="text-gray-400">Agreements will appear here once job offers are accepted.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agreements.map(offer => (
            <div key={offer._id} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {offer.job_id ? offer.job_id.title : 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Employee: {offer.seeker_id ? offer.seeker_id.name : 'N/A'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  getStatusColor(offer.agreement_id?.status || 'pending_signing')
                }`}>
                  {getStatusText(offer.agreement_id?.status || 'pending_signing')}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Wage:</span>
                  <span className="font-medium">₹{offer.offered_wage} {offer.offered_wage_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-medium">
                    {offer.agreement_id?.created_at ? 
                      new Date(offer.agreement_id.created_at).toLocaleDateString() : 
                      'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Agreement ID:</span>
                  <span className="font-mono text-xs">
                    {offer.agreement_id?._id ? 
                      `...${offer.agreement_id._id.slice(-8)}` : 
                      'N/A'
                    }
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    console.log('View Agreement clicked for offer:', offer);
                    console.log('Agreement ID:', offer.agreement_id);
                    setSelectedAgreementId(offer.agreement_id._id);
                    setShowAgreementModal(true);
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  View Agreement
                </button>
                
                {offer.agreement_id?.status === 'pending_signing' && (
                  <button
                    onClick={() => {
                      setSelectedAgreementId(offer.agreement_id._id);
                      setShowAgreementModal(true);
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Sign Now
                  </button>
                )}
              </div>

              {/* Progress Indicator */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Employer</span>
                  <span>Employee</span>
                </div>
                <div className="flex space-x-1">
                  <div className={`flex-1 h-2 rounded-l ${
                    offer.agreement_id?.status === 'signed_by_employer' || 
                    offer.agreement_id?.status === 'fully_signed' ? 
                    'bg-green-400' : 'bg-gray-200'
                  }`}></div>
                  <div className={`flex-1 h-2 rounded-r ${
                    offer.agreement_id?.status === 'signed_by_seeker' || 
                    offer.agreement_id?.status === 'fully_signed' ? 
                    'bg-green-400' : 'bg-gray-200'
                  }`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Agreement View Modal */}
      {showAgreementModal && selectedAgreementId && (
        <AgreementViewModal
          isOpen={showAgreementModal}
          onClose={() => setShowAgreementModal(false)}
          agreementId={selectedAgreementId}
          userId={employerId}
          userRole="provider"
          onAgreementSigned={fetchAgreements}
        />
      )}
    </div>
  );
};

export default EmployerAgreementsPage;