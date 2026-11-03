const UserApplication = require('../Model/UserApplication');
const UserExperience = require('../Model/UserExperience');
const Job = require('../Model/Job');
const UserJob = require('../Model/UserJob'); // Import UserJob model
const UserSkill = require('../Model/UserSkill');
const Skill = require('../Model/Skill');
const Assessment = require('../Model/Assessment');
const AssessmentQuestion = require('../Model/AssessmentQuestion');
const NotificationService = require('../services/notificationService');
const SmartHiringAssessmentService = require('../services/smartHiringAssessmentService');
const AIAssessment = require('../Model/AIAssessment');

exports.createApplication = async (req, res) => {
  try {
    const { seeker_id, job_id } = req.body;

    // Check if application already exists
    const existingApplication = await UserApplication.findOne({ seeker_id, job_id });
    if (existingApplication) {
      return res.status(400).json({ message: 'User already applied for this job.' });
    }

    const newApplication = new UserApplication({ seeker_id, job_id });
    await newApplication.save();
    
    // Populate application with job and seeker details for notification
    await newApplication.populate('job_id', 'title employer_id skills_required assessment_required');
    await newApplication.populate('seeker_id', 'name email phone_number');
    
    // If job requires assessment, create assessment immediately
    if (newApplication.job_id.assessment_required) {
      try {
        console.log(`📝 Job requires assessment, creating assessment for user ${seeker_id}`);
        await assignAssessmentToUser(seeker_id, newApplication.job_id.skills_required, job_id, newApplication.job_id.employer_id);
        console.log(`✅ Assessment assigned successfully for job application`);
      } catch (assessmentError) {
        console.error('Error creating assessment for job application:', assessmentError);
        // Don't fail the application if assessment creation fails
      }
    }
    
    // Send notification to employer about new application
    try {
      await NotificationService.notifyJobApplication(newApplication.job_id.employer_id, newApplication);
    } catch (notificationError) {
      console.error('Error sending job application notification:', notificationError);
    }
    
    // Run AI assessment for the candidate
    try {
      await runAIAssessment(newApplication._id, seeker_id, job_id, newApplication.job_id.employer_id);
    } catch (aiError) {
      console.error('Error running AI assessment:', aiError);
      // Don't fail the application if AI assessment fails
    }
    
    res.status(201).json({ message: 'Application created successfully', application: newApplication });
  } catch (error) {
    res.status(500).json({ message: 'Error creating application', error: error.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const application = await UserApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    const oldStatus = application.status;
    application.status = status;

    if (status === 'hired' && oldStatus !== 'hired') {
      application.date_hired = new Date();

      // Increment openings_hired instead of decrementing number_of_openings
      const job = await Job.findById(application.job_id);
      if (job) {
        job.openings_hired += 1;
        if (job.openings_hired >= job.number_of_openings) {
          job.is_archived = true;
        }
        await job.save();
      }

      // Create UserExperience entry
      const newExperience = new UserExperience({
        seeker_id: application.seeker_id,
        job_id: application.job_id,
        date_joined: application.date_hired,
        job_description: job ? job.description : '', // Assuming job description from Job model
        location: job ? job.location.coordinates.toString() : '', // Assuming location from Job model
      });
      await newExperience.save();

      // If job requires assessment, assign assessment to user's skills
      if (job && job.assessment_required) {
        await assignAssessmentToUser(application.seeker_id, job.skills_required, job._id, job.employer_id);
      }

    } else if (status === 'discussion' && oldStatus !== 'discussion') {
      application.date_discussion = new Date();
    } else if (status === 'negotiation' && oldStatus !== 'negotiation') {
      application.date_negotiation = new Date();
    } else if (status === 'rejected' && oldStatus !== 'rejected') {
      application.date_rejected = new Date();
    } else if (status === 'left' && oldStatus !== 'left') {
      application.date_left = new Date();
      // Update UserExperience entry with date_left
      const experience = await UserExperience.findOne({ seeker_id: application.seeker_id, job_id: application.job_id });
      console.log('updateApplicationStatus (left): Found experience:', experience);
      if (experience) {
        experience.date_left = new Date();
        await experience.save();
        console.log('updateApplicationStatus (left): Experience after saving date_left:', experience);
      }
    } else if (status === 'fired' && oldStatus !== 'fired') {
      application.date_fired = new Date();
      // Update UserExperience entry with date_left (assuming fired also means leaving the job)
      const experience = await UserExperience.findOne({ seeker_id: application.seeker_id, job_id: application.job_id });
      console.log('updateApplicationStatus (fired): Found experience:', experience);
      if (experience) {
        experience.date_left = new Date(); // Set date_left for fired status as well
        await experience.save();
        console.log('updateApplicationStatus (fired): Experience after saving date_left:', experience);
      }
    }

    await application.save();
    res.status(200).json({ message: 'Application status updated successfully', application });
  } catch (error) {
    res.status(500).json({ message: 'Error updating application status', error: error.message });
  }
};

exports.getApplicationsByEmployer = async (req, res) => {
  try {
    const { employerId } = req.params;
    
    // Security check: Ensure the requesting user is the employer
    // This should be handled by middleware, but adding extra security
    if (req.user && req.user._id.toString() !== employerId) {
      return res.status(403).json({ 
        message: 'Access denied. You can only view applications for your own jobs.',
        error: 'UNAUTHORIZED_ACCESS'
      });
    }
    
    // Only get jobs that belong to this specific employer
    const jobs = await Job.find({ employer_id: employerId });
    
    if (jobs.length === 0) {
      return res.status(200).json([]);
    }
    
    const jobIds = jobs.map(job => job._id);
    let applications = await UserApplication.find({ job_id: { $in: jobIds } })
      .populate({
        path: 'seeker_id',
        select: 'name email phone_number false_accusation_count abuse_true_count',
        populate: {
          path: 'experiences',
          model: 'UserExperience'
        }
      })
      .populate('job_id', 'title');

    // Fetch UserJob details and AI assessments for each application
    applications = await Promise.all(applications.map(async (app) => {
      const userJob = await UserJob.findOne({ seeker_id: app.seeker_id._id, job_id: app.job_id._id });
      
      // Get AI assessment for this application
      const aiAssessment = await AIAssessment.findOne({ application_id: app._id })
        .select('total_score recommendation confidence strengths concerns suggestions');
      
      return { 
        ...app.toObject(), 
        userJob,
        ai_assessment: aiAssessment
      };
    }));

    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching applications for employer', error: error.message });
  }
};

exports.getApplicationsBySeeker = async (req, res) => {
  try {
    const { seekerId } = req.params;
    const applications = await UserApplication.find({ seeker_id: seekerId })
      .sort({ date_applied: -1 })
      .populate('job_id') // Populate all job details
      .populate({ 
        path: 'job_id',
        populate: { 
          path: 'employer_id',
          select: 'name email phone_number false_accusation_count abuse_true_count',
          populate: {
            path: 'employer_profile',
            model: 'Employer',
            select: 'company_name'
          }
        }
      });
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching applications for seeker:', error);
    res.status(500).json({ message: 'Error fetching applications for seeker', error: error.message });
  }
};

// Helper function to assign assessment to user's skills
async function assignAssessmentToUser(userId, requiredSkillIds, jobId, assignedBy) {
  try {
    console.log(`Assigning assessment for skills to user: ${userId}`);
    
    if (!requiredSkillIds || requiredSkillIds.length === 0) {
      console.log('No required skills specified for this job');
      return;
    }

    for (const skillId of requiredSkillIds) {
      // Find user's skill that matches the job requirement
      let userSkill = await UserSkill.findOne({
        user_id: userId,
        skill_id: skillId
      });

      if (userSkill) {
        // Set assessment status to pending if not already completed
        if (userSkill.assessment_status === 'not_required' || userSkill.assessment_status === 'pending') {
          userSkill.assessment_status = 'pending';
          await userSkill.save();
          console.log(`Updated existing skill assessment status to pending for user: ${userId}, skill: ${skillId}`);
        }
      } else {
        // Create a new skill entry for the user with pending assessment
        const newUserSkill = new UserSkill({
          user_id: userId,
          skill_id: skillId,
          assessment_status: 'pending',
          experience_years: 0,
          category: ['Job Required']
        });
        await newUserSkill.save();
        console.log(`Created new skill with pending assessment for user: ${userId}, skill: ${skillId}`);
      }

      // Create Assessment record for the AssessmentModal to find
      const assessmentRecord = await createAssessmentRecord(userId, skillId, jobId, assignedBy);
      
      // Send notification to seeker about assessment assignment
      if (assessmentRecord) {
        try {
          await NotificationService.notifyAssessmentAssigned(userId, assessmentRecord);
        } catch (notificationError) {
          console.error('Error sending assessment assignment notification:', notificationError);
        }
      }
    }
  } catch (error) {
    console.error('Error assigning assessment:', error);
    throw error;
  }
}

// Helper function to create Assessment record
async function createAssessmentRecord(userId, skillId, jobId, assignedBy) {
  try {
    // Check if assessment already exists
    const existingAssessment = await Assessment.findOne({
      user_id: userId,
      skill_id: skillId,
      job_id: jobId,
      status: { $in: ['assigned', 'in_progress'] }
    });

    if (existingAssessment) {
      console.log(`Assessment already exists for user: ${userId}, skill: ${skillId}, job: ${jobId}`);
      return;
    }

    // Get unique random questions for the skill
    const allQuestions = await AssessmentQuestion.find({ skill_id: skillId });
    
    if (allQuestions.length === 0) {
      console.log(`No questions available for skill: ${skillId}`);
      return;
    }

    // Use available questions (even if less than 50) but ensure uniqueness
    const questionCount = Math.min(allQuestions.length, 50);
    const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffledQuestions.slice(0, questionCount);

    // Create assessment
    const assessment = new Assessment({
      user_id: userId,
      skill_id: skillId,
      job_id: jobId,
      assigned_by: assignedBy,
      total_questions: questionCount,
      questions: selectedQuestions.map(q => ({
        question_id: q._id,
        selected_option: null,
        is_correct: null
      }))
    });

    await assessment.save();
    console.log(`Created assessment record for user: ${userId}, skill: ${skillId}, job: ${jobId}`);
    
    // Return the created assessment for notification purposes
    return assessment;
  } catch (error) {
    console.error('Error creating assessment record:', error);
    // Don't throw error here to avoid breaking the hiring process
    return null;
  }
}

// AI Assessment function
async function runAIAssessment(applicationId, seekerId, jobId, employerId) {
  const startTime = Date.now();
  
  try {
    console.log(`🤖 Starting AI assessment for application ${applicationId}`);
    
    // Run the smart AI assessment
    const assessment = await SmartHiringAssessmentService.assessCandidate(seekerId, jobId);
    
    const processingTime = Date.now() - startTime;
    
    // Save the assessment results
    const aiAssessment = new AIAssessment({
      seeker_id: seekerId,
      job_id: jobId,
      employer_id: employerId,
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
    
    console.log(`✅ AI assessment completed for application ${applicationId}: ${assessment.assessment.recommendation} (${assessment.assessment.total_score}%)`);
    
    // Send notification to employer with AI recommendation
    try {
      await NotificationService.notifyAIAssessmentComplete(employerId, aiAssessment, assessment);
    } catch (notificationError) {
      console.error('Error sending AI assessment notification:', notificationError);
    }
    
    return aiAssessment;
    
  } catch (error) {
    console.error(`❌ AI assessment failed for application ${applicationId}:`, error);
    
    // Save failed assessment record
    const failedAssessment = new AIAssessment({
      seeker_id: seekerId,
      job_id: jobId,
      employer_id: employerId,
      application_id: applicationId,
      total_score: 0,
      recommendation: 'NOT RECOMMENDED',
      confidence: 'Low',
      skills_assessment: { score: 0, weight: 30, details: {} },
      experience_assessment: { score: 0, weight: 25, details: {} },
      assessment_history: { score: 0, weight: 20, details: {} },
      reliability_assessment: { score: 0, weight: 15, details: {} },
      credit_assessment: { score: 0, weight: 10, details: {} },
      strengths: [],
      concerns: ['AI assessment failed to complete'],
      suggestions: ['Manual review required'],
      processing_time_ms: Date.now() - startTime,
      status: 'failed',
      error_message: error.message
    });
    
    await failedAssessment.save();
    throw error;
  }
}
