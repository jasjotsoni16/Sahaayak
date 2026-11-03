const Notification = require('../Model/Notification');
const UserSkill = require('../Model/UserSkill');
const User = require('../Model/User');

class NotificationService {
  
  // Create a new notification
  static async createNotification(userId, type, title, message, data = {}, actionUrl = null, actionText = null) {
    try {
      const notification = new Notification({
        user_id: userId,
        type,
        title,
        message,
        data,
        action_url: actionUrl,
        action_text: actionText
      });

      await notification.save();
      console.log(`Notification created for user ${userId}: ${type}`);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Notify seekers about new job matching their skills
  static async notifyJobMatch(job) {
    try {
      if (!job.skills_required || job.skills_required.length === 0) {
        return;
      }

      // Find all seekers who have the required skills
      const userSkills = await UserSkill.find({
        skill_id: { $in: job.skills_required }
      }).populate('user_id', '_id name role').populate('skill_id', 'name');

      const notifiedUsers = new Set();

      for (const userSkill of userSkills) {
        const user = userSkill.user_id;
        
        // Only notify seekers and avoid duplicate notifications
        if (user && user.role === 'seeker' && !notifiedUsers.has(user._id.toString())) {
          notifiedUsers.add(user._id.toString());

          const title = `New Job Match: ${job.title}`;
          const message = `A new job "${job.title}" matches your skill "${userSkill.skill_id.name}". Salary: ₹${job.salary_min}-₹${job.salary_max}`;
          
          await this.createNotification(
            user._id,
            'job_match',
            title,
            message,
            {
              job_id: job._id,
              job_title: job.title,
              skill_name: userSkill.skill_id.name,
              salary_min: job.salary_min,
              salary_max: job.salary_max,
              location: job.location
            },
            `/jobs/${job._id}`,
            'Apply Now'
          );
        }
      }

      console.log(`Job match notifications sent to ${notifiedUsers.size} seekers for job: ${job.title}`);
    } catch (error) {
      console.error('Error sending job match notifications:', error);
    }
  }

  // Notify about new loan suggestion
  static async notifyLoanSuggestion(userId, loanSuggestion) {
    try {
      const title = `New Loan Suggestion: ${loanSuggestion.skillName} Business`;
      const message = `We've found a loan opportunity for your ${loanSuggestion.skillName} skill. Amount: ₹${loanSuggestion.suggestedAmount.toLocaleString()} for ${loanSuggestion.businessName}`;
      
      await this.createNotification(
        userId,
        'loan_suggestion',
        title,
        message,
        {
          loan_id: loanSuggestion._id,
          skill_name: loanSuggestion.skillName,
          business_name: loanSuggestion.businessName,
          suggested_amount: loanSuggestion.suggestedAmount,
          interest_rate: loanSuggestion.interestRate
        },
        '/loan-suggestions',
        'View Details'
      );

      console.log(`Loan suggestion notification sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending loan suggestion notification:', error);
    }
  }

  // Notify about credit score update
  static async notifyCreditScoreUpdate(userId, oldScore, newScore) {
    try {
      const scoreChange = newScore - oldScore;
      const changeText = scoreChange > 0 ? `increased by ${scoreChange}` : `decreased by ${Math.abs(scoreChange)}`;
      
      const title = 'Credit Score Updated';
      const message = `Your credit score has ${changeText}. New score: ${newScore}/100`;
      
      await this.createNotification(
        userId,
        'credit_score_update',
        title,
        message,
        {
          old_score: oldScore,
          new_score: newScore,
          change: scoreChange
        },
        '/credit-score',
        'View Details'
      );

      console.log(`Credit score update notification sent to user ${userId}: ${oldScore} → ${newScore}`);
    } catch (error) {
      console.error('Error sending credit score update notification:', error);
    }
  }

  // Notify about assessment assignment
  static async notifyAssessmentAssigned(userId, assessment) {
    try {
      const title = `Assessment Assigned: ${assessment.skill_id.name}`;
      const message = `You have been assigned an assessment for ${assessment.skill_id.name} skill. Complete it to verify your expertise.`;
      
      await this.createNotification(
        userId,
        'assessment_assigned',
        title,
        message,
        {
          assessment_id: assessment._id,
          skill_name: assessment.skill_id.name,
          job_title: assessment.job_id ? assessment.job_id.title : null,
          total_questions: assessment.total_questions,
          duration_minutes: assessment.duration_minutes
        },
        `/assessment/${assessment._id}`,
        'Take Assessment'
      );

      console.log(`Assessment assignment notification sent to user ${userId} for skill ${assessment.skill_id.name}`);
    } catch (error) {
      console.error('Error sending assessment assignment notification:', error);
    }
  }

  // Notify about assessment result
  static async notifyAssessmentResult(userId, assessment) {
    try {
      const passed = assessment.percentage >= 70;
      const title = `Assessment ${passed ? 'Passed' : 'Failed'}: ${assessment.skill_id.name}`;
      const message = `Your ${assessment.skill_id.name} assessment is complete. Score: ${assessment.percentage}% (${assessment.correct_answers}/${assessment.total_questions})`;
      
      await this.createNotification(
        userId,
        'assessment_result',
        title,
        message,
        {
          assessment_id: assessment._id,
          skill_name: assessment.skill_id.name,
          percentage: assessment.percentage,
          correct_answers: assessment.correct_answers,
          total_questions: assessment.total_questions,
          passed: passed
        },
        '/skills',
        'View Skills'
      );

      console.log(`Assessment result notification sent to user ${userId}: ${assessment.percentage}%`);
    } catch (error) {
      console.error('Error sending assessment result notification:', error);
    }
  }

  // Get notifications for a user
  static async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
    try {
      const filter = { user_id: userId };
      if (unreadOnly) {
        filter.is_read = false;
      }

      const notifications = await Notification.find(filter)
        .sort({ created_at: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Notification.countDocuments(filter);
      const unreadCount = await Notification.countDocuments({ user_id: userId, is_read: false });

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        unread_count: unreadCount
      };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user_id: userId },
        { is_read: true, read_at: new Date() },
        { new: true }
      );

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { user_id: userId, is_read: false },
        { is_read: true, read_at: new Date() }
      );

      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId, userId) {
    try {
      const result = await Notification.deleteOne({ _id: notificationId, user_id: userId });
      return result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get unread count for a user
  static async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({ user_id: userId, is_read: false });
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // ==================== EMPLOYER NOTIFICATIONS ====================

  // Notify employer about new job application
  static async notifyJobApplication(employerId, application) {
    try {
      const title = `New Job Application: ${application.job_id.title}`;
      const message = `${application.seeker_id.name} has applied for your job "${application.job_id.title}". Review their profile and consider for hiring.`;
      
      await this.createNotification(
        employerId,
        'job_application_received',
        title,
        message,
        {
          application_id: application._id,
          job_id: application.job_id._id,
          job_title: application.job_id.title,
          seeker_id: application.seeker_id._id,
          seeker_name: application.seeker_id.name,
          seeker_email: application.seeker_id.email,
          seeker_phone: application.seeker_id.phone_number
        },
        `/employer-dashboard`,
        'View Applications'
      );

      console.log(`Job application notification sent to employer ${employerId}`);
    } catch (error) {
      console.error('Error sending job application notification:', error);
    }
  }

  // Notify employer when seeker starts assessment
  static async notifyAssessmentStarted(employerId, assessment) {
    try {
      const title = `Assessment Started: ${assessment.skill_id.name}`;
      const message = `${assessment.user_id.name} has started the ${assessment.skill_id.name} assessment for ${assessment.job_id ? assessment.job_id.title : 'skill verification'}.`;
      
      await this.createNotification(
        employerId,
        'assessment_started',
        title,
        message,
        {
          assessment_id: assessment._id,
          skill_name: assessment.skill_id.name,
          seeker_id: assessment.user_id._id,
          seeker_name: assessment.user_id.name,
          job_id: assessment.job_id ? assessment.job_id._id : null,
          job_title: assessment.job_id ? assessment.job_id.title : null,
          started_at: assessment.start_time
        },
        `/employer-dashboard`,
        'View Progress'
      );

      console.log(`Assessment started notification sent to employer ${employerId}`);
    } catch (error) {
      console.error('Error sending assessment started notification:', error);
    }
  }

  // Notify employer when seeker completes assessment
  static async notifyAssessmentCompleted(employerId, assessment) {
    try {
      const passed = assessment.percentage >= 70;
      const title = `Assessment ${passed ? 'Completed' : 'Failed'}: ${assessment.skill_id.name}`;
      const message = `${assessment.user_id.name} has completed the ${assessment.skill_id.name} assessment with ${assessment.percentage}% score (${assessment.correct_answers}/${assessment.total_questions}).`;
      
      await this.createNotification(
        employerId,
        'assessment_completed',
        title,
        message,
        {
          assessment_id: assessment._id,
          skill_name: assessment.skill_id.name,
          seeker_id: assessment.user_id._id,
          seeker_name: assessment.user_id.name,
          job_id: assessment.job_id ? assessment.job_id._id : null,
          job_title: assessment.job_id ? assessment.job_id.title : null,
          percentage: assessment.percentage,
          correct_answers: assessment.correct_answers,
          total_questions: assessment.total_questions,
          passed: passed,
          completed_at: assessment.completed_at
        },
        `/employer-dashboard`,
        'View Results'
      );

      console.log(`Assessment completed notification sent to employer ${employerId}: ${assessment.percentage}%`);
    } catch (error) {
      console.error('Error sending assessment completed notification:', error);
    }
  }

  // Notify employer about offer response (acceptance/rejection/negotiation)
  static async notifyOfferResponse(employerId, offer, responseType) {
    try {
      let title, message;
      
      switch (responseType) {
        case 'accepted':
          title = `Offer Accepted: ${offer.seeker_id.name}`;
          message = `${offer.seeker_id.name} has accepted your job offer for ${offer.job_id.title}. Salary: ₹${offer.salary_amount}.`;
          break;
        case 'rejected':
          title = `Offer Rejected: ${offer.seeker_id.name}`;
          message = `${offer.seeker_id.name} has rejected your job offer for ${offer.job_id.title}.`;
          break;
        case 'negotiation':
          title = `Offer Negotiation: ${offer.seeker_id.name}`;
          message = `${offer.seeker_id.name} wants to negotiate your job offer for ${offer.job_id.title}. Counter offer: ₹${offer.counter_offer_amount || 'Not specified'}.`;
          break;
        default:
          title = `Offer Update: ${offer.seeker_id.name}`;
          message = `${offer.seeker_id.name} has responded to your job offer for ${offer.job_id.title}.`;
      }
      
      await this.createNotification(
        employerId,
        'offer_response',
        title,
        message,
        {
          offer_id: offer._id,
          job_id: offer.job_id._id,
          job_title: offer.job_id.title,
          seeker_id: offer.seeker_id._id,
          seeker_name: offer.seeker_id.name,
          response_type: responseType,
          salary_amount: offer.salary_amount,
          counter_offer_amount: offer.counter_offer_amount,
          status: offer.status
        },
        `/employer-dashboard`,
        'View Offer'
      );

      console.log(`Offer response notification sent to employer ${employerId}: ${responseType}`);
    } catch (error) {
      console.error('Error sending offer response notification:', error);
    }
  }

  // Notify employer when seeker signs agreement
  static async notifyAgreementSigned(employerId, agreement) {
    try {
      const title = `Agreement Signed: ${agreement.seeker_id.name}`;
      const message = `${agreement.seeker_id.name} has signed the employment agreement for ${agreement.job_id.title}. The employment relationship is now official.`;
      
      await this.createNotification(
        employerId,
        'agreement_signed',
        title,
        message,
        {
          agreement_id: agreement._id,
          job_id: agreement.job_id._id,
          job_title: agreement.job_id.title,
          seeker_id: agreement.seeker_id._id,
          seeker_name: agreement.seeker_id.name,
          signed_at: agreement.seeker_signed_at,
          start_date: agreement.start_date,
          salary: agreement.salary
        },
        `/employer-agreements`,
        'View Agreement'
      );

      console.log(`Agreement signed notification sent to employer ${employerId}`);
    } catch (error) {
      console.error('Error sending agreement signed notification:', error);
    }
  }

  // Notify employer about AI assessment completion
  static async notifyAIAssessmentComplete(employerId, aiAssessment, fullAssessment) {
    try {
      const candidate = fullAssessment.candidate;
      const job = fullAssessment.job;
      const assessment = fullAssessment.assessment;
      
      const title = `AI Assessment: ${candidate.name} - ${assessment.recommendation}`;
      let message;
      
      switch (assessment.recommendation) {
        case 'STRONGLY RECOMMENDED':
          message = `AI analysis recommends ${candidate.name} for ${job.title}. Score: ${assessment.total_score}%. Excellent candidate with strong qualifications.`;
          break;
        case 'TAKE A CHANCE':
          message = `AI suggests taking a chance on ${candidate.name} for ${job.title}. Score: ${assessment.total_score}%. Good potential with some areas for improvement.`;
          break;
        case 'RISKY':
          message = `AI flags ${candidate.name} as risky for ${job.title}. Score: ${assessment.total_score}%. Significant concerns identified.`;
          break;
        case 'NOT RECOMMENDED':
          message = `AI does not recommend ${candidate.name} for ${job.title}. Score: ${assessment.total_score}%. Major qualification gaps or concerns.`;
          break;
        default:
          message = `AI assessment completed for ${candidate.name} applying to ${job.title}. Score: ${assessment.total_score}%.`;
      }
      
      await this.createNotification(
        employerId,
        'ai_assessment_complete',
        title,
        message,
        {
          ai_assessment_id: aiAssessment._id,
          application_id: aiAssessment.application_id,
          seeker_id: candidate.id,
          seeker_name: candidate.name,
          job_id: job.id,
          job_title: job.title,
          total_score: assessment.total_score,
          recommendation: assessment.recommendation,
          confidence: assessment.confidence,
          top_strengths: assessment.strengths.slice(0, 3),
          top_concerns: assessment.concerns.slice(0, 3)
        },
        `/employer-dashboard`,
        'View Assessment'
      );

      console.log(`AI assessment notification sent to employer ${employerId}: ${assessment.recommendation}`);
    } catch (error) {
      console.error('Error sending AI assessment notification:', error);
    }
  }
}

module.exports = NotificationService;