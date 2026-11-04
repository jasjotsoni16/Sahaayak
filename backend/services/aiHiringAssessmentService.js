const UserSkill = require('../Model/UserSkill');
const UserExperience = require('../Model/UserExperience');
const User = require('../Model/User');
const Job = require('../Model/Job');
const Assessment = require('../Model/Assessment');
const CreditScore = require('../Model/creditScore');

class AIHiringAssessmentService {
  constructor() {
    // Scoring weights for different factors
    this.weights = {
      skills: 0.30,           // 30% - Skills match and verification
      experience: 0.25,       // 25% - Work experience and tenure
      assessments: 0.20,      // 20% - Assessment scores
      reliability: 0.15,      // 15% - Abuse reports and reliability
      creditScore: 0.10       // 10% - Financial responsibility
    };

    // Risk thresholds
    this.thresholds = {
      recommended: 75,        // 75+ = Strongly Recommended
      takeChance: 60,         // 60-74 = Take a Chance
      risky: 40,              // 40-59 = Risky
      notRecommended: 0       // 0-39 = Not Recommended
    };
  }

  /**
   * Main assessment function - analyzes candidate and provides recommendation
   * @param {String} seekerId - ID of the job seeker
   * @param {String} jobId - ID of the job being applied for
   * @returns {Object} - Assessment result with recommendation
   */
  async assessCandidate(seekerId, jobId) {
    try {
      console.log(`🤖 AI Assessment: Analyzing candidate ${seekerId} for job ${jobId}`);

      // Get candidate and job data
      const candidate = await User.findById(seekerId);
      const job = await Job.findById(jobId).populate('skills_required', 'name');

      if (!candidate || !job) {
        throw new Error('Candidate or job not found');
      }

      // Perform individual assessments
      const skillsAssessment = await this.assessSkills(seekerId, job.skills_required);
      const experienceAssessment = await this.assessExperience(seekerId);
      const assessmentScores = await this.assessAssessmentHistory(seekerId);
      const reliabilityAssessment = await this.assessReliability(candidate);
      const creditAssessment = await this.assessCreditScore(seekerId);

      // Calculate weighted total score
      const totalScore = this.calculateTotalScore({
        skills: skillsAssessment.score,
        experience: experienceAssessment.score,
        assessments: assessmentScores.score,
        reliability: reliabilityAssessment.score,
        creditScore: creditAssessment.score
      });

      // Generate recommendation
      const recommendation = this.generateRecommendation(totalScore);

      // Compile detailed analysis
      const analysis = {
        candidate: {
          id: seekerId,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone_number
        },
        job: {
          id: jobId,
          title: job.title,
          required_skills: job.skills_required.map(skill => skill.name)
        },
        assessment: {
          total_score: Math.round(totalScore),
          recommendation: recommendation.level,
          confidence: recommendation.confidence,
          breakdown: {
            skills: {
              score: Math.round(skillsAssessment.score),
              weight: this.weights.skills * 100,
              details: skillsAssessment.details
            },
            experience: {
              score: Math.round(experienceAssessment.score),
              weight: this.weights.experience * 100,
              details: experienceAssessment.details
            },
            assessments: {
              score: Math.round(assessmentScores.score),
              weight: this.weights.assessments * 100,
              details: assessmentScores.details
            },
            reliability: {
              score: Math.round(reliabilityAssessment.score),
              weight: this.weights.reliability * 100,
              details: reliabilityAssessment.details
            },
            credit_score: {
              score: Math.round(creditAssessment.score),
              weight: this.weights.creditScore * 100,
              details: creditAssessment.details
            }
          },
          strengths: this.identifyStrengths({
            skills: skillsAssessment,
            experience: experienceAssessment,
            assessments: assessmentScores,
            reliability: reliabilityAssessment,
            creditScore: creditAssessment
          }),
          concerns: this.identifyConcerns({
            skills: skillsAssessment,
            experience: experienceAssessment,
            assessments: assessmentScores,
            reliability: reliabilityAssessment,
            creditScore: creditAssessment
          }),
          recommendations: recommendation.suggestions
        },
        generated_at: new Date()
      };

      console.log(`🎯 AI Assessment Complete: ${recommendation.level} (${Math.round(totalScore)}%)`);
      return analysis;

    } catch (error) {
      console.error('Error in AI candidate assessment:', error);
      throw error;
    }
  }

  /**
   * Assess candidate's skills match with job requirements
   */
  async assessSkills(seekerId, requiredSkills) {
    try {
      const userSkills = await UserSkill.find({ user_id: seekerId })
        .populate('skill_id', 'name');

      if (!userSkills || userSkills.length === 0) {
        return {
          score: 0,
          details: {
            matched_skills: 0,
            total_required: requiredSkills.length,
            verified_skills: 0,
            average_experience: 0,
            skill_gaps: requiredSkills.map(skill => skill.name)
          }
        };
      }

      const requiredSkillNames = requiredSkills.map(skill => skill.name.toLowerCase());
      const userSkillMap = new Map();
      
      userSkills.forEach(userSkill => {
        if (userSkill.skill_id) {
          userSkillMap.set(userSkill.skill_id.name.toLowerCase(), userSkill);
        }
      });

      let matchedSkills = 0;
      let verifiedSkills = 0;
      let totalExperience = 0;
      let skillGaps = [];

      requiredSkillNames.forEach(requiredSkill => {
        if (userSkillMap.has(requiredSkill)) {
          const userSkill = userSkillMap.get(requiredSkill);
          matchedSkills++;
          totalExperience += userSkill.experience_years || 0;
          
          if (userSkill.is_verified) {
            verifiedSkills++;
          }
        } else {
          skillGaps.push(requiredSkill);
        }
      });

      const skillMatchPercentage = (matchedSkills / requiredSkills.length) * 100;
      const verificationBonus = (verifiedSkills / Math.max(matchedSkills, 1)) * 20;
      const experienceBonus = Math.min((totalExperience / Math.max(matchedSkills, 1)) * 5, 20);

      const skillScore = Math.min(skillMatchPercentage + verificationBonus + experienceBonus, 100);

      return {
        score: skillScore,
        details: {
          matched_skills: matchedSkills,
          total_required: requiredSkills.length,
          verified_skills: verifiedSkills,
          average_experience: matchedSkills > 0 ? (totalExperience / matchedSkills).toFixed(1) : 0,
          skill_gaps: skillGaps,
          match_percentage: Math.round(skillMatchPercentage),
          verification_bonus: Math.round(verificationBonus),
          experience_bonus: Math.round(experienceBonus)
        }
      };

    } catch (error) {
      console.error('Error assessing skills:', error);
      return { score: 0, details: { error: 'Failed to assess skills' } };
    }
  }

  /**
   * Assess candidate's work experience
   */
  async assessExperience(seekerId) {
    try {
      const experiences = await UserExperience.find({ seeker_id: seekerId });

      if (!experiences || experiences.length === 0) {
        return {
          score: 0,
          details: {
            total_jobs: 0,
            total_experience_months: 0,
            average_tenure: 0,
            job_stability: 'No experience',
            current_employment: false
          }
        };
      }

      let totalExperienceMonths = 0;
      let currentlyEmployed = false;
      let jobCount = experiences.length;
      let tenures = [];

      experiences.forEach(exp => {
        const startDate = new Date(exp.date_joined);
        const endDate = exp.date_left ? new Date(exp.date_left) : new Date();
        
        if (!exp.date_left) {
          currentlyEmployed = true;
        }

        const tenureMonths = (endDate - startDate) / (1000 * 60 * 60 * 24 * 30);
        tenures.push(tenureMonths);
        totalExperienceMonths += tenureMonths;
      });

      const averageTenure = totalExperienceMonths / jobCount;
      const experienceYears = totalExperienceMonths / 12;

      // Scoring logic
      let experienceScore = 0;
      
      // Base score for having experience
      experienceScore += Math.min(experienceYears * 10, 40); // Up to 40 points for 4+ years
      
      // Job stability bonus
      if (averageTenure >= 24) experienceScore += 20; // 2+ years average = excellent
      else if (averageTenure >= 12) experienceScore += 15; // 1+ year average = good
      else if (averageTenure >= 6) experienceScore += 10; // 6+ months average = fair
      
      // Current employment bonus
      if (currentlyEmployed) experienceScore += 15;
      
      // Multiple jobs experience
      if (jobCount >= 3) experienceScore += 10;
      else if (jobCount >= 2) experienceScore += 5;

      experienceScore = Math.min(experienceScore, 100);

      let stabilityRating;
      if (averageTenure >= 24) stabilityRating = 'Excellent';
      else if (averageTenure >= 12) stabilityRating = 'Good';
      else if (averageTenure >= 6) stabilityRating = 'Fair';
      else stabilityRating = 'Concerning';

      return {
        score: experienceScore,
        details: {
          total_jobs: jobCount,
          total_experience_months: Math.round(totalExperienceMonths),
          total_experience_years: Math.round(experienceYears * 10) / 10,
          average_tenure: Math.round(averageTenure),
          job_stability: stabilityRating,
          current_employment: currentlyEmployed
        }
      };

    } catch (error) {
      console.error('Error assessing experience:', error);
      return { score: 0, details: { error: 'Failed to assess experience' } };
    }
  }

  /**
   * Assess candidate's assessment history and scores
   */
  async assessAssessmentHistory(seekerId) {
    try {
      const assessments = await Assessment.find({ 
        user_id: seekerId, 
        status: 'completed' 
      }).populate('skill_id', 'name');

      if (!assessments || assessments.length === 0) {
        return {
          score: 50, // Neutral score for no assessments
          details: {
            total_assessments: 0,
            average_score: 0,
            passed_assessments: 0,
            failed_assessments: 0,
            assessment_trend: 'No assessments taken'
          }
        };
      }

      let totalScore = 0;
      let passedCount = 0;
      let failedCount = 0;

      assessments.forEach(assessment => {
        totalScore += assessment.percentage || 0;
        if (assessment.percentage >= 70) {
          passedCount++;
        } else {
          failedCount++;
        }
      });

      const averageScore = totalScore / assessments.length;
      const passRate = (passedCount / assessments.length) * 100;

      // Scoring logic
      let assessmentScore = 0;
      
      // Base score from average performance
      assessmentScore += Math.min(averageScore, 80); // Up to 80 points for average score
      
      // Pass rate bonus
      if (passRate >= 90) assessmentScore += 20;
      else if (passRate >= 75) assessmentScore += 15;
      else if (passRate >= 60) assessmentScore += 10;
      else if (passRate >= 50) assessmentScore += 5;

      assessmentScore = Math.min(assessmentScore, 100);

      let trend;
      if (averageScore >= 85) trend = 'Excellent performer';
      else if (averageScore >= 75) trend = 'Good performer';
      else if (averageScore >= 65) trend = 'Average performer';
      else trend = 'Below average performer';

      return {
        score: assessmentScore,
        details: {
          total_assessments: assessments.length,
          average_score: Math.round(averageScore),
          passed_assessments: passedCount,
          failed_assessments: failedCount,
          pass_rate: Math.round(passRate),
          assessment_trend: trend
        }
      };

    } catch (error) {
      console.error('Error assessing assessment history:', error);
      return { score: 50, details: { error: 'Failed to assess assessment history' } };
    }
  }

  /**
   * Assess candidate's reliability based on abuse reports
   */
  async assessReliability(candidate) {
    try {
      const falseAccusations = candidate.false_accusation_count || 0;
      const trueAbuseReports = candidate.abuse_true_count || 0;

      // Scoring logic (starts at 100, deductions for issues)
      let reliabilityScore = 100;

      // Deduct for true abuse reports (major red flags)
      reliabilityScore -= trueAbuseReports * 30; // -30 points per true abuse

      // Deduct for false accusations (minor concern)
      reliabilityScore -= falseAccusations * 5; // -5 points per false accusation

      // Ensure score doesn't go below 0
      reliabilityScore = Math.max(reliabilityScore, 0);

      let reliabilityRating;
      if (reliabilityScore >= 90) reliabilityRating = 'Excellent';
      else if (reliabilityScore >= 75) reliabilityRating = 'Good';
      else if (reliabilityScore >= 60) reliabilityRating = 'Fair';
      else if (reliabilityScore >= 40) reliabilityRating = 'Concerning';
      else reliabilityRating = 'High Risk';

      return {
        score: reliabilityScore,
        details: {
          false_accusations: falseAccusations,
          true_abuse_reports: trueAbuseReports,
          reliability_rating: reliabilityRating,
          risk_level: trueAbuseReports > 0 ? 'High' : falseAccusations > 2 ? 'Medium' : 'Low'
        }
      };

    } catch (error) {
      console.error('Error assessing reliability:', error);
      return { score: 100, details: { error: 'Failed to assess reliability' } };
    }
  }

  /**
   * Assess candidate's credit score as indicator of financial responsibility
   */
  async assessCreditScore(seekerId) {
    try {
      const creditScoreDoc = await CreditScore.findOne({ user_id: seekerId });
      
      if (!creditScoreDoc) {
        return {
          score: 50, // Neutral score for no credit score
          details: {
            credit_score: 'Not available',
            financial_responsibility: 'Unknown',
            score_range: 'N/A'
          }
        };
      }

      const creditScore = creditScoreDoc.score || 0;
      
      // Convert credit score (0-100) to assessment score
      let assessmentScore = creditScore;

      let responsibilityRating;
      let scoreRange;
      
      if (creditScore >= 80) {
        responsibilityRating = 'Excellent';
        scoreRange = 'Excellent (80-100)';
      } else if (creditScore >= 60) {
        responsibilityRating = 'Good';
        scoreRange = 'Good (60-79)';
      } else if (creditScore >= 40) {
        responsibilityRating = 'Fair';
        scoreRange = 'Fair (40-59)';
      } else {
        responsibilityRating = 'Poor';
        scoreRange = 'Poor (0-39)';
      }

      return {
        score: assessmentScore,
        details: {
          credit_score: creditScore,
          financial_responsibility: responsibilityRating,
          score_range: scoreRange
        }
      };

    } catch (error) {
      console.error('Error assessing credit score:', error);
      return { score: 50, details: { error: 'Failed to assess credit score' } };
    }
  }

  /**
   * Calculate weighted total score
   */
  calculateTotalScore(scores) {
    return (
      scores.skills * this.weights.skills +
      scores.experience * this.weights.experience +
      scores.assessments * this.weights.assessments +
      scores.reliability * this.weights.reliability +
      scores.creditScore * this.weights.creditScore
    );
  }

  /**
   * Generate recommendation based on total score
   */
  generateRecommendation(totalScore) {
    let level, confidence, suggestions;

    if (totalScore >= this.thresholds.recommended) {
      level = 'STRONGLY RECOMMENDED';
      confidence = 'High';
      suggestions = [
        'Candidate shows excellent qualifications across all areas',
        'Strong skills match with job requirements',
        'Reliable work history and good performance record',
        'Proceed with confidence to next hiring stage'
      ];
    } else if (totalScore >= this.thresholds.takeChance) {
      level = 'TAKE A CHANCE';
      confidence = 'Medium';
      suggestions = [
        'Candidate shows good potential with some areas for improvement',
        'Consider additional interview rounds to assess fit',
        'May benefit from training in specific skill areas',
        'Monitor performance closely during probation period'
      ];
    } else if (totalScore >= this.thresholds.risky) {
      level = 'RISKY';
      confidence = 'Low';
      suggestions = [
        'Candidate has significant gaps in required qualifications',
        'Consider only if no better candidates are available',
        'Extensive training and supervision will be required',
        'Implement strict probation period with clear milestones'
      ];
    } else {
      level = 'NOT RECOMMENDED';
      confidence = 'High';
      suggestions = [
        'Candidate does not meet minimum requirements for this position',
        'Significant concerns about reliability or performance',
        'High risk of poor job performance or workplace issues',
        'Recommend looking for alternative candidates'
      ];
    }

    return { level, confidence, suggestions };
  }

  /**
   * Identify candidate strengths
   */
  identifyStrengths(assessments) {
    const strengths = [];

    if (assessments.skills.score >= 80) {
      strengths.push('Excellent skills match with job requirements');
    }
    if (assessments.experience.score >= 80) {
      strengths.push('Strong work experience and job stability');
    }
    if (assessments.assessments.score >= 80) {
      strengths.push('Excellent assessment performance history');
    }
    if (assessments.reliability.score >= 90) {
      strengths.push('High reliability with no concerning reports');
    }
    if (assessments.creditScore.score >= 80) {
      strengths.push('Excellent financial responsibility');
    }

    if (strengths.length === 0) {
      strengths.push('Candidate shows basic qualifications for the role');
    }

    return strengths;
  }

  /**
   * Identify areas of concern
   */
  identifyConcerns(assessments) {
    const concerns = [];

    if (assessments.skills.score < 60) {
      concerns.push('Significant skills gaps for job requirements');
    }
    if (assessments.experience.score < 60) {
      concerns.push('Limited or unstable work experience');
    }
    if (assessments.assessments.score < 60) {
      concerns.push('Poor assessment performance history');
    }
    if (assessments.reliability.score < 80) {
      concerns.push('Reliability concerns due to abuse reports');
    }
    if (assessments.creditScore.score < 60) {
      concerns.push('Poor financial responsibility indicators');
    }

    return concerns;
  }
}

module.exports = new AIHiringAssessmentService();