import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AIAssessmentModal = ({ isOpen, onClose, assessment }) => {
  console.log('AIAssessmentModal rendered with:', { isOpen, assessment });
  
  // Prevent body scroll when modal is open - MUST be called before any conditional returns
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'STRONGLY RECOMMENDED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'TAKE A CHANCE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'RISKY':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'NOT RECOMMENDED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRecommendationIcon = (recommendation) => {
    switch (recommendation) {
      case 'STRONGLY RECOMMENDED':
        return '🟢';
      case 'TAKE A CHANCE':
        return '🟡';
      case 'RISKY':
        return '🟠';
      case 'NOT RECOMMENDED':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };
  
  // Early return after hooks are called
  if (!assessment) {
    console.log('No assessment data provided to modal');
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] overflow-y-auto"
          style={{ zIndex: 9999 }}
        >
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Centering wrapper */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            {/* Modal panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 300,
                duration: 0.3
              }}
              className="relative inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">🤖</div>
                    <div>
                      <h3 className="text-xl font-bold text-white">AI Hiring Assessment</h3>
                      <p className="text-purple-100 text-sm">Comprehensive candidate analysis powered by AI</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                {/* Overall Recommendation */}
                <div className="mb-6">
                  <div className={`inline-flex items-center px-6 py-3 rounded-xl border-2 ${getRecommendationColor(assessment.recommendation)} shadow-lg`}>
                    <span className="text-3xl mr-3">{getRecommendationIcon(assessment.recommendation)}</span>
                    <div>
                      <div className="font-bold text-xl">{assessment.recommendation}</div>
                      <div className="text-sm opacity-75 mt-1">
                        Overall Score: <span className={`font-bold text-lg ${getScoreColor(assessment.total_score)}`}>{assessment.total_score}%</span>
                        <span className="mx-2">•</span>
                        Confidence: <span className="font-semibold">{assessment.confidence}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assessment Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Skills Assessment */}
                  {assessment.skills_assessment && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-blue-50 rounded-xl p-5 border border-blue-200"
                    >
                      <h4 className="font-bold text-blue-800 mb-3 flex items-center text-lg">
                        🎯 Skills Assessment
                        <span className="ml-2 text-sm bg-blue-200 text-blue-700 px-2 py-1 rounded-full">
                          Weight: {assessment.skills_assessment.weight}%
                        </span>
                      </h4>
                      <div className="text-3xl font-bold text-blue-600 mb-3">{assessment.skills_assessment.score}%</div>
                      {assessment.skills_assessment.details && (
                        <div className="text-sm text-blue-700 space-y-2">
                          <div className="flex justify-between">
                            <span>Matched Skills:</span>
                            <span className="font-semibold">{assessment.skills_assessment.details.matched_skills}/{assessment.skills_assessment.details.total_required || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Verified Skills:</span>
                            <span className="font-semibold">{assessment.skills_assessment.details.verified_skills || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Avg Experience:</span>
                            <span className="font-semibold">{assessment.skills_assessment.details.average_experience || 'N/A'} years</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Experience Assessment */}
                  {assessment.experience_assessment && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-green-50 rounded-xl p-5 border border-green-200"
                    >
                      <h4 className="font-bold text-green-800 mb-3 flex items-center text-lg">
                        💼 Experience Assessment
                        <span className="ml-2 text-sm bg-green-200 text-green-700 px-2 py-1 rounded-full">
                          Weight: {assessment.experience_assessment.weight}%
                        </span>
                      </h4>
                      <div className="text-3xl font-bold text-green-600 mb-3">{assessment.experience_assessment.score}%</div>
                      {assessment.experience_assessment.details && (
                        <div className="text-sm text-green-700 space-y-2">
                          <div className="flex justify-between">
                            <span>Total Jobs:</span>
                            <span className="font-semibold">{assessment.experience_assessment.details.total_jobs || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Experience:</span>
                            <span className="font-semibold">{assessment.experience_assessment.details.total_experience_years || 'N/A'} years</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Job Stability:</span>
                            <span className="font-semibold">{assessment.experience_assessment.details.job_stability || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Currently Employed:</span>
                            <span className="font-semibold">{assessment.experience_assessment.details.current_employment ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Assessment History */}
                  {assessment.assessment_history && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-purple-50 rounded-xl p-5 border border-purple-200"
                    >
                      <h4 className="font-bold text-purple-800 mb-3 flex items-center text-lg">
                        📊 Assessment History
                        <span className="ml-2 text-sm bg-purple-200 text-purple-700 px-2 py-1 rounded-full">
                          Weight: {assessment.assessment_history.weight}%
                        </span>
                      </h4>
                      <div className="text-3xl font-bold text-purple-600 mb-3">{assessment.assessment_history.score}%</div>
                      {assessment.assessment_history.details && (
                        <div className="text-sm text-purple-700 space-y-2">
                          <div className="flex justify-between">
                            <span>Total Assessments:</span>
                            <span className="font-semibold">{assessment.assessment_history.details.total_assessments || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Average Score:</span>
                            <span className="font-semibold">{assessment.assessment_history.details.average_score || 'N/A'}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pass Rate:</span>
                            <span className="font-semibold">{assessment.assessment_history.details.pass_rate || 'N/A'}%</span>
                          </div>
                          <div className="text-xs mt-2 text-purple-600">
                            <strong>Trend:</strong> {assessment.assessment_history.details.assessment_trend || 'N/A'}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Reliability Assessment */}
                  {assessment.reliability_assessment && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-yellow-50 rounded-xl p-5 border border-yellow-200"
                    >
                      <h4 className="font-bold text-yellow-800 mb-3 flex items-center text-lg">
                        ⚖️ Reliability Assessment
                        <span className="ml-2 text-sm bg-yellow-200 text-yellow-700 px-2 py-1 rounded-full">
                          Weight: {assessment.reliability_assessment.weight}%
                        </span>
                      </h4>
                      <div className="text-3xl font-bold text-yellow-600 mb-3">{assessment.reliability_assessment.score}%</div>
                      {assessment.reliability_assessment.details && (
                        <div className="text-sm text-yellow-700 space-y-2">
                          <div className="flex justify-between">
                            <span>False Accusations:</span>
                            <span className="font-semibold">{assessment.reliability_assessment.details.false_accusations || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>True Abuse Reports:</span>
                            <span className="font-semibold">{assessment.reliability_assessment.details.true_abuse_reports || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Reliability Rating:</span>
                            <span className="font-semibold">{assessment.reliability_assessment.details.reliability_rating || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Risk Level:</span>
                            <span className="font-semibold">{assessment.reliability_assessment.details.risk_level || 'N/A'}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Strengths and Concerns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Strengths */}
                  {assessment.strengths && assessment.strengths.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-green-50 rounded-xl p-5 border border-green-200"
                    >
                      <h4 className="font-bold text-green-800 mb-4 flex items-center text-lg">
                        💪 Key Strengths
                      </h4>
                      <ul className="space-y-3">
                        {assessment.strengths.map((strength, index) => (
                          <li key={index} className="text-sm text-green-700 flex items-start">
                            <span className="text-green-500 mr-3 text-lg">✓</span>
                            <span className="flex-1">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Concerns */}
                  {assessment.concerns && assessment.concerns.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-red-50 rounded-xl p-5 border border-red-200"
                    >
                      <h4 className="font-bold text-red-800 mb-4 flex items-center text-lg">
                        ⚠️ Areas of Concern
                      </h4>
                      <ul className="space-y-3">
                        {assessment.concerns.map((concern, index) => (
                          <li key={index} className="text-sm text-red-700 flex items-start">
                            <span className="text-red-500 mr-3 text-lg">!</span>
                            <span className="flex-1">{concern}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>

                {/* AI Recommendations */}
                {assessment.suggestions && assessment.suggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-200"
                  >
                    <h4 className="font-bold text-blue-800 mb-4 flex items-center text-lg">
                      💡 AI Recommendations
                    </h4>
                    <ul className="space-y-3">
                      {assessment.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-blue-700 flex items-start">
                          <span className="text-blue-500 mr-3 text-lg">→</span>
                          <span className="flex-1">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Processing Info */}
                <div className="mt-6 text-center text-xs text-gray-500">
                  <p>Assessment processed using advanced AI algorithms</p>
                  {assessment.processing_time_ms && (
                    <p>Processing time: {assessment.processing_time_ms}ms</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">AI-Powered Assessment</span> • Comprehensive Analysis
                </div>
                <button
                  onClick={onClose}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Close Analysis
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AIAssessmentModal;