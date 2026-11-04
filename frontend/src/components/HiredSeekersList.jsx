import React, { useEffect, useState } from 'react';
import { getHiredSeekers, getArchivedSeekers } from '../api';
import RatingModal from './RatingModal';
import ReportJobAbuseModal from './ReportJobAbuseModal';

const HiredSeekersList = ({ employerId, showArchived }) => {
    const [seekers, setSeekers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [selectedSeekerForRating, setSelectedSeekerForRating] = useState(null);
    const [selectedJobForRating, setSelectedJobForRating] = useState(null);
    const [isReportAbuseModalOpen, setIsReportAbuseModalOpen] = useState(false);
    const [selectedReportProps, setSelectedReportProps] = useState({});
    const userLocal = JSON.parse(localStorage.getItem('user'));

    const fetchSeekers = async () => {
        try {
            let response;
            if (showArchived) {
                response = await getArchivedSeekers(employerId);
            } else {
                response = await getHiredSeekers(employerId);
            }
            setSeekers(response.data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSeekers();
    }, [employerId, showArchived]);

    const openRatingModal = (seekerId, jobId) => {
        setSelectedSeekerForRating(seekerId);
        setSelectedJobForRating(jobId);
        setIsRatingModalOpen(true);
    };

    const closeRatingModal = () => {
        setIsRatingModalOpen(false);
        setSelectedSeekerForRating(null);
        setSelectedJobForRating(null);
    };

    const handleRatingSubmitted = () => {
        fetchSeekers(); // Refresh the list after a rating is submitted
    };

    const openReportAbuseModal = (jobId, reportedUserId, reportedUserName) => {
        setSelectedReportProps({
            job_id: jobId,
            reported_user_id: reportedUserId,
            reporter_id: userLocal._id,
            employer_name: reportedUserName, // This is actually the seeker's name in this context
        });
        setIsReportAbuseModalOpen(true);
    };

    const closeReportAbuseModal = () => {
        setIsReportAbuseModalOpen(false);
        setSelectedReportProps({});
    };

    if (loading) return <div className="text-center p-8">Loading seekers...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error loading seekers: {error.message}</div>;

    return (
        <div className="container mx-auto p-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{showArchived ? 'Archived Seekers' : 'Hired Seekers'}</h3>
            {seekers.length === 0 ? (
                <p className="text-center text-gray-500">No {showArchived ? 'archived' : 'hired'} seekers found.</p>
            ) : (
                <div className="overflow-x-auto shadow-lg rounded-lg">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-800 text-white">
                            <tr>
                                <th className="py-3 px-6 text-left">Job Title</th>
                                <th className="py-3 px-6 text-left">Seeker Name</th>
                                <th className="py-3 px-6 text-left">Seeker Phone</th>
                                <th className="py-3 px-6 text-left">Seeker Email</th>
                                <th className="py-3 px-6 text-left">Joined Date</th>
                                {showArchived && <th className="py-3 px-6 text-left">Left Date</th>}
                                <th className="py-3 px-6 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {seekers.map(seeker => (
                                <tr key={seeker._id} className="border-b border-gray-200 hover:bg-gray-100 transition-transform transform hover:scale-102 duration-300">
                                    <td className="py-4 px-6">{seeker.job_id ? seeker.job_id.title : 'N/A'}</td>
                                    <td className="py-4 px-6">{seeker.seeker_id ? seeker.seeker_id.name : 'N/A'}</td>
                                    <td className="py-4 px-6">{seeker.seeker_id ? seeker.seeker_id.phone_number : 'N/A'}</td>
                                    <td className="py-4 px-6">{seeker.seeker_id ? seeker.seeker_id.email : 'N/A'}</td>
                                    <td className="py-4 px-6">{new Date(seeker.date_joined).toLocaleDateString()}</td>
                                    {showArchived && <td className="py-4 px-6">{seeker.date_left ? new Date(seeker.date_left).toLocaleDateString() : 'N/A'}</td>}
                                    <td className="py-4 px-6">
                                        {showArchived && (
                                            <button
                                                onClick={() => openRatingModal(seeker.seeker_id._id, seeker.job_id._id)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 mr-2"
                                            >
                                                Rate Employee
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openReportAbuseModal(seeker.job_id._id, seeker.seeker_id._id, seeker.seeker_id.name)}
                                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                                        >
                                            Report Abuse
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isRatingModalOpen && (
                <RatingModal
                    isOpen={isRatingModalOpen}
                    onClose={closeRatingModal}
                    giver_user_id={employerId}
                    receiver_user_id={selectedSeekerForRating}
                    job_id={selectedJobForRating}
                    role_of_giver={userLocal.role}
                    onRatingSubmitted={handleRatingSubmitted}
                />
            )}

            {isReportAbuseModalOpen && selectedReportProps && (
                <ReportJobAbuseModal
                    isOpen={isReportAbuseModalOpen}
                    onClose={closeReportAbuseModal}
                    jobId={selectedReportProps.job_id}
                    reportedUserId={selectedReportProps.reported_user_id}
                    reporterId={selectedReportProps.reporter_id}
                    employerName={selectedReportProps.employer_name}
                />
            )}
        </div>
    );
};

export default HiredSeekersList;