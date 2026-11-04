import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import API, { updateApplicationStatus } from '../api';
import SeekerProfileView from './SeekerProfileView';
import MakeOfferModal from './MakeOfferModal';
import AssessmentResultsView from './AssessmentResultsView';
import AIAssessmentModal from './AIAssessmentModal';
import { notify } from '../ui/toastBus';

const ProviderApplicationsScreen = ({ employerId }) => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [groupedApplications, setGroupedApplications] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessmentAssigning, setAssessmentAssigning] = useState({});
  const [showSeekerProfileModal, setShowSeekerProfileModal] = useState(false);
  const [selectedSeekerUserId, setSelectedSeekerUserId] = useState(null);
  const [showMakeOfferModal, setShowMakeOfferModal] = useState(false); // New state
  const [selectedApplicationForOffer, setSelectedApplicationForOffer] = useState(null); // New state
  const [assessmentScores, setAssessmentScores] = useState({}); // Store assessment scores
  const [showAssessmentResults, setShowAssessmentResults] = useState(false);
  const [assessmentFilters, setAssessmentFilters] = useState({});
  const [showAIAssessmentModal, setShowAIAssessmentModal] = useState(false);
  const [selectedAIAssessment, setSelectedAIAssessment] = useState(null);

  const fetchApplications = async () => {
    try {
      const response = await API.get(`/applications/employer/${employerId}`);
      setApplications(response.data);
      
      // Group applications by job
      const grouped = {};
      response.data.forEach(app => {
        const jobId = app.job_id?._id;
        const jobTitle = app.job_id?.title || 'Unknown Job';
        
        if (!grouped[jobId]) {
          grouped[jobId] = {
            job: app.job_id,
            applications: []
          };
        }
        grouped[jobId].applications.push(app);
      });
      
      setGroupedApplications(grouped);
      
      // Fetch assessment scores for each applicant
      const scores = {};
      for (const app of response.data) {
        if (app.seeker_id && app.seeker_id._id) {
          try {
            const assessmentRes = await API.get(`/assessments/user/${app.seeker_id._id}`);
            const completedAssessments = assessmentRes.data.filter(assessment => assessment.status === 'completed');
            scores[app.seeker_id._id] = completedAssessments;
          } catch (error) {
            console.error(`Error fetching assessments for user ${app.seeker_id._id}:`, error);
            scores[app.seeker_id._id] = [];
          }
        }
      }
      setAssessmentScores(scores);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (applicationId, newStatus, application) => {
    if (newStatus === 'hired') {
      setSelectedApplicationForOffer(application);
      setShowMakeOfferModal(true);
      return;
    }
    try {
      await updateApplicationStatus(applicationId, newStatus);
      fetchApplications(); // Refresh applications after update
    } catch (err) {
      console.error('Error updating application status:', err);
      notify.auto('Failed to update application status.');
    }
  };

  const handleAssignAssessment = async (application, skillId) => {
    try {
      setAssessmentAssigning({ ...assessmentAssigning, [application._id]: true });
      
      await API.post('/assessments/assign', {
        user_id: application.seeker_id._id,
        skill_id: skillId,
        job_id: application.job_id._id
      });
      
      notify.auto(t('assessment.assignedSuccessfully') || 'Assessment assigned successfully!');
      fetchApplications();
    } catch (error) {
      console.error('Error assigning assessment:', error);
      notify.auto(t('assessment.assignmentFailed') || 'Failed to assign assessment');
    } finally {
      setAssessmentAssigning({ ...assessmentAssigning, [application._id]: false });
    }
  };

  const fetchAssessmentResults = async (userId, jobId) => {
    try {
      const response = await API.get(`/assessments/job/${jobId}`);
      return response.data.filter(assessment => assessment.user_id._id === userId);
    } catch (error) {
      console.error('Error fetching assessment results:', error);
      return [];
    }
  };

  const handleOfferMade = () => {
    setShowMakeOfferModal(false);
    fetchApplications(); // Refresh applications after offer is made
  };

  const handleViewSeekerProfile = (seekerUserId) => {
    setSelectedSeekerUserId(seekerUserId);
    setShowSeekerProfileModal(true);
  };

  const handleViewAssessmentResults = (filters) => {
    setAssessmentFilters(filters);
    setShowAssessmentResults(true);
  };

  const handleViewJobAssessments = (jobId) => {
    handleViewAssessmentResults({ job_id: jobId, assigned_by: employerId });
  };

  const handleViewUserAssessments = (userId) => {
    handleViewAssessmentResults({ user_id: userId });
  };

  const handleViewSpecificAssessment = (userId, jobId) => {
    handleViewAssessmentResults({ user_id: userId, job_id: jobId, assigned_by: employerId });
  };

  const handleViewAIAssessment = (aiAssessment) => {
    console.log('handleViewAIAssessment called with:', aiAssessment);
    
    if (!aiAssessment) {
      console.error('No AI assessment data provided');
      notify.auto('No AI assessment data available');
      return;
    }
    
    // Ensure modal is closed first, then open with new data
    setShowAIAssessmentModal(false);
    setSelectedAIAssessment(null);
    
    // Use setTimeout to ensure state is updated before opening modal
    setTimeout(() => {
      setSelectedAIAssessment(aiAssessment);
      setShowAIAssessmentModal(true);
      console.log('AI Assessment modal should now be open');
    }, 100);
  };

  if (loading) return <div className="text-center p-8">Loading applications...</div>;
  if (error) return <div className="text-center p-8 text-red-500">Error loading applications: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Job Applications</h2>
        <button
          onClick={() => handleViewAssessmentResults({ assigned_by: employerId })}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
        >
          View All My Assessments
        </button>
      </div>
      {Object.keys(groupedApplications).length === 0 ? (
        <p className="text-center text-gray-500">No applications found.</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedApplications).map(([jobId, jobData]) => (
            <div key={jobId} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Job Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold">{jobData.job?.title || 'Unknown Job'}</h3>
                    <p className="text-blue-100 mt-1">
                      {jobData.applications.length} {jobData.applications.length === 1 ? 'Application' : 'Applications'}
                    </p>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => handleViewJobAssessments(jobId)}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-bold py-2 px-4 rounded transition-all"
                    >
                      View Job Assessments
                    </button>
                  </div>
                </div>
                {/* Job Details */}
                {jobData.job && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Skills Required:</span>
                      <div className="mt-1">
                        {jobData.job.skills_required && jobData.job.skills_required.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {jobData.job.skills_required.map(skill => (
                              <span key={skill._id} className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-blue-200">None specified</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold">Salary:</span>
                      <p className="text-blue-100">₹{jobData.job.salary_min || 'N/A'} - ₹{jobData.job.salary_max || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Assessment Required:</span>
                      <p className="text-blue-100">{jobData.job.assessment_required ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Applications Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('jobs.seekerName') || 'Seeker Name'}</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Recommendation</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.email') || 'Email'}</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.phone') || 'Phone'}</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('jobs.counterOffer') || 'Counter Offer'}</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('assessment.assessmentScores') || 'Assessment Scores'}</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status') || 'Status'}</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('jobs.dateApplied') || 'Date Applied'}</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('jobs.actions') || 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobData.applications.map(app => (
                      <tr key={app._id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{app.seeker_id ? app.seeker_id.name : 'N/A'}</div>
                              {app.seeker_id && (app.seeker_id.false_accusation_count > 0 || app.seeker_id.abuse_true_count > 0) && (
                                <div className="text-xs text-red-600">
                                  {app.seeker_id.false_accusation_count > 0 && `False Accusations: ${app.seeker_id.false_accusation_count}`}
                                  {app.seeker_id.abuse_true_count > 0 && `Abuse Confirmed: ${app.seeker_id.abuse_true_count}`}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {app.ai_assessment ? (
                            <div className="space-y-1">
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                app.ai_assessment.recommendation === 'STRONGLY RECOMMENDED' ? 'bg-green-100 text-green-800' :
                                app.ai_assessment.recommendation === 'TAKE A CHANCE' ? 'bg-yellow-100 text-yellow-800' :
                                app.ai_assessment.recommendation === 'RISKY' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {app.ai_assessment.recommendation === 'STRONGLY RECOMMENDED' ? '🟢 RECOMMENDED' :
                                 app.ai_assessment.recommendation === 'TAKE A CHANCE' ? '🟡 TAKE A CHANCE' :
                                 app.ai_assessment.recommendation === 'RISKY' ? '🟠 RISKY' :
                                 '🔴 NOT RECOMMENDED'}
                              </div>
                              <div className="text-xs text-gray-600">
                                Score: {app.ai_assessment.total_score}% | {app.ai_assessment.confidence} Confidence
                              </div>
                              {app.ai_assessment.strengths && app.ai_assessment.strengths.length > 0 && (
                                <div className="text-xs text-green-600">
                                  💪 {app.ai_assessment.strengths[0]}
                                </div>
                              )}
                              {app.ai_assessment.concerns && app.ai_assessment.concerns.length > 0 && (
                                <div className="text-xs text-red-600">
                                  ⚠️ {app.ai_assessment.concerns[0]}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500">
                              <div className="animate-pulse">🤖 AI Analysis...</div>
                              <div className="text-xs">Processing</div>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900">{app.seeker_id ? app.seeker_id.email : 'N/A'}</td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900">{app.seeker_id ? app.seeker_id.phone_number : 'N/A'}</td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900">{app.userJob && app.userJob.counter_offer_amount ? `₹${app.userJob.counter_offer_amount}` : 'N/A'}</td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {(() => {
                            // Filter assessments to only show those for this specific job
                            const userAssessments = assessmentScores[app.seeker_id?._id] || [];
                            const jobSpecificAssessments = userAssessments.filter(assessment => 
                              assessment.job_id && assessment.job_id._id === app.job_id._id
                            );
                            
                            return jobSpecificAssessments.length > 0 ? (
                              <div className="space-y-1">
                                {jobSpecificAssessments.map(assessment => (
                                  <div key={assessment._id} className="flex items-center space-x-2">
                                    <span className="text-xs font-medium">{assessment.skill_id.name}:</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      assessment.percentage >= 70 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {assessment.percentage}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs">No job assessments</span>
                            );
                          })()} 
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app._id, e.target.value, app)}
                            className={`text-xs font-medium px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              app.status === 'hired' ? 'bg-green-100 text-green-800' :
                              app.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                              app.status === 'discussion' ? 'bg-yellow-100 text-yellow-800' :
                              app.status === 'negotiation' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <option value="applied">Applied</option>
                            <option value="discussion">Discussion</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="hired">Hired</option>
                            <option value="fired">Fired</option>
                            <option value="left">Left</option>
                          </select>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900">{new Date(app.date_applied).toLocaleDateString()}</td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => handleViewSeekerProfile(app.seeker_id._id)}
                              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded text-xs"
                            >
                              View Profile
                            </button>
                            
                            <button
                              onClick={() => handleViewSpecificAssessment(app.seeker_id._id, app.job_id._id)}
                              className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded text-xs"
                            >
                              View Assessments
                            </button>
                            
                            {app.ai_assessment && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('AI Assessment button clicked', app.ai_assessment);
                                  handleViewAIAssessment(app.ai_assessment);
                                }}
                                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-1 px-2 rounded-lg text-xs transition-all duration-200 transform hover:scale-105 shadow-md"
                              >
                                🤖 AI Analysis
                              </button>
                            )}
                            
                            {/* Assessment Assignment */}
                            {app.job_id && app.job_id.skills_required && app.job_id.skills_required.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-gray-600">Assign Assessment:</div>
                                {app.job_id.skills_required.map(skill => (
                                  <button
                                    key={skill._id}
                                    onClick={() => handleAssignAssessment(app, skill._id)}
                                    disabled={assessmentAssigning[app._id]}
                                    className="bg-purple-500 hover:bg-purple-600 text-white text-xs py-1 px-2 rounded disabled:opacity-50 w-full"
                                  >
                                    {assessmentAssigning[app._id] ? 'Assigning...' : skill.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSeekerProfileModal && (
        <SeekerProfileView 
          seekerUserId={selectedSeekerUserId} 
          onClose={() => setShowSeekerProfileModal(false)} 
        />
      )}

      {showMakeOfferModal && selectedApplicationForOffer && (
        <MakeOfferModal
          isOpen={showMakeOfferModal}
          onClose={() => setShowMakeOfferModal(false)}
          application={selectedApplicationForOffer}
          employerId={employerId}
          onOfferMade={handleOfferMade}
        />
      )}

      {showAssessmentResults && (
        <AssessmentResultsView
          filters={assessmentFilters}
          onClose={() => setShowAssessmentResults(false)}
        />
      )}

      {showAIAssessmentModal && selectedAIAssessment && (
        <AIAssessmentModal
          isOpen={showAIAssessmentModal}
          onClose={() => setShowAIAssessmentModal(false)}
          assessment={selectedAIAssessment}
        />
      )}
    </div>
  );
};

export default ProviderApplicationsScreen;
