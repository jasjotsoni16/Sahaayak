import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../api';
import { notify } from '../ui/toastBus';

const CreditScorePage = () => {
  const [creditScore, setCreditScore] = useState(null);
  const [scoreDetails, setScoreDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCreditScore();
    fetchScoreDetails();
  }, []);

  const fetchCreditScore = async () => {
    try {
      const response = await API.get('/credit-scores');
      setCreditScore(response.data.creditScore);
    } catch (err) {
      console.error('Error fetching credit score:', err);
      setError('Failed to load credit score');
    }
  };

  const fetchScoreDetails = async () => {
    try {
      const response = await API.get('/credit-scores/details');
      setScoreDetails(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching score details:', err);
      setError('Failed to load score details');
      setLoading(false);
    }
  };

  const updateCreditScore = async () => {
    setUpdating(true);
    try {
      const response = await API.put('/credit-scores');
      setCreditScore(response.data.creditScore);
      setScoreDetails(response.data);
      notify.auto('Credit score updated successfully!');
    } catch (err) {
      console.error('Error updating credit score:', err);
      notify.auto('Failed to update credit score');
    } finally {
      setUpdating(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Very Good';
    if (score >= 50) return 'Good';
    if (score >= 30) return 'Fair';
    return 'Poor';
  };

  const getProgressPercentage = (score) => {
    return Math.min(score, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your credit score...</p>
        </div>
      </div>
    );
  }

  if (error && !creditScore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Credit Score</h1>
          <p className="text-gray-600">Track your financial health and creditworthiness</p>
        </div>

        <motion.div 
          className="bg-white rounded-2xl shadow-xl p-8 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-6">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(creditScore?.score || scoreDetails?.totalScore || 0)}`}>
              {creditScore?.score || scoreDetails?.totalScore || 0}
            </div>
            <div className="text-xl text-gray-600 mb-4">
              {getScoreLabel(creditScore?.score || scoreDetails?.totalScore || 0)}
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div 
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercentage(creditScore?.score || scoreDetails?.totalScore || 0)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm text-gray-500">
              <span>10</span>
              <span>100</span>
            </div>
          </div>

          

          {creditScore?.last_calculated && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Last updated: {new Date(creditScore.last_calculated).toLocaleDateString()}
            </p>
          )}
        </motion.div>

        {scoreDetails && (
          <motion.div 
            className="bg-white rounded-2xl shadow-xl p-8 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Score Breakdown</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(scoreDetails.components).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  <span className={`font-bold ${value > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                    {value > 0 ? '+' : ''}{value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {scoreDetails?.factors && (
          <motion.div 
            className="bg-white rounded-2xl shadow-xl p-8 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What Affects Your Score</h2>
            
            <div className="space-y-4">
              {Object.entries(scoreDetails.factors).map(([key, value]) => (
                <div key={key} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${key.includes('no_') ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <p className="text-gray-700">{value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {scoreDetails?.recommendations && scoreDetails.recommendations.length > 0 && (
          <motion.div 
            className="bg-white rounded-2xl shadow-xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Improve Your Score</h2>
            
            <div className="space-y-6">
              {scoreDetails.recommendations.map((rec, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {rec.priority.toUpperCase()}
                    </span>
                    <span className="font-semibold text-green-600">{rec.impact}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{rec.action}</h3>
                  <p className="text-gray-600">{rec.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CreditScorePage;