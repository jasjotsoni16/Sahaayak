import React, { useState, useEffect } from 'react';
import API from '../api';
import AgreementViewModal from './AgreementViewModal';
import { notify } from '../ui/toastBus';

export default function MyToolLoansPage({ selectedSubTab }) {
  const [borrowerLoans, setBorrowerLoans] = useState([]);
  const [lenderLoans, setLenderLoans] = useState([]);
  const [myTools, setMyTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [selectedAgreementId, setSelectedAgreementId] = useState(null);

  const fetchLoansAndTools = async () => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      setError('User not logged in. Please log in to view your tool loans and listings.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const borrowerRes = await API.get(`/tool-loans/my-loans/borrower/${currentUserId}`);
      setBorrowerLoans(borrowerRes.data);

      const lenderRes = await API.get(`/tool-loans/my-loans/lender/${currentUserId}`);
      setLenderLoans(lenderRes.data);

      const myToolsRes = await API.get(`/tools/my-tools/${currentUserId}`);
      setMyTools(myToolsRes.data);

    } catch (err) {
      setError('Failed to fetch loans and tools.');
      console.error('Error fetching loans and tools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoansAndTools();
  }, []);

  const handleAcceptReject = async (loanId, action) => {
    try {
      await API.put(`/tool-loans/${loanId}/${action}`);
      notify.auto(`Loan ${action}ed successfully!`);
      fetchLoansAndTools();
    } catch (err) {
      notify.auto(`Failed to ${action} loan: ` + (err.response?.data?.message || err.message));
      console.error(`Error ${action}ing loan:`, err);
    }
  };

  const handleConfirmReturn = async (loanId) => {
    try {
      await API.put(`/tool-loans/${loanId}/confirm-return`);
      notify.auto('Tool return confirmed!');
      fetchLoansAndTools();
    } catch (err) {
      notify.auto('Failed to confirm return: ' + (err.response?.data?.message || err.message));
      console.error('Error confirming return:', err);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading your loans and tools...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500 text-center">{error}</div>;
  }

  const pendingLenderRequests = lenderLoans.filter(loan => loan.status === 'pending');
  const activeLenderLoans = lenderLoans.filter(loan => loan.status !== 'pending');

  return (
    <div className="container mx-auto p-4">
      {selectedSubTab === 'my-tools' && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">My Tools for Rent</h2>
          {myTools.length === 0 ? (
            <p className="text-gray-500">You have no tools listed for rent yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTools.map((tool) => (
                <div key={tool._id} className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold">{tool.name}</h3>
                  <p>Price: ₹{tool.price_per_day} / day</p>
                  <p>Deposit: ₹{tool.deposit}</p>
                  <p>Status: {tool.availability ? 'Available' : 'On Loan'}</p>
                  {/* Add actions like Edit/Delete Tool */}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSubTab === 'borrowed' && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Loans I'm Borrowing</h2>
          {borrowerLoans.length === 0 ? (
            <p className="text-gray-500">No tools borrowed yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {borrowerLoans.map((loan) => (
                <div key={loan._id} className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold">{loan.tool_id.name}</h3>
                  <p>Lender: {loan.lender_id.name}</p>
                  <p>Dates: {new Date(loan.start_date).toLocaleDateString()} - {new Date(loan.end_date).toLocaleDateString()}</p>
                  <p>Status: {loan.status}</p>
                  <p>Agreed Price: ₹{loan.agreed_price}</p>
                  {loan.status === 'accepted' && loan.agreement_id && loan.agreement_id._id && (
                    <button
                      onClick={() => {
                        setSelectedAgreementId(loan.agreement_id._id);
                        setShowAgreementModal(true);
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded-md mt-2"
                    >
                      View Agreement
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSubTab === 'lendings' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Loans I'm Lending</h2>
          {activeLenderLoans.length === 0 ? (
            <p className="text-gray-500">No tools lent yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeLenderLoans.map((loan) => (
                <div key={loan._id} className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold">{loan.tool_id.name}</h3>
                  <p>Borrower: {loan.borrower_id.name}</p>
                  <p>Dates: {new Date(loan.start_date).toLocaleDateString()} - {new Date(loan.end_date).toLocaleDateString()}</p>
                  <p>Status: {loan.status}</p>
                  <p>Agreed Price: ₹{loan.agreed_price}</p>
                  {loan.status === 'ongoing' && !loan.return_confirmed && (
                    <button onClick={() => handleConfirmReturn(loan._id)} className="bg-blue-500 text-white px-3 py-1 rounded-md mt-2">Confirm Return</button>
                  )}
                  {loan.status === 'accepted' && loan.agreement_id && loan.agreement_id._id && (
                    <button
                      onClick={() => {
                        setSelectedAgreementId(loan.agreement_id._id);
                        setShowAgreementModal(true);
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded-md mt-2"
                    >
                      View Agreement
                    </button>
                  )}
                  {/* Add more details and actions for lender */}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSubTab === 'requests' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Pending Loan Requests</h2>
          {pendingLenderRequests.length === 0 ? (
            <p className="text-gray-500">No pending loan requests.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingLenderRequests.map((loan) => (
                <div key={loan._id} className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold">{loan.tool_id.name}</h3>
                  <p>Borrower: {loan.borrower_id.name}</p>
                  <p>Dates: {new Date(loan.start_date).toLocaleDateString()} - {new Date(loan.end_date).toLocaleDateString()}</p>
                  <p>Status: {loan.status}</p>
                  <p>Agreed Price: ₹{loan.agreed_price}</p>
                  <div className="mt-2 space-x-2">
                    <button onClick={() => handleAcceptReject(loan._id, 'accept')} className="bg-green-500 text-white px-3 py-1 rounded-md">Accept</button>
                    <button onClick={() => handleAcceptReject(loan._id, 'reject')} className="bg-red-500 text-white px-3 py-1 rounded-md">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAgreementModal && selectedAgreementId && (
        <AgreementViewModal
          isOpen={showAgreementModal}
          onClose={() => setShowAgreementModal(false)}
          agreementId={selectedAgreementId}
          userId={localStorage.getItem('userId')}
          userRole={JSON.parse(localStorage.getItem('user')).role}
          onAgreementSigned={fetchLoansAndTools}
        />
      )}
    </div>
  );
}