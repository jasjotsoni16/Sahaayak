import React, { useState } from 'react';
import { makeOffer } from '../api';

const MakeOfferModal = ({ isOpen, onClose, application, employerId, onOfferMade }) => {
  const [offeredWage, setOfferedWage] = useState('');
  const [offeredWageType, setOfferedWageType] = useState('monthly');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await makeOffer({
        job_id: application.job_id._id,
        seeker_id: application.seeker_id._id,
        employer_id: employerId,
        offered_wage: parseFloat(offeredWage),
        offered_wage_type: offeredWageType,
      });
      onOfferMade();
      onClose();
    } catch (err) {
      setError('Failed to make offer.');
      console.error('Error making offer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">Make Job Offer</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Job Title:</label>
            <p className="text-gray-800">{application.job_id.title}</p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Seeker Name:</label>
            <p className="text-gray-800">{application.seeker_id.username}</p>
          </div>
          <div className="mb-4">
            <label htmlFor="offeredWage" className="block text-gray-700 text-sm font-bold mb-2">Offered Wage:</label>
            <input
              type="number"
              id="offeredWage"
              value={offeredWage}
              onChange={(e) => setOfferedWage(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="offeredWageType" className="block text-gray-700 text-sm font-bold mb-2">Wage Type:</label>
            <select
              id="offeredWageType"
              value={offeredWageType}
              onChange={(e) => setOfferedWageType(e.target.value)}
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
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={submitting}
            >
              {submitting ? 'Making Offer...' : 'Make Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MakeOfferModal;