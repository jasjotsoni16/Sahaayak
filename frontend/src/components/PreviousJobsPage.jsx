import React, { useState, useEffect } from 'react';
import API from '../api';
import RatingModal from './RatingModal';
import EmployerDetailsModal from './EmployerDetailsModal';

const getExperienceTag = (dateJoined, dateLeft) => {
    const start = new Date(dateJoined);
    const end = dateLeft ? new Date(dateLeft) : new Date();

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
        return 'Daily Wage';
    } else if (diffDays > 30 && diffDays <= 90) {
        return 'Contract';
    } else {
        return 'Long Term';
    }
};

export default function PreviousJobsPage({ seekerId }) {
    const [previousJobs, setPreviousJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEmployerDetailsModalOpen, setIsEmployerDetailsModalOpen] = useState(false);
  const [selectedEmployerForDetails, setSelectedEmployerForDetails] = useState(null);
  const [selectedJobForRating, setSelectedJobForRating] = useState(null);

  const fetchAllExperiences = async () => {
    if (!seekerId) {
      setError('Seeker ID not available.');
      setLoading(false);
      return;
    }
    try {
      const response = await API.get(`/user-experiences/previous-jobs/${seekerId}`);
      console.log('PreviousJobsPage: Raw API response data:', response.data);
      const filteredJobs = response.data.filter(exp => exp.date_left);
      setPreviousJobs(filteredJobs);
    } catch (err) {
      setError('Failed to fetch previous jobs.');
      console.error('Error fetching previous jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllExperiences();
  }, [seekerId]);

  const openEmployerDetailsModal = (employerUserId, jobId) => {
    setSelectedEmployerForDetails(employerUserId);
    setSelectedJobForRating(jobId);
    setIsEmployerDetailsModalOpen(true);
  };

  const closeEmployerDetailsModal = () => {
    setIsEmployerDetailsModalOpen(false);
    setSelectedEmployerForDetails(null);
    setSelectedJobForRating(null);
  };

  if (loading) {
    return <div className="text-center p-4">Loading left jobs...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Previous Jobs</h2>
      {previousJobs.length === 0 ? (
        <p className="text-gray-500">No previous jobs to display.</p>
      ) : (
        <ul className="space-y-4">
          {previousJobs.map(exp => (
            <li key={exp._id} className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold">{exp.job_id ? exp.job_id.title : exp.job_description}</h3>
              <p>Employer: {exp.job_id && exp.job_id.employer_id ? exp.job_id.employer_id.name : 'N/A'}</p>
              <p>Dates: {new Date(exp.date_joined).toLocaleDateString()} - {new Date(exp.date_left).toLocaleDateString()}</p>
              <p>Duration: <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{getExperienceTag(exp.date_joined, exp.date_left)}</span></p>
              {exp.job_id && exp.job_id.employer_id && (
                <button
                  onClick={() => openEmployerDetailsModal(exp.job_id.employer_id._id, exp.job_id._id)}
                  className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  View Employer Details / Give Rating
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {isEmployerDetailsModalOpen && (
        <EmployerDetailsModal
          isOpen={isEmployerDetailsModalOpen}
          onClose={closeEmployerDetailsModal}
          employerUserId={selectedEmployerForDetails}
          jobId={selectedJobForRating}
          seekerId={seekerId}
        />
      )}
    </div>
  );
}
