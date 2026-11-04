import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getFilteredAssessments } from '../api';

const AssessmentResultsView = ({ filters, onClose }) => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssessments();
  }, [filters]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await getFilteredAssessments(filters);
      setAssessments(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-center">Loading assessment results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Assessment Results</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Filter Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Filters Applied:</h3>
            <div className="flex flex-wrap gap-2">
              {filters.user_id && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  User ID: {filters.user_id}
                </span>
              )}
              {filters.job_id && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                  Job ID: {filters.job_id}
                </span>
              )}
              {filters.assigned_by && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                  Assigned By: {filters.assigned_by}
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">Error: {error}</p>
            </div>
          )}

          {assessments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No assessment results found for the specified filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map(assessment => (
                <div key={assessment._id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Basic Info */}
                    <div>
                      <h4 className="font-semibold text-lg mb-2">Assessment Details</h4>
                      <p><strong>Skill:</strong> {assessment.skill_id?.name || 'N/A'}</p>
                      <p><strong>User:</strong> {assessment.user_id?.name || 'N/A'}</p>
                      <p><strong>Email:</strong> {assessment.user_id?.email || 'N/A'}</p>
                      <p><strong>Phone:</strong> {assessment.user_id?.phone_number || 'N/A'}</p>
                    </div>

                    {/* Job & Assignment Info */}
                    <div>
                      <h4 className="font-semibold text-lg mb-2">Job & Assignment</h4>
                      <p><strong>Job:</strong> {assessment.job_id?.title || 'General Assessment'}</p>
                      <p><strong>Assigned By:</strong> {assessment.assigned_by?.name || 'N/A'}</p>
                      <p><strong>Assigned Date:</strong> {new Date(assessment.assigned_at).toLocaleDateString()}</p>
                      <div className="mt-2">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(assessment.status)}`}>
                          {assessment.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Results */}
                    <div>
                      <h4 className="font-semibold text-lg mb-2">Results</h4>
                      {assessment.status === 'completed' ? (
                        <>
                          <p className={`text-2xl font-bold ${getScoreColor(assessment.percentage)}`}>
                            {assessment.percentage}%
                          </p>
                          <p><strong>Score:</strong> {assessment.correct_answers}/{assessment.total_questions}</p>
                          <p><strong>Completed:</strong> {new Date(assessment.completed_at).toLocaleDateString()}</p>
                          <div className="mt-2">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              assessment.percentage >= 70 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {assessment.percentage >= 70 ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-500">Assessment not completed yet</p>
                      )}
                    </div>
                  </div>

                  {/* Additional Details */}
                  {assessment.status === 'completed' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <p><strong>Duration:</strong> {assessment.duration_minutes} minutes</p>
                        <p><strong>Start Time:</strong> {assessment.start_time ? new Date(assessment.start_time).toLocaleString() : 'N/A'}</p>
                        <p><strong>End Time:</strong> {assessment.end_time ? new Date(assessment.end_time).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {assessments.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium">Total Assessments</p>
                  <p className="text-2xl font-bold text-blue-600">{assessments.length}</p>
                </div>
                <div>
                  <p className="font-medium">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {assessments.filter(a => a.status === 'completed').length}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Passed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {assessments.filter(a => a.status === 'completed' && a.percentage >= 70).length}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Average Score</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {assessments.filter(a => a.status === 'completed').length > 0
                      ? Math.round(
                          assessments
                            .filter(a => a.status === 'completed')
                            .reduce((sum, a) => sum + a.percentage, 0) /
                          assessments.filter(a => a.status === 'completed').length
                        )
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AssessmentResultsView;