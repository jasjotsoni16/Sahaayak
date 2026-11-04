
import React, { useEffect, useState } from 'react';
import { getApplicationsBySeeker } from '../api';
import EmployerProfileView from './EmployerProfileView';

const ApplicationStatusPage = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEmployerProfileModal, setShowEmployerProfileModal] = useState(false);
    const [selectedEmployerUserId, setSelectedEmployerUserId] = useState(null);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const response = await getApplicationsBySeeker(user._id);
                setApplications(response.data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        if (user && user._id) {
            fetchApplications();
        }
    }, [user._id]);

    const handleViewEmployerProfile = (employerUserId) => {
        setSelectedEmployerUserId(employerUserId);
        setShowEmployerProfileModal(true);
    };

    if (loading) return <div className="text-center p-8">Loading applications...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error loading applications: {error.message}</div>;

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">My Applications</h2>
            {applications.length === 0 ? (
                <p className="text-center text-gray-500">You have not applied for any jobs yet.</p>
            ) : (
                <div className="overflow-x-auto shadow-lg rounded-lg">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-800 text-white">
                            <tr>
                                <th className="py-3 px-6 text-left">Job Title</th>
                                <th className="py-3 px-6 text-left">Status</th>
                                <th className="py-3 px-6 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {applications.map(app => (
                                <tr key={app._id} className="border-b border-gray-200 hover:bg-gray-100">
                                    <td className="py-4 px-6">{app.job_id ? app.job_id.title : 'This job is no longer available'}</td>
                                    <td className="py-4 px-6">{app.status}</td>
                                    <td className="py-4 px-6">
                                        {app.job_id && app.job_id.employer_id && app.job_id.employer_id._id && (
                                        <button
                                            onClick={() => handleViewEmployerProfile(app.job_id.employer_id._id)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                                        >
                                            View Employer Profile
                                        </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {showEmployerProfileModal && (
                <EmployerProfileView 
                    employerUserId={selectedEmployerUserId} 
                    onClose={() => setShowEmployerProfileModal(false)} 
                />
            )}
        </div>
    );
};

export default ApplicationStatusPage;
