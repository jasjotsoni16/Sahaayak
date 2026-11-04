import React, { useState, useEffect } from 'react';
import API from '../api';
import RatingModal from './RatingModal';

export default function EmployerDetailsModal({ isOpen, onClose, employerUserId, jobId, seekerId }) {
  const [employerDetails, setEmployerDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [currentRatingProps, setCurrentRatingProps] = useState({});
  const userLocal = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (isOpen && employerUserId) {
      const fetchEmployerDetails = async () => {
        try {
          // Fetch full user details for the employer, including their employer_profile
          const response = await API.get(`/users/${employerUserId}`);
          setEmployerDetails(response.data);
        } catch (err) {
          setError('Failed to fetch employer details.');
          console.error('Error fetching employer details:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchEmployerDetails();
    }
  }, [isOpen, employerUserId]);

  const openRatingModal = () => {
    setCurrentRatingProps({
      job_id: jobId,
      giver_user_id: seekerId,
      receiver_user_id: employerUserId,
      role_of_giver: userLocal.role,
    });
    setIsRatingModalOpen(true);
  };

  const closeRatingModal = () => {
    setIsRatingModalOpen(false);
    setCurrentRatingProps({});
    // Optionally, refresh parent component data if needed
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-center">
          Loading employer details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-center text-red-500">
          {error}
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-300 rounded-md">Close</button>
        </div>
      </div>
    );
  }

  if (!employerDetails) return null; // Should not happen if loading is false and no error

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Employer Details</h2>
        <p><strong>Name:</strong> {employerDetails.name}</p>
        <p><strong>Email:</strong> {employerDetails.email}</p>
        <p><strong>Phone:</strong> {employerDetails.phone_number}</p>

        {employerDetails.employer_profile && (
          <div className="mt-4 p-3 border rounded-md bg-gray-50">
            <h3 className="text-xl font-semibold mb-2">Company Information</h3>
            <p><strong>Company Name:</strong> {employerDetails.employer_profile.company_name}</p>
            <p><strong>Company Type:</strong> {employerDetails.employer_profile.company_type}</p>
            <p><strong>GSTIN:</strong> {employerDetails.employer_profile.gstin_number}</p>
            <p><strong>Verified:</strong> {employerDetails.employer_profile.is_verified ? 'Yes' : 'No'}</p>
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-md">Close</button>
          <button
            onClick={openRatingModal}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Give Rating
          </button>
        </div>
      </div>
      {isRatingModalOpen && (
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={closeRatingModal}
          job_id={currentRatingProps.job_id}
          giver_user_id={currentRatingProps.giver_user_id}
          receiver_user_id={currentRatingProps.receiver_user_id}
          role_of_giver={currentRatingProps.role_of_giver}
        />
      )}
    </div>
  );
}
