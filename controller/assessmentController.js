const Assessment = require('../Model/Assessment');
const AssessmentQuestion = require('../Model/AssessmentQuestion');
const Job = require('../Model/Job');
const User = require('../Model/User');
const UserApplication = require('../Model/UserApplication');
const NotificationService = require('../services/notificationService');

// Assign assessment to a user for a specific job
const assignAssessment = async (req, res) => {
  try {
    const { user_id, skill_id, job_id } = req.body;
    const assigned_by = req.user.id;

    // Check if assessment already exists
    const existingAssessment = await Assessment.findOne({
      user_id,
      skill_id,
      job_id,
      status: { $in: ['assigned', 'in_progress'] }
    });

    if (existingAssessment) {
      return res.status(400).json({ error: 'Assessment already assigned for this skill and job' });
    }

    // Get unique random questions for the skill
    const allQuestions = await AssessmentQuestion.find({ skill_id: skill_id });
    
    if (allQuestions.length < 50) {
      return res.status(400).json({ error: `Not enough questions available for this skill. Found ${allQuestions.length}, need 50.` });
    }

    // Shuffle and select 50 unique questions
    const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random());
    const questions = shuffledQuestions.slice(0, 50);

    // Create assessment
    const assessment = new Assessment({
      user_id,
      skill_id,
      job_id,
      assigned_by,
      questions: questions.map(q => ({
        question_id: q._id,
        selected_option: null,
        is_correct: null
      }))
    });

    await assessment.save();
    
    // Populate required fields for notification
    await assessment.populate('skill_id', 'name');
    await assessment.populate('job_id', 'title');
    
    // Send notification about assessment assignment
    try {
      await NotificationService.notifyAssessmentAssigned(user_id, assessment);
    } catch (notificationError) {
      console.error('Error sending assessment assignment notification:', notificationError);
    }

    res.status(201).json({
      message: 'Assessment assigned successfully',
      assessment_id: assessment._id
    });
  } catch (error) {
    console.error('Error assigning assessment:', error);
    res.status(500).json({ error: 'Failed to assign assessment' });
  }
};

// Get assessment for a user
const getUserAssessments = async (req, res) => {
  try {
    const { user_id } = req.params;

    const assessments = await Assessment.find({ user_id })
      .populate('skill_id', 'name')
      .populate('job_id', 'title')
      .populate('assigned_by', 'name')
      .sort({ assigned_at: -1 });

    res.json(assessments);
  } catch (error) {
    console.error('Error fetching user assessments:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
};

// Start assessment
const startAssessment = async (req, res) => {
  try {
    const { assessment_id } = req.params;

    const assessment = await Assessment.findById(assessment_id)
      .populate({
        path: 'questions.question_id',
        select: 'question options difficulty_level'
      });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    if (assessment.status !== 'assigned') {
      return res.status(400).json({ error: 'Assessment cannot be started' });
    }

    // Update assessment status and start time
    assessment.status = 'in_progress';
    assessment.start_time = new Date();
    await assessment.save();
    
    // Populate required fields for employer notification
    await assessment.populate('user_id', 'name email');
    await assessment.populate('skill_id', 'name');
    await assessment.populate('job_id', 'title employer_id');
    
    // Send notification to employer about assessment start
    if (assessment.job_id && assessment.job_id.employer_id) {
      try {
        await NotificationService.notifyAssessmentStarted(assessment.job_id.employer_id, assessment);
      } catch (notificationError) {
        console.error('Error sending assessment started notification:', notificationError);
      }
    }

    // Return questions without correct answers
    const questionsForUser = assessment.questions.map((q, index) => ({
      question_number: index + 1,
      question: q.question_id.question,
      options: q.question_id.options.map(opt => ({ text: opt.text })),
      difficulty_level: q.question_id.difficulty_level
    }));

    res.json({
      assessment_id: assessment._id,
      duration_minutes: assessment.duration_minutes,
      total_questions: assessment.total_questions,
      questions: questionsForUser,
      start_time: assessment.start_time
    });
  } catch (error) {
    console.error('Error starting assessment:', error);
    res.status(500).json({ error: 'Failed to start assessment' });
  }
};

// Submit assessment answer
const submitAnswer = async (req, res) => {
  try {
    const { assessment_id } = req.params;
    const { question_number, selected_option } = req.body;

    const assessment = await Assessment.findById(assessment_id)
      .populate('questions.question_id');

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    if (assessment.status !== 'in_progress') {
      return res.status(400).json({ error: 'Assessment is not in progress' });
    }

    // Check if time has expired
    const timeElapsed = (new Date() - assessment.start_time) / (1000 * 60); // minutes
    if (timeElapsed > assessment.duration_minutes) {
      assessment.status = 'expired';
      await assessment.save();
      return res.status(400).json({ error: 'Assessment time has expired' });
    }

    // Update the answer
    const questionIndex = question_number - 1;
    if (questionIndex >= 0 && questionIndex < assessment.questions.length) {
      const question = assessment.questions[questionIndex];
      const correctOption = question.question_id.options.findIndex(opt => opt.is_correct);
      
      question.selected_option = selected_option;
      question.is_correct = selected_option === correctOption;
      
      await assessment.save();
    }

    res.json({ message: 'Answer submitted successfully' });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
};

// Complete assessment
const completeAssessment = async (req, res) => {
  try {
    const { assessment_id } = req.params;

    const assessment = await Assessment.findById(assessment_id);

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    if (assessment.status !== 'in_progress') {
      return res.status(400).json({ error: 'Assessment is not in progress' });
    }

    // Calculate score
    assessment.status = 'completed';
    assessment.end_time = new Date();
    assessment.completed_at = new Date();
    const percentage = assessment.calculateScore();
    
    await assessment.save();
    
    // Populate required fields for notifications
    await assessment.populate('skill_id', 'name');
    await assessment.populate('user_id', 'name email');
    await assessment.populate('job_id', 'title employer_id');
    
    // Send notification to seeker about assessment result
    try {
      await NotificationService.notifyAssessmentResult(assessment.user_id._id, assessment);
    } catch (notificationError) {
      console.error('Error sending assessment result notification to seeker:', notificationError);
    }
    
    // Send notification to employer about assessment completion
    if (assessment.job_id && assessment.job_id.employer_id) {
      try {
        await NotificationService.notifyAssessmentCompleted(assessment.job_id.employer_id, assessment);
      } catch (notificationError) {
        console.error('Error sending assessment completed notification to employer:', notificationError);
      }
    }

    res.json({
      message: 'Assessment completed successfully',
      score: assessment.score,
      percentage: assessment.percentage,
      correct_answers: assessment.correct_answers,
      total_questions: assessment.total_questions
    });
  } catch (error) {
    console.error('Error completing assessment:', error);
    res.status(500).json({ error: 'Failed to complete assessment' });
  }
};

// Get assessment results
const getAssessmentResults = async (req, res) => {
  try {
    const { assessment_id } = req.params;

    const assessment = await Assessment.findById(assessment_id)
      .populate('skill_id', 'name')
      .populate('job_id', 'title')
      .populate('user_id', 'name email')
      .populate({
        path: 'questions.question_id',
        select: 'question options'
      });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json(assessment);
  } catch (error) {
    console.error('Error fetching assessment results:', error);
    res.status(500).json({ error: 'Failed to fetch assessment results' });
  }
};

// Get assessments for a job (for employers)
const getJobAssessments = async (req, res) => {
  try {
    const { job_id } = req.params;

    const assessments = await Assessment.find({ job_id })
      .populate('user_id', 'name email phone_number')
      .populate('skill_id', 'name')
      .sort({ assigned_at: -1 });

    res.json(assessments);
  } catch (error) {
    console.error('Error fetching job assessments:', error);
    res.status(500).json({ error: 'Failed to fetch job assessments' });
  }
};

// Create a general skill assessment (not job-specific)
const createSkillAssessment = async (req, res) => {
  try {
    const { user_id, skill_id } = req.body;
    const assigned_by = user_id; // Self-assigned for general skill assessment

    // Check if assessment already exists for this skill
    const existingAssessment = await Assessment.findOne({
      user_id,
      skill_id,
      job_id: null, // General assessment, not job-specific
      status: { $in: ['assigned', 'in_progress'] }
    });

    if (existingAssessment) {
      return res.status(400).json({ error: 'Assessment already exists for this skill' });
    }

    // Get unique random questions for the skill
    const allQuestions = await AssessmentQuestion.find({ skill_id: skill_id });
    
    if (allQuestions.length === 0) {
      return res.status(400).json({ error: 'No questions available for this skill' });
    }

    // Use available questions (even if less than 50) but ensure uniqueness
    const questionCount = Math.min(allQuestions.length, 50);
    const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffledQuestions.slice(0, questionCount);

    // Create assessment
    const assessment = new Assessment({
      user_id,
      skill_id,
      job_id: null, // General assessment
      assigned_by,
      total_questions: questionCount,
      questions: selectedQuestions.map(q => ({
        question_id: q._id,
        selected_option: null,
        is_correct: null
      }))
    });

    await assessment.save();
    
    // Populate required fields for notification
    await assessment.populate('skill_id', 'name');
    
    // Send notification about assessment assignment (self-assigned)
    try {
      await NotificationService.notifyAssessmentAssigned(user_id, assessment);
    } catch (notificationError) {
      console.error('Error sending skill assessment notification:', notificationError);
    }

    res.status(201).json({
      message: 'Skill assessment created successfully',
      assessment_id: assessment._id,
      assessment: assessment
    });
  } catch (error) {
    console.error('Error creating skill assessment:', error);
    res.status(500).json({ error: 'Failed to create skill assessment' });
  }
};

// Get filtered assessment results
const getFilteredAssessments = async (req, res) => {
  try {
    const { user_id, job_id, assigned_by } = req.query;
    
    // Build filter object
    const filter = {};
    if (user_id) filter.user_id = user_id;
    if (job_id) filter.job_id = job_id;
    if (assigned_by) filter.assigned_by = assigned_by;
    
    const assessments = await Assessment.find(filter)
      .populate('user_id', 'name email phone_number')
      .populate('skill_id', 'name')
      .populate('job_id', 'title')
      .populate('assigned_by', 'name')
      .sort({ assigned_at: -1 });
    
    res.json(assessments);
  } catch (error) {
    console.error('Error fetching filtered assessments:', error);
    res.status(500).json({ error: 'Failed to fetch filtered assessments' });
  }
};

module.exports = {
  assignAssessment,
  getUserAssessments,
  startAssessment,
  submitAnswer,
  completeAssessment,
  getAssessmentResults,
  getJobAssessments,
  createSkillAssessment,
  getFilteredAssessments
};