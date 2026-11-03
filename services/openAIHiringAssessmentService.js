const OpenAI = require('openai');
const UserSkill = require('../Model/UserSkill');
const UserExperience = require('../Model/UserExperience');
const User = require('../Model/User');
const Job = require('../Model/Job');
const Assessment = require('../Model/Assessment');
const CreditScore = require('../Model/creditScore');

class OpenAIHiringAssessmentService {
  constructor() {
    // Initialize OpenAI client with environment variable
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Fallback to rule-based system if OpenAI fails
    this.fallbackService = require('./aiHiringAssessmentService');
  }

  /**
   * Main assessment function using OpenAI GPT
   * @param {String} seekerId - ID of the job seeker
   * @param {String} jobId - ID of the job being applied for
   * @returns {Object} - Assessment result with recommendation
   */
  async assessCandidate(seekerId, jobId) {
    try {
      console.log(`🤖 OpenAI Assessment: Analyzing candidate ${seekerId} for job ${jobId}`);

      // Check if OpenAI is available
      if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️ OpenAI API key not found, falling back to rule-based assessment');
        return await this.fallbackService.assessCandidate(seekerId, jobId);
      }

      // Gather candidate data
      const candidateData = await this.gatherCandidateData(seekerId, jobId);
      
      // Generate AI assessment
      const aiAnalysis = await this.generateAIAssessment(candidateData);
      
      // Structure the response to match our existing format
      const structuredAssessment = this.structureAIResponse(aiAnalysis, candidateData);
      
      console.log(`✅ OpenAI Assessment Complete: ${structuredAssessment.assessment.recommendation} (${structuredAssessment.assessment.total_score}%)`);
      return structuredAssessment;

    } catch (error) {
      console.error('❌ OpenAI Assessment failed, falling back to rule-based system:', error.message);
      
      // Fallback to our original rule-based system
      try {
        return await this.fallbackService.assessCandidate(seekerId, jobId);
      } catch (fallbackError) {
        console.error('❌ Fallback assessment also failed:', fallbackError.message);
        throw new Error('Both AI and fallback assessment systems failed');
      }
    }
  }

  /**
   * Gather comprehensive candidate data for AI analysis
   */
  async gatherCandidateData(seekerId, jobId) {
    const candidate = await User.findById(seekerId);
    const job = await Job.findById(jobId).populate('skills_required', 'name');
    
    // Get candidate skills
    const userSkills = await UserSkill.find({ user_id: seekerId })
      .populate('skill_id', 'name');
    
    // Get work experience
    const experiences = await UserExperience.find({ seeker_id: seekerId });
    
    // Get assessment history
    const assessments = await Assessment.find({ 
      user_id: seekerId, 
      status: 'completed' 
    }).populate('skill_id', 'name');
    
    // Get credit score
    const creditScore = await CreditScore.findOne({ user_id: seekerId });
    
    // Get financial data
    const seekerUser = await User.findById(seekerId).select('monthlySavings');

    return {
      candidate: {
        id: seekerId,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone_number,
        false_accusations: candidate.false_accusation_count || 0,
        abuse_reports: candidate.abuse_true_count || 0
      },
      job: {
        id: jobId,
        title: job.title,
        description: job.description,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        required_skills: job.skills_required.map(skill => skill.name),
        assessment_required: job.assessment_required,
        experience_required: job.experience_required
      },
      skills: userSkills.map(userSkill => ({
        name: userSkill.skill_id?.name || 'Unknown',
        experience_years: userSkill.experience_years || 0,
        is_verified: userSkill.is_verified || false,
        assessment_status: userSkill.assessment_status || 'not_required',
        category: userSkill.category || []
      })),
      experience: experiences.map(exp => ({
        job_title: exp.job_description || 'Not specified',
        start_date: exp.date_joined,
        end_date: exp.date_left,
        duration_months: exp.date_left ? 
          Math.round((new Date(exp.date_left) - new Date(exp.date_joined)) / (1000 * 60 * 60 * 24 * 30)) :
          Math.round((new Date() - new Date(exp.date_joined)) / (1000 * 60 * 60 * 24 * 30)),
        is_current: !exp.date_left
      })),
      assessments: assessments.map(assessment => ({
        skill: assessment.skill_id?.name || 'Unknown',
        score: assessment.percentage || 0,
        passed: (assessment.percentage || 0) >= 70,
        completed_date: assessment.completed_at
      })),
      financial: {
        credit_score: creditScore?.score || null,
        monthly_savings_goal: seekerUser?.monthlySavings || 0
      }
    };
  }

  /**
   * Generate AI assessment using OpenAI GPT
   */
  async generateAIAssessment(candidateData) {
    const prompt = this.buildAssessmentPrompt(candidateData);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4", // Use configured model or default to GPT-4
        messages: [
          {
            role: "system",
            content: `You are an expert HR consultant and hiring manager with 20+ years of experience in talent acquisition and candidate assessment. You specialize in evaluating candidates for blue-collar and service industry jobs in India. You understand the local job market, cultural context, and industry standards.

Your task is to provide a comprehensive, objective assessment of job candidates based on their qualifications, experience, and fit for specific roles. You should consider:

1. Skills match and relevance to the job
2. Work experience quality and stability
3. Assessment performance and learning ability
4. Reliability and trustworthiness indicators
5. Financial responsibility as a character indicator

Provide balanced, fair assessments that help employers make informed hiring decisions while being mindful of giving candidates fair opportunities to prove themselves.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for more consistent, analytical responses
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content;
      return JSON.parse(response);
      
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error(`OpenAI API failed: ${error.message}`);
    }
  }

  /**
   * Build comprehensive assessment prompt for OpenAI
   */
  buildAssessmentPrompt(data) {
    return `Please analyze this job candidate and provide a comprehensive hiring assessment in JSON format.

CANDIDATE PROFILE:
Name: ${data.candidate.name}
Contact: ${data.candidate.email} | ${data.candidate.phone}

JOB DETAILS:
Position: ${data.job.title}
Description: ${data.job.description || 'Not provided'}
Required Skills: ${data.job.required_skills.join(', ')}
Salary Range: ₹${data.job.salary_min || 'Not specified'} - ₹${data.job.salary_max || 'Not specified'}
Assessment Required: ${data.job.assessment_required ? 'Yes' : 'No'}

CANDIDATE SKILLS:
${data.skills.map(skill => 
  `- ${skill.name}: ${skill.experience_years} years experience, ${skill.is_verified ? 'Verified' : 'Not verified'}, Status: ${skill.assessment_status}`
).join('\n')}

WORK EXPERIENCE:
${data.experience.length > 0 ? 
  data.experience.map(exp => 
    `- ${exp.job_title}: ${exp.duration_months} months (${exp.start_date} to ${exp.end_date || 'Present'})`
  ).join('\n') : 
  'No work experience recorded'
}

ASSESSMENT HISTORY:
${data.assessments.length > 0 ? 
  data.assessments.map(assessment => 
    `- ${assessment.skill}: ${assessment.score}% (${assessment.passed ? 'Passed' : 'Failed'})`
  ).join('\n') : 
  'No assessments completed'
}

RELIABILITY INDICATORS:
- False Accusations: ${data.candidate.false_accusations}
- Confirmed Abuse Reports: ${data.candidate.abuse_reports}

FINANCIAL RESPONSIBILITY:
- Credit Score: ${data.financial.credit_score || 'Not available'}/100
- Monthly Savings Goal: ₹${data.financial.monthly_savings_goal}

ANALYSIS REQUIRED:
Please provide a detailed assessment in the following JSON format:

{
  "overall_recommendation": "STRONGLY_RECOMMENDED" | "TAKE_A_CHANCE" | "RISKY" | "NOT_RECOMMENDED",
  "confidence_level": "High" | "Medium" | "Low",
  "total_score": <number 0-100>,
  "category_scores": {
    "skills_match": <number 0-100>,
    "experience_quality": <number 0-100>,
    "assessment_performance": <number 0-100>,
    "reliability": <number 0-100>,
    "financial_responsibility": <number 0-100>
  },
  "detailed_analysis": {
    "skills_assessment": {
      "matched_skills": <number>,
      "missing_skills": [<array of missing skills>],
      "skill_gaps": "<description>",
      "verification_status": "<assessment of verified vs unverified skills>",
      "experience_relevance": "<assessment of experience relevance>"
    },
    "experience_evaluation": {
      "total_experience": "<summary>",
      "job_stability": "<assessment>",
      "career_progression": "<assessment>",
      "current_employment_status": "<status and impact>",
      "industry_relevance": "<relevance to target job>"
    },
    "performance_indicators": {
      "assessment_trend": "<trend analysis>",
      "learning_ability": "<assessment>",
      "skill_development": "<assessment>",
      "consistency": "<assessment>"
    },
    "risk_assessment": {
      "reliability_concerns": "<any concerns>",
      "red_flags": [<array of concerns>],
      "mitigation_strategies": [<array of strategies>],
      "background_check_recommendations": "<recommendations>"
    }
  },
  "strengths": [<array of 3-5 key strengths>],
  "concerns": [<array of 3-5 key concerns>],
  "recommendations": {
    "hiring_decision": "<detailed recommendation>",
    "interview_focus_areas": [<array of areas to explore>],
    "probation_considerations": "<recommendations for probation period>",
    "training_needs": [<array of training recommendations>],
    "salary_recommendation": "<salary recommendation with justification>"
  },
  "reasoning": "<detailed explanation of the assessment and recommendation>"
}

Please provide a thorough, balanced assessment that considers the Indian job market context, industry standards, and gives the candidate a fair evaluation while helping the employer make an informed decision.`;
  }

  /**
   * Structure AI response to match our existing format
   */
  structureAIResponse(aiAnalysis, candidateData) {
    try {
      // Map AI response to our existing structure
      const totalScore = aiAnalysis.total_score || 0;
      const recommendation = aiAnalysis.overall_recommendation || 'NOT_RECOMMENDED';
      const confidence = aiAnalysis.confidence_level || 'Low';

      return {
        candidate: candidateData.candidate,
        job: candidateData.job,
        assessment: {
          total_score: Math.round(totalScore),
          recommendation: recommendation.replace('_', ' '),
          confidence: confidence,
          breakdown: {
            skills: {
              score: Math.round(aiAnalysis.category_scores?.skills_match || 0),
              weight: 30,
              details: {
                matched_skills: aiAnalysis.detailed_analysis?.skills_assessment?.matched_skills || 0,
                missing_skills: aiAnalysis.detailed_analysis?.skills_assessment?.missing_skills || [],
                skill_gaps: aiAnalysis.detailed_analysis?.skills_assessment?.skill_gaps || '',
                verification_status: aiAnalysis.detailed_analysis?.skills_assessment?.verification_status || '',
                experience_relevance: aiAnalysis.detailed_analysis?.skills_assessment?.experience_relevance || ''
              }
            },
            experience: {
              score: Math.round(aiAnalysis.category_scores?.experience_quality || 0),
              weight: 25,
              details: {
                total_experience: aiAnalysis.detailed_analysis?.experience_evaluation?.total_experience || '',
                job_stability: aiAnalysis.detailed_analysis?.experience_evaluation?.job_stability || '',
                career_progression: aiAnalysis.detailed_analysis?.experience_evaluation?.career_progression || '',
                current_employment: aiAnalysis.detailed_analysis?.experience_evaluation?.current_employment_status || '',
                industry_relevance: aiAnalysis.detailed_analysis?.experience_evaluation?.industry_relevance || ''
              }
            },
            assessments: {
              score: Math.round(aiAnalysis.category_scores?.assessment_performance || 0),
              weight: 20,
              details: {
                assessment_trend: aiAnalysis.detailed_analysis?.performance_indicators?.assessment_trend || '',
                learning_ability: aiAnalysis.detailed_analysis?.performance_indicators?.learning_ability || '',
                skill_development: aiAnalysis.detailed_analysis?.performance_indicators?.skill_development || '',
                consistency: aiAnalysis.detailed_analysis?.performance_indicators?.consistency || ''
              }
            },
            reliability: {
              score: Math.round(aiAnalysis.category_scores?.reliability || 0),
              weight: 15,
              details: {
                reliability_concerns: aiAnalysis.detailed_analysis?.risk_assessment?.reliability_concerns || '',
                red_flags: aiAnalysis.detailed_analysis?.risk_assessment?.red_flags || [],
                mitigation_strategies: aiAnalysis.detailed_analysis?.risk_assessment?.mitigation_strategies || [],
                background_check: aiAnalysis.detailed_analysis?.risk_assessment?.background_check_recommendations || ''
              }
            },
            credit_score: {
              score: Math.round(aiAnalysis.category_scores?.financial_responsibility || 0),
              weight: 10,
              details: {
                credit_score: candidateData.financial.credit_score,
                financial_responsibility: aiAnalysis.detailed_analysis?.risk_assessment?.reliability_concerns || '',
                savings_behavior: candidateData.financial.monthly_savings_goal > 0 ? 'Has savings goals' : 'No savings goals'
              }
            }
          },
          strengths: aiAnalysis.strengths || [],
          concerns: aiAnalysis.concerns || [],
          recommendations: [
            aiAnalysis.recommendations?.hiring_decision || '',
            ...(aiAnalysis.recommendations?.interview_focus_areas || []),
            ...(aiAnalysis.recommendations?.training_needs || [])
          ].filter(Boolean),
          ai_reasoning: aiAnalysis.reasoning || '',
          ai_powered: true,
          model_used: 'gpt-4'
        },
        generated_at: new Date()
      };

    } catch (error) {
      console.error('Error structuring AI response:', error);
      throw new Error('Failed to structure AI assessment response');
    }
  }
}

module.exports = new OpenAIHiringAssessmentService();