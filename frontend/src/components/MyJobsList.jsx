import React, { useEffect, useState } from 'react';
import { getCurrentJobs, leaveJob } from '../api';
import ConfirmationModal from './ConfirmationModal';
import ReportJobAbuseModal from './ReportJobAbuseModal';
import AgreementViewModal from './AgreementViewModal';
import { notify } from '../ui/toastBus';

const MyJobsList = ({ seekerId }) => {
    const [currentJobs, setCurrentJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirmLeaveModal, setShowConfirmLeaveModal] = useState(false);
    const [showReportAbuseModal, setShowReportAbuseModal] = useState(false);
    const [selectedExperienceForReport, setSelectedExperienceForReport] = useState(null);
    const [showAgreementModal, setShowAgreementModal] = useState(false);
    const [selectedAgreementId, setSelectedAgreementId] = useState(null);

    const fetchCurrentJobs = async () => {
        try {
            const response = await getCurrentJobs(seekerId);
            setCurrentJobs(response.data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentJobs();
    }, [seekerId]);

    

    

    const handleLeaveJob = (experienceId) => {
        setSelectedExperienceForReport(experienceId); // Reusing state for simplicity, but it's for the experience ID
        setShowConfirmLeaveModal(true);
    };

    const confirmLeaveJob = async () => {
        try {
            await leaveJob(selectedExperienceForReport);
            notify.auto('Job left successfully!');
            fetchCurrentJobs(); // Refresh the list
            setShowConfirmLeaveModal(false);
            setSelectedExperienceForReport(null);
        } catch (err) {
            console.error('Error leaving job:', err);
            notify.auto('Failed to leave job: ' + err.message);
        }
    };

    const handleReportAbuse = (experience) => {
        setSelectedExperienceForReport(experience);
        setShowReportAbuseModal(true);
    };

    const closeReportAbuseModal = () => {
        setShowReportAbuseModal(false);
        setSelectedExperienceForReport(null);
    };

    if (loading) return <div className="text-center p-8">Loading your jobs...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error loading your jobs: {error.message}</div>;

    return (
        <div className="container mx-auto p-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">My Current Jobs</h3>
            {currentJobs.length === 0 ? (
                <p className="text-center text-gray-500">You are not currently in any jobs.</p>
            ) : (
                <div className="overflow-x-auto shadow-lg rounded-lg">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-800 text-white">
                            <tr>
                                <th className="py-3 px-6 text-left">Job Title</th>
                                <th className="py-3 px-6 text-left">Employer</th>
                                <th className="py-3 px-6 text-left">Joined Date</th>
                                <th className="py-3 px-6 text-left">Actions</th>
                                <th className="py-3 px-6 text-left">Agreement</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {currentJobs.map(job => (
                                <tr key={job._id} className="border-b border-gray-200 hover:bg-gray-100 transition-transform transform hover:scale-102 duration-300">
                                    <td className="py-4 px-6">{job.job_id ? job.job_id.title : job.job_description}</td>
                                    <td className="py-4 px-6">{job.job_id && job.job_id.employer_id ? job.job_id.employer_id.name : 'N/A'}</td>
                                    <td className="py-4 px-6">{new Date(job.date_joined).toLocaleDateString()}</td>
                                    <td className="py-4 px-6">
                                        <button
                                            onClick={() => handleLeaveJob(job._id)}
                                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 mr-2"
                                        >
                                            Leave Job
                                        </button>
                                        {job.job_id && job.job_id.employer_id && (
                                            <button
                                                onClick={() => handleReportAbuse(job)}
                                                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                                            >
                                                Report Abuse
                                            </button>
                                        )}
                                    </td>
                                    <td className="py-4 px-6">
                                        {job.agreement_id ? (
                                            <button
                                                onClick={() => {
                                                    setSelectedAgreementId(job.agreement_id._id);
                                                    setShowAgreementModal(true);
                                                }}
                                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                                            >
                                                View Agreement
                                            </button>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showConfirmLeaveModal && (
                <ConfirmationModal
                    message="Are you sure you want to leave this job?"
                    onConfirm={confirmLeaveJob}
                    onCancel={() => setShowConfirmLeaveModal(false)}
                />
            )}

            {showReportAbuseModal && selectedExperienceForReport && (
                <ReportJobAbuseModal
                    isOpen={showReportAbuseModal}
                    onClose={closeReportAbuseModal}
                    jobId={selectedExperienceForReport.job_id._id}
                    reportedUserId={selectedExperienceForReport.job_id.employer_id._id}
                    reporterId={seekerId}
                    employerName={selectedExperienceForReport.job_id.employer_id.name}
                />
            )}

            {showAgreementModal && selectedAgreementId && (
                <AgreementViewModal
                    isOpen={showAgreementModal}
                    onClose={() => setShowAgreementModal(false)}
                    agreementId={selectedAgreementId}
                    userId={seekerId}
                    userRole={JSON.parse(localStorage.getItem('user')).role}
                    onAgreementSigned={fetchCurrentJobs}
                />
            )}
        </div>
    );
};

export default MyJobsList;