import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import API, { createSkillAssessment } from '../api';
import { notify } from '../ui/toastBus';

// Skill colors mapping
const skillColors = {
  'driving': '#3b82f6',
  'cooking': '#f59e42',
  'mechanic': '#6366f1',
  'waiter': '#10b981',
  'vehicle_cleaning': '#f472b6',
  'cleaning': '#a3e635',
  'bartending': '#fbbf24',
  'dishwashing': '#818cf8',
  'laundry': '#f87171',
  'gardening': '#22d3ee',
  'plumbing': '#0ea5e9',
  'carpentering': '#facc15',
  'painting': '#a21caf',
  'electric_work': '#f43f5e',
  'electronic_repair': '#14b8a6',
  'security_guards': '#64748b',
  'warehouse_works': '#f59e42',
  'constructor_labour': '#b91c1c'
};

const AssessmentModal = ({ open, onClose, userId, skill, onCompleted }) => {
  const { t } = useTranslation();
  const [assessments, setAssessments] = useState([]);
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get skill color
  const getSkillColor = () => {
    const skillName = skill?.skill || skill?.name || '';
    return skillColors[skillName.toLowerCase()] || '#3b82f6'; // default blue
  };

  const skillColor = getSkillColor();

  useEffect(() => {
    if (open && userId) {
      fetchUserAssessments();
    }
  }, [open, userId]);

  useEffect(() => {
    let timer;
    if (assessmentStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [assessmentStarted, timeLeft]);

  const fetchUserAssessments = async () => {
    try {
      setLoading(true);
      
      const response = await API.get(`/assessments/user/${userId}`);
      
      // Get the skill ID - it could be in different places depending on the skill object structure
      const skillId = skill?.skill_id?._id || skill?.skill_id || skill?._id;
      
      const skillAssessments = response.data.filter(assessment => {
        const assessmentSkillId = assessment.skill_id?._id || assessment.skill_id;
        return assessmentSkillId === skillId;
      });
      
      setAssessments(skillAssessments);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = async (assessmentId) => {
    try {
      setLoading(true);
      const response = await API.post(`/assessments/${assessmentId}/start`);
      setCurrentAssessment(response.data);
      setQuestions(response.data.questions);
      setTimeLeft(response.data.duration_minutes * 60);
      setAssessmentStarted(true);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
    } catch (error) {
      console.error('Error starting assessment:', error);
      notify.auto('Failed to start assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (questionNumber, optionIndex) => {
    const newAnswers = {
      ...selectedAnswers,
      [questionNumber]: optionIndex
    };
    setSelectedAnswers(newAnswers);

    try {
      await API.post(`/assessments/${currentAssessment.assessment_id}/answer`, {
        question_number: questionNumber,
        selected_option: optionIndex
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitAssessment = async () => {
    try {
      setLoading(true);
      const response = await API.post(`/assessments/${currentAssessment.assessment_id}/complete`);
      setResults(response.data);
      setAssessmentCompleted(true);
      setAssessmentStarted(false);
      onCompleted && onCompleted();
    } catch (error) {
      console.error('Error submitting assessment:', error);
      notify.auto('Failed to submit assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmit = () => {
    handleSubmitAssessment();
  };

  const handleCreateAssessment = async () => {
    try {
      setLoading(true);
      
      const skillId = skill?.skill_id?._id || skill?.skill_id || skill?._id;
      const response = await createSkillAssessment(userId, skillId);
      
      // Refresh assessments list
      await fetchUserAssessments();
    } catch (error) {
      console.error('Error creating assessment:', error);
      notify.auto('Failed to create assessment: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const answeredQuestions = Object.keys(selectedAnswers).length;
    return (answeredQuestions / questions.length) * 100;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: skillColor }}>
              {t('assessment.title')} - {skill?.skill || skill?.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('common.loading')}</p>
            </div>
          )}

          {!assessmentStarted && !assessmentCompleted && !loading && (
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('assessment.availableAssessments')}</h3>
              {assessments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">{t('assessment.noAssessments')}</p>
                  <button
                    onClick={handleCreateAssessment}
                    className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    style={{ backgroundColor: skillColor }}
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Assessment'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {assessments.map(assessment => (
                    <div key={assessment._id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{assessment.job_id.title}</h4>
                          <p className="text-sm text-gray-600">
                            {t('assessment.status')}: {assessment.status}
                          </p>
                          <p className="text-sm text-gray-600">
                            {t('assessment.assignedAt')}: {new Date(assessment.assigned_at).toLocaleDateString()}
                          </p>
                          {assessment.status === 'completed' && (
                            <p className="text-sm text-green-600">
                              {t('assessment.score')}: {assessment.percentage}% ({assessment.correct_answers}/{assessment.total_questions})
                            </p>
                          )}
                        </div>
                        <div>
                          {assessment.status === 'assigned' && (
                            <button
                              onClick={() => startAssessment(assessment._id)}
                              className="text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                              style={{ 
                                backgroundColor: skillColor,
                                ':hover': { backgroundColor: skillColor + 'dd' }
                              }}
                            >
                              {t('assessment.startAssessment')}
                            </button>
                          )}
                          {assessment.status === 'completed' && (
                            <span className="text-green-600 font-semibold">{t('assessment.completed')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {assessmentStarted && !assessmentCompleted && currentAssessment && (
            <div>
              <div className="mb-6 bg-gray-100 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{t('assessment.timeRemaining')}: {formatTime(timeLeft)}</span>
                  <span className="text-sm text-gray-600">
                    {t('assessment.question')} {currentQuestionIndex + 1} {t('assessment.of')} {questions.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${getProgressPercentage()}%`,
                      backgroundColor: skillColor
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {Object.keys(selectedAnswers).length} {t('assessment.answered')} / {questions.length} {t('assessment.questions')}
                </p>
              </div>

              {questions[currentQuestionIndex] && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">
                    {t('assessment.question')} {currentQuestionIndex + 1}: {questions[currentQuestionIndex].question}
                  </h3>
                  <p className="text-sm text-red-600 mb-4">
                    * {t('assessment.answerRequired') || 'Please select an answer to continue'}
                  </p>
                  <div className="space-y-3">
                    {questions[currentQuestionIndex].options.map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedAnswers[currentQuestionIndex + 1] === index 
                            ? 'border-2' 
                            : 'hover:bg-gray-50'
                        }`}
                        style={{
                          backgroundColor: selectedAnswers[currentQuestionIndex + 1] === index ? skillColor + '20' : 'transparent',
                          borderColor: selectedAnswers[currentQuestionIndex + 1] === index ? skillColor : '#e5e7eb'
                        }}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestionIndex}`}
                          value={index}
                          checked={selectedAnswers[currentQuestionIndex + 1] === index}
                          onChange={() => handleAnswerSelect(currentQuestionIndex + 1, index)}
                          className="mr-3"
                        />
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('assessment.previous')}
                </button>
                
                <div className="flex space-x-4">
                  {currentQuestionIndex < questions.length - 1 ? (
                    <button
                      onClick={handleNextQuestion}
                      disabled={selectedAnswers[currentQuestionIndex + 1] === undefined}
                      className={`px-4 py-2 text-white rounded-lg transition-colors ${
                        selectedAnswers[currentQuestionIndex + 1] === undefined 
                          ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                          : ''
                      }`}
                      style={{ 
                        backgroundColor: selectedAnswers[currentQuestionIndex + 1] !== undefined ? skillColor : undefined
                      }}
                    >
                      {t('assessment.next')}
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitAssessment}
                      disabled={selectedAnswers[currentQuestionIndex + 1] === undefined}
                      className={`px-6 py-2 rounded-lg font-semibold ${
                        selectedAnswers[currentQuestionIndex + 1] === undefined
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {t('assessment.submitAssessment')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {assessmentCompleted && results && (
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-600 mb-4">{t('assessment.assessmentCompleted')}</h3>
              <div className="bg-gray-100 p-6 rounded-lg mb-6">
                <div className="text-4xl font-bold mb-2" style={{ color: skillColor }}>{results.percentage}%</div>
                <p className="text-lg text-gray-700">
                  {t('assessment.yourScore')}: {results.correct_answers} / {results.total_questions}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {results.percentage >= 70 ? t('assessment.passed') : t('assessment.failed')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 text-white rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: skillColor }}
              >
                {t('common.close')}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AssessmentModal;