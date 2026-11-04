import React, { useEffect, useState } from 'react';
import { getAgreement, signAgreement } from '../api';
import { notify } from '../ui/toastBus';

const AgreementViewModal = ({ isOpen, onClose, agreementId, userId, userRole, onAgreementSigned }) => {
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    const fetchAgreementDetails = async () => {
      try {
        const response = await getAgreement(agreementId);
        setAgreement(response.data);
      } catch (err) {
        setError('Failed to fetch agreement details.');
        console.error('Error fetching agreement:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && agreementId) {
      fetchAgreementDetails();
    }
  }, [isOpen, agreementId]);

  const handleSignAgreement = async () => {
    setSigning(true);
    try {
      await signAgreement(agreementId, userId, userRole);
      notify.auto('Agreement signed successfully!');
      onAgreementSigned();
      onClose();
    } catch (err) {
      setError('Failed to sign agreement.');
      console.error('Error signing agreement:', err);
    } finally {
      setSigning(false);
    }
  };

  if (!isOpen) return null;

  if (loading) return <div className="text-center p-8">Loading agreement...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!agreement) return <div className="text-center p-8">Agreement not found.</div>;

  const isSeekerSigned = agreement.status === 'signed_by_seeker' || agreement.status === 'fully_signed';
  const isEmployerSigned = agreement.status === 'signed_by_employer' || agreement.status === 'fully_signed';

  const canSign = (
    (userRole === 'seeker' && !isSeekerSigned) ||
    (userRole === 'provider' && !isEmployerSigned)
  );

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">Employment Agreement</h2>

        {agreement.agreement_pdf_base64 ? (
          <div className="mb-4">
            <embed
              src={`data:application/pdf;base64,${agreement.agreement_pdf_base64}`}
              type="application/pdf"
              width="100%"
              height="500px"
            />
          </div>
        ) : (
          <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap font-mono text-sm mb-4">
            {agreement.agreement_content}
          </pre>
        )}

        <div className="mb-4 text-lg">
          <p><strong>Status:</strong> <span className="capitalize">{agreement.status.replace(/_/g, ' ')}</span></p>
          <p><strong>Seeker Signed:</strong> {isSeekerSigned ? 'Yes' : 'No'}</p>
          <p><strong>Employer Signed:</strong> {isEmployerSigned ? 'Yes' : 'No'}</p>
        </div>

        {canSign && (
          <button
            onClick={handleSignAgreement}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={signing}
          >
            {signing ? 'Signing...' : 'Sign Agreement'}
          </button>
        )}
        {!canSign && agreement.status === 'fully_signed' && (
          <p className="text-green-600 font-semibold">Agreement is fully signed!</p>
        )}
        {!canSign && agreement.status !== 'fully_signed' && (
          <p className="text-gray-600">Waiting for other party to sign.</p>
        )}
      </div>
    </div>
  );
};

export default AgreementViewModal;