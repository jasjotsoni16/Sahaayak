import React, { useEffect, useState } from 'react';
import { getOffersForSeeker, acceptOffer, rejectOffer, counterOffer } from '../api';
import AgreementViewModal from './AgreementViewModal';
import { notify } from '../ui/toastBus';

const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [counterWage, setCounterWage] = useState('');
  const [counterWageType, setCounterWageType] = useState('monthly');
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [selectedAgreementId, setSelectedAgreementId] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));
  const seekerId = user ? user._id : null;

  const fetchOffers = async () => {
    if (!seekerId) {
      setError('Seeker ID not available.');
      setLoading(false);
      return;
    }
    try {
      const response = await getOffersForSeeker(seekerId);
      setOffers(response.data);
    } catch (err) {
      setError('Failed to fetch offers.');
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [seekerId]);

  const handleAccept = async (offerId) => {
    try {
      const response = await acceptOffer(offerId);
      notify.auto('Offer accepted!');
      fetchOffers();
      if (response.data.agreement) {
        setSelectedAgreementId(response.data.agreement._id);
        setShowAgreementModal(true);
      }
    } catch (err) {
      console.error('Error accepting offer:', err);
      notify.auto('Failed to accept offer.');
    }
  };

  const handleReject = async (offerId) => {
    try {
      await rejectOffer(offerId);
      notify.auto('Offer rejected!');
      fetchOffers();
    } catch (err) {
      console.error('Error rejecting offer:', err);
      notify.auto('Failed to reject offer.');
    }
  };

  const openCounterOfferModal = (offer) => {
    setSelectedOffer(offer);
    setCounterWage(offer.offered_wage);
    setCounterWageType(offer.offered_wage_type);
    setShowCounterOfferModal(true);
  };

  const handleCounterOffer = async (e) => {
    e.preventDefault();
    try {
      await counterOffer(selectedOffer._id, {
        offered_wage: parseFloat(counterWage),
        offered_wage_type: counterWageType,
        offered_by: 'seeker',
      });
      notify.auto('Counter offer submitted!');
      setShowCounterOfferModal(false);
      fetchOffers();
    } catch (err) {
      console.error('Error submitting counter offer:', err);
      notify.auto('Failed to submit counter offer.');
    }
  };

  if (loading) return <div className="text-center p-8">Loading offers...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Your Job Offers</h2>
      {offers.length === 0 ? (
        <p className="text-center text-gray-500">No job offers at the moment.</p>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="py-3 px-6 text-left">Job Title</th>
                <th className="py-3 px-6 text-left">Employer</th>
                <th className="py-3 px-6 text-left">Offered Wage</th>
                <th className="py-3 px-6 text-left">Status</th>
                <th className="py-3 px-6 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {offers.map(offer => (
                <tr key={offer._id} className="border-b border-gray-200 hover:bg-gray-100 transition-transform transform hover:scale-102 duration-300">
                  <td className="py-4 px-6">{offer.job_id ? offer.job_id.title : 'N/A'}</td>
                  <td className="py-4 px-6">{offer.employer_id ? offer.employer_id.name : 'N/A'}</td>
                  <td className="py-4 px-6">₹{offer.offered_wage} {offer.offered_wage_type}</td>
                  <td className="py-4 px-6 capitalize">{offer.status.replace(/_/g, ' ')}</td>
                  <td className="py-4 px-6">
                    {(offer.status === 'pending' || offer.status === 'employer_countered') && (
                      <>
                        <button
                          onClick={() => handleAccept(offer._id)}
                          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 mr-2"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(offer._id)}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 mr-2"
                        >
                          Reject
                        </button>
                        {offer.seeker_counter_offer_count < 1 && offer.job_id.negotiable && (
                          <button
                            onClick={() => openCounterOfferModal(offer)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                          >
                            Counter Offer
                          </button>
                        )}
                      </>
                    )}
                    {offer.status === 'seeker_countered' && (
                      <span className="text-gray-600">Waiting for employer response</span>
                    )}
                    {offer.status === 'accepted' && (
                      <button
                        onClick={() => {
                          console.log('Attempting to view agreement for offer:', offer);
                          console.log('Agreement ID:', offer.agreement_id);
                          setSelectedAgreementId(offer.agreement_id._id); // Ensure to pass the _id
                          setShowAgreementModal(true);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                      >
                        View Agreement
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCounterOfferModal && selectedOffer && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md relative">
            <button
              onClick={() => setShowCounterOfferModal(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4">Counter Offer for {selectedOffer.job_id.title}</h2>
            <form onSubmit={handleCounterOffer}>
              <div className="mb-4">
                <label htmlFor="counterWage" className="block text-gray-700 text-sm font-bold mb-2">Your Counter Wage:</label>
                <input
                  type="number"
                  id="counterWage"
                  value={counterWage}
                  onChange={(e) => setCounterWage(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="counterWageType" className="block text-gray-700 text-sm font-bold mb-2">Wage Type:</label>
                <select
                  id="counterWageType"
                  value={counterWageType}
                  onChange={(e) => setCounterWageType(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Submit Counter Offer
              </button>
            </form>
          </div>
        </div>
      )}

      {showAgreementModal && selectedAgreementId && (
        <AgreementViewModal
          isOpen={showAgreementModal}
          onClose={() => setShowAgreementModal(false)}
          agreementId={selectedAgreementId}
          userId={user._id}
          userRole={user.role}
          onAgreementSigned={fetchOffers}
        />
      )}
    </div>
  );
};

export default OffersPage;