const AIAssessment = require('../Model/AIAssessment');
const UserApplication = require('../Model/UserApplication');

// Get AI assessment for a specific application
const getAIAssessment = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const aiAssessment = await AIAssessment.findOne({ application_id: applicationId })
      .populate('seeker_id', 'name email phone_number')
      .populate('job_id', 'title')
      .populate('application_id');

    if (!aiAssessment) {
      return res.status(404).json({ message: 'AI assessment not found for this application' });
    }

    res.json(aiAssessment);
  } catch (error) {
    console.error('Error fetching AI assessment:', error);
    res.status(500).json({ message: 'Error fetching AI assessment', error: error.message });
  }
};

// Get all AI assessments for an employer
const getEmployerAIAssessments = async (req, res) => {
  try {
    const { employerId } = req.params;
    const { recommendation, page = 1, limit = 20 } = req.query;

    // Build filter
    const filter = { employer_id: employerId };
    if (recommendation) {
      filter.recommendation = recommendation;
    }

    const assessments = await AIAssessment.find(filter)
      .populate('seeker_id', 'name email phone_number')
      .populate('job_id', 'title')
      .populate('application_id')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AIAssessment.countDocuments(filter);

    res.json({
      assessments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching employer AI assessments:', error);
    res.status(500).json({ message: 'Error fetching AI assessments', error: error.message });
  }
};

// Get AI assessment statistics for an employer
const getAIAssessmentStats = async (req, res) => {
  try {
    const { employerId } = req.params;

    const stats = await AIAssessment.aggregate([
      { $match: { employer_id: employerId } },
      {
        $group: {
          _id: '$recommendation',
          count: { $sum: 1 },
          avgScore: { $avg: '$total_score' }
        }
      }
    ]);

    const totalAssessments = await AIAssessment.countDocuments({ employer_id: employerId });
    
    const formattedStats = {
      total_assessments: totalAssessments,
      by_recommendation: {},
      overall_avg_score: 0
    };

    let totalScore = 0;
    stats.forEach(stat => {
      formattedStats.by_recommendation[stat._id] = {
        count: stat.count,
        percentage: Math.round((stat.count / totalAssessments) * 100),
        avg_score: Math.round(stat.avgScore)
      };
      totalScore += stat.avgScore * stat.count;
    });

    if (totalAssessments > 0) {
      formattedStats.overall_avg_score = Math.round(totalScore / totalAssessments);
    }

    res.json(formattedStats);
  } catch (error) {
    console.error('Error fetching AI assessment stats:', error);
    res.status(500).json({ message: 'Error fetching AI assessment statistics', error: error.message });
  }
};

// Manually trigger AI assessment for an application
const triggerAIAssessment = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await UserApplication.findById(applicationId)
      .populate('job_id', 'employer_id');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if assessment already exists
    const existingAssessment = await AIAssessment.findOne({ application_id: applicationId });
    if (existingAssessment) {
      return res.status(400).json({ message: 'AI assessment already exists for this application' });
    }

    // Import the smart assessment service and run assessment
    const SmartHiringAssessmentService = require('../services/smartHiringAssessmentService');
    
    const startTime = Date.now();
    const assessment = await SmartHiringAssessmentService.assessCandidate(
      application.seeker_id, 
      application.job_id._id
    );
    
    const processingTime = Date.now() - startTime;
    
    // Save the assessment results
    const aiAssessment = new AIAssessment({
      seeker_id: application.seeker_id,
      job_id: application.job_id._id,
      employer_id: application.job_id.employer_id,
      application_id: applicationId,
      total_score: assessment.assessment.total_score,
      recommendation: assessment.assessment.recommendation,
      confidence: assessment.assessment.confidence,
      skills_assessment: {
        score: assessment.assessment.breakdown.skills.score,
        weight: assessment.assessment.breakdown.skills.weight,
        details: assessment.assessment.breakdown.skills.details
      },
      experience_assessment: {
        score: assessment.assessment.breakdown.experience.score,
        weight: assessment.assessment.breakdown.experience.weight,
        details: assessment.assessment.breakdown.experience.details
      },
      assessment_history: {
        score: assessment.assessment.breakdown.assessments.score,
        weight: assessment.assessment.breakdown.assessments.weight,
        details: assessment.assessment.breakdown.assessments.details
      },
      reliability_assessment: {
        score: assessment.assessment.breakdown.reliability.score,
        weight: assessment.assessment.breakdown.reliability.weight,
        details: assessment.assessment.breakdown.reliability.details
      },
      credit_assessment: {
        score: assessment.assessment.breakdown.credit_score.score,
        weight: assessment.assessment.breakdown.credit_score.weight,
        details: assessment.assessment.breakdown.credit_score.details
      },
      strengths: assessment.assessment.strengths,
      concerns: assessment.assessment.concerns,
      suggestions: assessment.assessment.recommendations,
      processing_time_ms: processingTime,
      status: 'completed'
    });
    
    await aiAssessment.save();

    res.status(201).json({
      message: 'AI assessment completed successfully',
      assessment: aiAssessment
    });

  } catch (error) {
    console.error('Error triggering AI assessment:', error);
    res.status(500).json({ message: 'Error triggering AI assessment', error: error.message });
  }
};

module.exports = {
  getAIAssessment,
  getEmployerAIAssessments,
  getAIAssessmentStats,
  triggerAIAssessment
};