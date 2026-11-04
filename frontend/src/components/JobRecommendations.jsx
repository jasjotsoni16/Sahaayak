import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import API from '../api';
import { notify } from '../ui/toastBus';

export default function JobRecommendations() {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [seekerProfile, setSeekerProfile] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await API.get('/job-recommendations/my-recommendations');
      
      if (response.data.success) {
        setRecommendations(response.data.recommendations || []);
        setAiAnalysis(response.data.aiAnalysis);
        setSeekerProfile(response.data.seekerProfile);
      }
    } catch (err) {
      if (err.response?.status === 404 || err.response?.data?.message?.includes('No suitable jobs')) {
        setRecommendations([]);
        setError('No job recommendations available. Generate new recommendations to get started.');
      } else {
        setError('Failed to load job recommendations: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      setGenerating(true);
      setError('');
      
      const response = await API.post('/job-recommendations/generate');
      
      if (response.data.success) {
        setRecommendations(response.data.recommendations || []);
        setAiAnalysis(response.data.aiAnalysis);
        setSeekerProfile(response.data.seekerProfile);
        
        if (response.data.recommendations?.length > 0) {
          notify.auto(`Generated ${response.data.recommendations.length} job recommendations!`);
        } else {
          setError('No suitable jobs found at this time. Try updating your skills or expanding your location preferences.');
        }
      }
    } catch (err) {
      setError('Failed to generate recommendations: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const applyForJob = async (jobId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await API.post('/applications', {
        seeker_id: user._id,
        job_id: jobId
      });
      
      notify.auto('Application submitted successfully!');
      // Refresh recommendations to remove applied job
      fetchRecommendations();
    } catch (err) {
      notify.auto('Failed to apply: ' + (err.response?.data?.message || err.message));
    }
  };

  const getMatchColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getMatchLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    return 'Fair Match';
  };

  if (loading) {
    return (
      <div className= "min-h-screen bg-gray-50 flex items-center justify-center ">
        <div className= "text-center ">
          <div className= "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4 "></div>
          <p className= "text-gray-600 ">Loading job recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className= "min-h-screen bg-gray-50 py-8 ">
      <div className= "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
        {/* Header */}
        <div className= "mb-8 ">
          <div className= "flex justify-between items-center mb-4 ">
            <div>
              <h1 className= "text-3xl font-bold text-gray-900 ">
                🎯 AI-Powered Job Recommendations
              </h1>
              <p className= "text-gray-600 mt-2 ">
                Personalized job matches based on your skills, experience, and preferences
              </p>
            </div>
            <button
              onClick={generateRecommendations}
              disabled={generating}
              className= "bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 "
            >
              {generating ? (
                <div className= "flex items-center ">
                  <div className= "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 "></div>
                  Generating...
                </div>
              ) : (
                '🔄 Generate New Recommendations'
              )}
            </button>
          </div>

          {/* Seeker Profile Summary */}
          {seekerProfile && (
            <div className= "bg-white rounded-lg shadow-sm p-6 mb-6 ">
              <h3 className= "text-lg font-semibold mb-4 ">📊 Your Profile Summary</h3>
              <div className= "grid grid-cols-2 md:grid-cols-5 gap-4 ">
                <div className= "text-center ">
                  <div className= "text-2xl font-bold text-blue-600 ">{seekerProfile.totalJobs}</div>
                  <div className= "text-sm text-gray-600 ">Total Jobs</div>
                </div>
                <div className= "text-center ">
                  <div className= "text-2xl font-bold text-green-600 ">{seekerProfile.creditScore}</div>
                  <div className= "text-sm text-gray-600 ">Credit Score</div>
                </div>
                <div className= "text-center ">
                  <div className= "text-2xl font-bold text-purple-600 ">{seekerProfile.totalSkills}</div>
                  <div className= "text-sm text-gray-600 ">Skills</div>
                </div>
                <div className= "text-center ">
                  <div className= "text-2xl font-bold text-orange-600 ">₹{seekerProfile.avgMonthlyIncome?.toLocaleString()}</div>
                  <div className= "text-sm text-gray-600 ">Avg Income</div>
                </div>
                <div className= "text-center ">
                  <div className= "text-2xl font-bold text-indigo-600 ">{Math.round(seekerProfile.experienceMonths || 0)}</div>
                  <div className= "text-sm text-gray-600 ">Exp (Months)</div>
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis Toggle */}
          {aiAnalysis && (
            <div className= "mb-6 ">
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className= "bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all "
              >
                {showAnalysis ? '🤖 Hide AI Analysis' : '🤖 View AI Career Analysis'}
              </button>
            </div>
          )}

          {/* AI Analysis Panel */}
          {showAnalysis && aiAnalysis && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className= "bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 mb-6 border border-purple-200 "
            >
              <h3 className= "text-xl font-bold text-purple-800 mb-4 ">
                🤖 AI Career Analysis & Recommendations
              </h3>
              <div className= "prose max-w-none text-gray-700 ">
                <div className= "whitespace-pre-line ">{aiAnalysis.aiAnalysis}</div>
              </div>
              
              {aiAnalysis.keyInsights && (
                <div className= "mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 ">
                  <div className= "bg-white rounded-lg p-4 ">
                    <h4 className= "font-semibold text-purple-700 mb-2 ">💰 Average Recommended Salary</h4>
                    <p className= "text-2xl font-bold text-green-600 ">₹{aiAnalysis.keyInsights.averageRecommendedSalary?.toLocaleString()}</p>
                  </div>
                  <div className= "bg-white rounded-lg p-4 ">
                    <h4 className= "font-semibold text-purple-700 mb-2 ">🎯 High Match Jobs</h4>
                    <p className= "text-2xl font-bold text-blue-600 ">{aiAnalysis.keyInsights.highMatchJobs}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className= "bg-red-50 border border-red-200 rounded-lg p-4 mb-6 ">
            <div className= "flex ">
              <div className= "text-red-400 ">⚠️</div>
              <div className= "ml-3 ">
                <p className= "text-red-700 ">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Job Recommendations */}
        {recommendations.length > 0 ? (
          <div className= "grid grid-cols-1 lg:grid-cols-2 gap-6 ">
            {recommendations.map((job, index) => (
              <motion.div
                key={job.jobId || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className= "bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 "
              >
                <div className= "p-6 ">
                  {/* Match Score Badge */}
                  <div className= "flex justify-between items-start mb-4 ">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getMatchColor(job.matchScore)}`}>
                      {job.matchScore}% {getMatchLabel(job.matchScore)}
                    </div>
                    <div className= "text-sm text-gray-500 ">
                      #{index + 1} Recommendation
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className= "mb-4 ">
                    <h3 className= "text-xl font-bold text-gray-900 mb-2 ">{job.title}</h3>
                    <p className= "text-gray-600 mb-2 ">🏢 {job.company}</p>
                    <p className= "text-gray-600 mb-2 ">📍 {job.location}</p>
                    <p className= "text-green-600 font-semibold text-lg ">💰 ₹{job.salary?.toLocaleString()}/month</p>
                  </div>

                  {/* Match Reasons */}
                  {job.matchReasons && job.matchReasons.length > 0 && (
                    <div className= "mb-4 ">
                      <h4 className= "font-semibold text-gray-700 mb-2 ">✨ Why this matches you:</h4>
                      <ul className= "space-y-1 ">
                        {job.matchReasons.slice(0, 3).map((reason, idx) => (
                          <li key={idx} className= "text-sm text-gray-600 flex items-center ">
                            <span className= "text-green-500 mr-2 ">✓</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Enhanced Match Breakdown */}
                  <div className= "mb-6 ">
                    <h4 className= "font-semibold text-gray-700 mb-3 ">📊 Enhanced Match Analysis:</h4>
                    <div className= "grid grid-cols-2 gap-3 text-sm ">
                      <div className= "flex justify-between ">
                        <span>Skills:</span>
                        <span className= "font-medium ">{job.skillMatch || 0}%</span>
                      </div>
                      <div className= "flex justify-between ">
                        <span>Location:</span>
                        <span className= "font-medium ">{job.locationMatch || 0}%</span>
                      </div>
                      <div className= "flex justify-between ">
                        <span>Salary:</span>
                        <span className= "font-medium ">{job.salaryMatch || 0}%</span>
                      </div>
                      <div className= "flex justify-between ">
                        <span>Experience:</span>
                        <span className= "font-medium ">{job.experienceMatch || 0}%</span>
                      </div>
                      {job.employerQuality && (
                        <div className= "flex justify-between ">
                          <span>🏢 Employer Quality:</span>
                          <span className= "font-medium text-blue-600 ">{job.employerQuality}%</span>
                        </div>
                      )}
                      {job.wageFairness && (
                        <div className= "flex justify-between ">
                          <span>💰 Wage Fairness:</span>
                          <span className= "font-medium text-green-600 ">{job.wageFairness}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Employer Info */}
                  {(job.employerRating || job.isVerifiedEmployer) && (
                    <div className= "mb-4 ">
                      <h4 className= "font-semibold text-gray-700 mb-2 ">🏢 Employer Information:</h4>
                      <div className= "flex items-center space-x-4 text-sm ">
                        {job.employerRating && (
                          <div className= "flex items-center ">
                            <span className= "text-yellow-500 mr-1 ">⭐</span>
                            <span>{job.employerRating.toFixed(1)}/5</span>
                          </div>
                        )}
                        {job.isVerifiedEmployer && (
                          <div className= "flex items-center text-green-600 ">
                            <span className= "mr-1 ">✅</span>
                            <span>Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Safety Warnings */}
                  {job.warnings && job.warnings.length > 0 && (
                    <div className= "mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 ">
                      <h4 className= "font-semibold text-yellow-800 mb-2 ">⚠️ Important Notices:</h4>
                      <ul className= "space-y-1 ">
                        {job.warnings.map((warning, idx) => (
                          <li key={idx} className= "text-sm text-yellow-700 flex items-center ">
                            <span className= "text-yellow-500 mr-2 ">⚠️</span>
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className= "flex space-x-3 ">
                    <button
                      onClick={() => applyForJob(job.jobId)}
                      className= "flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors "
                    >
                      🚀 Apply Now
                    </button>
                    <button
                      onClick={() => setSelectedJob(job)}
                      className= "flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors "
                    >
                      📋 View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className= "text-center py-12 ">
              <div className= "text-6xl mb-4 ">🎯</div>
              <h3 className= "text-xl font-semibold text-gray-700 mb-2 ">No Job Recommendations Yet</h3>
              <p className= "text-gray-500 mb-6 ">
                Generate personalized job recommendations based on your profile, skills, and preferences.
              </p>
              <button
                onClick={generateRecommendations}
                disabled={generating}
                className= "bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 "
              >
                {generating ? 'Generating...' : '🎯 Generate My Recommendations'}
              </button>
            </div>
          )
        )}

        {/* Job Details Modal */}
        {selectedJob && (
          <div className= "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className= "bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto "
            >
              <div className= "p-6 ">
                <div className= "flex justify-between items-start mb-4 ">
                  <h2 className= "text-2xl font-bold text-gray-900 ">{selectedJob.title}</h2>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className= "text-gray-400 hover:text-gray-600 "
                  >
                    ✕
                  </button>
                </div>
                
                <div className= "space-y-4 ">
                  <div>
                    <h3 className= "font-semibold text-gray-700 ">Company</h3>
                    <p className= "text-gray-600 ">{selectedJob.company}</p>
                  </div>
                  
                  <div>
                    <h3 className= "font-semibold text-gray-700 ">Location</h3>
                    <p className= "text-gray-600 ">{selectedJob.location}</p>
                  </div>
                  
                  <div>
                    <h3 className= "font-semibold text-gray-700 ">Salary</h3>
                    <p className= "text-green-600 font-semibold ">₹{selectedJob.salary?.toLocaleString()}/month</p>
                  </div>
                  
                  <div>
                    <h3 className= "font-semibold text-gray-700 ">Match Score</h3>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getMatchColor(selectedJob.matchScore)}`}>
                      {selectedJob.matchScore}% {getMatchLabel(selectedJob.matchScore)}
                    </div>
                  </div>
                  
                  {selectedJob.matchReasons && (
                    <div>
                      <h3 className= "font-semibold text-gray-700 mb-2 ">Why this job matches you</h3>
                      <ul className= "space-y-1 ">
                        {selectedJob.matchReasons.map((reason, idx) => (
                          <li key={idx} className= "text-gray-600 flex items-center ">
                            <span className= "text-green-500 mr-2 ">✓</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className= "mt-6 flex space-x-3 ">
                  <button
                    onClick={() => {
                      applyForJob(selectedJob.jobId);
                      setSelectedJob(null);
                    }}
                    className= "flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors "
                  >
                    🚀 Apply for this Job
                  </button>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className= "flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors "
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}