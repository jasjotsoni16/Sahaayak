import React, { useEffect, useState } from 'react';
import { getUserById } from '../api';
import API from '../api';

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

const SeekerProfileView = ({ seekerUserId, onClose }) => {
    const [seekerUser, setSeekerUser] = useState(null);
    const [assessmentResults, setAssessmentResults] = useState([]);
    const [userSkills, setUserSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user data
                const userRes = await getUserById(seekerUserId);
                setSeekerUser(userRes.data);

                // Fetch user's assessment results
                const assessmentRes = await API.get(`/assessments/user/${seekerUserId}`);
                setAssessmentResults(assessmentRes.data.filter(assessment => assessment.status === 'completed'));

                // Fetch user's skills
                const skillsRes = await API.get(`/user-skills/${seekerUserId}`);
                setUserSkills(skillsRes.data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [seekerUserId]);

    if (loading) return <div className="text-center p-8">Loading seeker profile...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error loading seeker profile: {error.message}</div>;

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-3xl relative overflow-y-auto max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-3xl font-bold"
                >
                    &times;
                </button>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Seeker Profile</h2>

                {seekerUser && (
                    <div className="mb-6 p-4 border rounded-lg shadow-sm">
                        <h3 className="text-2xl font-semibold text-gray-700 mb-3">User Details</h3>
                        <p><strong>Name:</strong> {seekerUser.name}</p>
                        <p><strong>Email:</strong> {seekerUser.email}</p>
                        <p><strong>Phone:</strong> {seekerUser.phone_number}</p>
                        <p><strong>City:</strong> {seekerUser.city}</p>
                        {seekerUser.false_accusation_count > 0 && (
                            <p className="text-red-600"><strong>False Accusations:</strong> {seekerUser.false_accusation_count}</p>
                        )}
                        {seekerUser.abuse_true_count > 0 && (
                            <p className="text-red-600"><strong>Abuse Confirmed:</strong> {seekerUser.abuse_true_count}</p>
                        )}
                    </div>
                )}

                {/* Assessment Results Section */}
                {assessmentResults.length > 0 && (
                    <div className="mb-6 p-4 border rounded-lg shadow-sm">
                        <h3 className="text-2xl font-semibold text-gray-700 mb-3">Assessment Results</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assessmentResults.map(assessment => (
                                <div key={assessment._id} className="border rounded-lg p-3 bg-gray-50">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-semibold text-lg">{assessment.skill_id.name}</h4>
                                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                                            assessment.percentage >= 70 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {assessment.percentage >= 70 ? 'PASSED' : 'FAILED'}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <p><strong>Score:</strong> {assessment.percentage}%</p>
                                        <p><strong>Correct Answers:</strong> {assessment.correct_answers}/{assessment.total_questions}</p>
                                        <p><strong>Completed:</strong> {new Date(assessment.completed_at).toLocaleDateString()}</p>
                                        {assessment.job_id && (
                                            <p><strong>For Job:</strong> {assessment.job_id.title}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Skills Section */}
                {userSkills.length > 0 && (
                    <div className="mb-6 p-4 border rounded-lg shadow-sm">
                        <h3 className="text-2xl font-semibold text-gray-700 mb-3">Skills</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {userSkills.map(skill => (
                                <div key={skill._id} className="border rounded-lg p-3 bg-gray-50">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-medium">{skill.skill_id?.name || 'Unknown Skill'}</h4>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            skill.is_verified 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {skill.is_verified ? 'VERIFIED' : 'PENDING'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">Experience: {skill.experience_years} years</p>
                                    {skill.category && skill.category.length > 0 && (
                                        <p className="text-sm text-gray-600">Category: {Array.isArray(skill.category) ? skill.category.join(', ') : skill.category}</p>
                                    )}
                                    {skill.assessment_status && (
                                        <p className="text-sm text-gray-600">Assessment: {skill.assessment_status}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {seekerUser && seekerUser.experiences && seekerUser.experiences.length > 0 && (
                    <div className="p-4 border rounded-lg shadow-sm">
                        <h3 className="text-2xl font-semibold text-gray-700 mb-3">Work Experience</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            {seekerUser.experiences.map(exp => (
                                <li key={exp._id}>
                                    <strong>{exp.job_description}</strong> ({new Date(exp.date_joined).toLocaleDateString()} - {exp.date_left ? new Date(exp.date_left).toLocaleDateString() : 'Present'})
                                    <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                        {getExperienceTag(exp.date_joined, exp.date_left)}
                                    </span>
                                    {exp.description && <p className="text-sm text-gray-600">{exp.description}</p>}
                                    {exp.location && <p className="text-sm text-gray-500">Location: {exp.location}</p>}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {seekerUser && (!seekerUser.experiences || seekerUser.experiences.length === 0) && (
                    <div className="p-4 border rounded-lg shadow-sm">
                        <h3 className="text-2xl font-semibold text-gray-700 mb-3">Work Experience</h3>
                        <p>No work experience found for this seeker.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeekerProfileView;