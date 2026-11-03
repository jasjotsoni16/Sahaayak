const User = require('../Model/User');
const CreditScore = require('../Model/creditScore');
const UserExperience = require('../Model/UserExperience');
const SalaryAgreement = require('../Model/SalaryAgreement');
const NotificationService = require('./notificationService');
const UserRating = require('../Model/UserRating');
const Report = require('../Model/Report');

class CreditScoreService {
    constructor() {
        this.baseScore = 30; // Starting credit score (30/100)
        this.maxScore = 100; // Maximum credit score
        this.minScore = 10; // Minimum credit score
    }

    /**
     * Calculate credit score for a seeker based on various factors
     * @param {String} userId - User ID
     * @returns {Object} - Credit score calculation details
     */
    async calculateCreditScore(userId) {
        try {
            // Only calculate for seekers
            const user = await User.findById(userId);
            if (!user || user.role !== 'seeker') {
                return { error: 'Credit score calculation only available for seekers' };
            }

            // Get user's job experiences
            const experiences = await UserExperience.find({ 
                seeker_id: userId,
                end_date: null // Current jobs only
            });

            // Verified income: active salary agreements with at least one payment the user confirmed
            const salaryAgreements = await SalaryAgreement.verifiedForEmployee(userId);

            // Get ratings for the seeker
            const ratings = await UserRating.find({ receiver_user_id: userId });

            // Get reports against the seeker
            const reports = await Report.find({ reported_user_id: userId });

            // Calculate score components
            const scoreComponents = {
                base: this.baseScore,
                savingsGoal: this.calculateSavingsGoalScore(user),
                jobCount: this.calculateJobCountScore(experiences.length),
                salaryScore: this.calculateSalaryScore(salaryAgreements),
                jobStability: this.calculateJobStabilityScore(experiences),
                ratingScore: this.calculateRatingScore(ratings),
                reportAbuseScore: this.calculateReportAbuseScore(reports)
            };

            // Calculate total score
            const totalScore = Math.min(
                this.maxScore,
                Math.max(
                    this.minScore,
                    scoreComponents.base +
                    scoreComponents.savingsGoal +
                    scoreComponents.jobCount +
                    scoreComponents.salaryScore +
                    scoreComponents.jobStability +
                    scoreComponents.ratingScore +
                    scoreComponents.reportAbuseScore
                )
            );

            return {
                userId,
                totalScore,
                components: scoreComponents,
                factors: this.generateFactorsExplanation(scoreComponents),
                recommendations: this.generateRecommendations(scoreComponents, user, experiences)
            };

        } catch (error) {
            console.error('Error calculating credit score:', error);
            throw error;
        }
    }

    /**
     * Calculate score based on savings goal
     * @param {Object} user - The seeker (monthlySavings is their monthly savings goal)
     * @returns {Number} - Score points
     */
    calculateSavingsGoalScore(user) {
        const goal = user && user.monthlySavings;
        if (!goal || goal <= 0) {
            return 0; // No savings goal = no points
        }

        // Base points for having a savings goal
        let score = 5;

        // Additional points based on goal amount
        if (goal >= 1000) score += 2;
        if (goal >= 5000) score += 3;
        if (goal >= 10000) score += 5;

        return score;
    }

    /**
     * Calculate score based on number of jobs
     * @param {Number} jobCount - Number of current jobs
     * @returns {Number} - Score points
     */
    calculateJobCountScore(jobCount) {
        if (jobCount === 0) return 0;
        if (jobCount === 1) return 8; // Single job
        if (jobCount === 2) return 12; // Two jobs - significant boost
        if (jobCount >= 3) return 15; // Multiple jobs - maximum boost

        return 0;
    }

    /**
     * Calculate score based on verified salary (agreements with employee-confirmed payments)
     * @param {Array} salaryAgreements - Verified salary agreements
     * @returns {Number} - Score points
     */
    calculateSalaryScore(salaryAgreements) {
        if (!salaryAgreements || salaryAgreements.length === 0) {
            return 0;
        }

        // Calculate total monthly income
        const totalMonthlyIncome = salaryAgreements.reduce((total, payment) => {
            let monthlyAmount = payment.amount;
            
            // Convert to monthly equivalent
            switch (payment.frequency) {
                case 'daily':
                    monthlyAmount = payment.amount * 30;
                    break;
                case 'weekly':
                    monthlyAmount = payment.amount * 4;
                    break;
                case 'bi-weekly':
                    monthlyAmount = payment.amount * 2;
                    break;
                case 'monthly':
                default:
                    monthlyAmount = payment.amount;
                    break;
            }
            
            return total + monthlyAmount;
        }, 0);

        // Score based on income level
        let score = 3; // Base score for having income

        if (totalMonthlyIncome >= 10000) score += 3;
        if (totalMonthlyIncome >= 25000) score += 5;
        if (totalMonthlyIncome >= 50000) score += 8;
        if (totalMonthlyIncome >= 100000) score += 10;

        // Regularity: several confirmed payments show income arrives repeatedly
        const confirmedCount = salaryAgreements.reduce(
            (n, a) => n + (a.payments || []).filter(p => p.status === 'confirmed').length, 0);
        if (confirmedCount >= 3) score += 2;

        return score;
    }

    /**
     * Calculate score based on job stability (tenure)
     * @param {Array} experiences - User's job experiences
     * @returns {Number} - Score points
     */
    calculateJobStabilityScore(experiences) {
        if (!experiences || experiences.length === 0) {
            return 0;
        }

        let stabilityScore = 0;
        const now = new Date();

        experiences.forEach(exp => {
            const startDate = new Date(exp.start_date);
            const monthsWorked = (now - startDate) / (1000 * 60 * 60 * 24 * 30);

            if (monthsWorked >= 12) stabilityScore += 3; // 1+ year
            else if (monthsWorked >= 6) stabilityScore += 2; // 6+ months
            else if (monthsWorked >= 3) stabilityScore += 1; // 3+ months
            else if (monthsWorked >= 1) stabilityScore += 0.5; // 1+ month
        });

        return Math.min(stabilityScore, 10); // Cap at 10 points
    }

    /**
     * Calculate score based on seeker's received ratings
     * @param {Array} ratings - Array of UserRating objects where the user is the receiver
     * @returns {Number} - Score points
     */
    calculateRatingScore(ratings) {
        if (!ratings || ratings.length === 0) {
            return 0; // No ratings, no points
        }

        const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / ratings.length;

        let score = 0;

        // Points based on average rating
        if (averageRating >= 4.5) score += 8;
        else if (averageRating >= 4.0) score += 6;
        else if (averageRating >= 3.5) score += 4;
        else if (averageRating >= 3.0) score += 2;

        // Additional points for number of ratings
        if (ratings.length >= 10) score += 5;
        else if (ratings.length >= 5) score += 3;
        else if (ratings.length >= 2) score += 1;

        return Math.min(score, 15); // Cap rating score at 15 points
    }

    /**
     * Calculate score based on reports against the seeker
     * @param {Array} reports - Array of Report objects where the user is the reported_user_id
     * @returns {Number} - Score points (negative for penalties)
     */
    calculateReportAbuseScore(reports) {
        if (!reports || reports.length === 0) {
            return 0; // No reports, no penalty
        }

        let penalty = 0;

        reports.forEach(report => {
            switch (report.status) {
                case 'abuse_true':
                    penalty -= 10; // Significant penalty for confirmed abuse
                    break;
                case 'pending':
                    penalty -= 2; // Minor penalty for pending reports
                    break;
                case 'reviewed':
                    penalty -= 5; // Moderate penalty for reviewed reports
                    break;
                case 'false_accusation':
                case 'misunderstanding':
                    // No penalty or even a small positive adjustment for false accusations
                    penalty += 1; 
                    break;
                default:
                    // Other statuses like 'resolved', 'rejected' might have minor or no penalty
                    break;
            }
        });

        return Math.max(penalty, -20); // Cap maximum penalty at -20 points
    }

    /**
     * Generate human-readable explanation of score factors
     * @param {Object} components - Score components
     * @returns {Object} - Factors explanation
     */
    generateFactorsExplanation(components) {
        const factors = {};

        if (components.savingsGoal > 0) {
            factors.savings_goal = `+${components.savingsGoal} points for having a savings goal`;
        } else {
            factors.no_savings_goal = 'Set a monthly savings goal to improve your score';
        }

        if (components.jobCount > 0) {
            factors.employment = `+${components.jobCount} points for employment status`;
        } else {
            factors.no_employment = 'Get a job to significantly improve your score';
        }

        if (components.salaryScore > 0) {
            factors.income = `+${components.salaryScore} points for regular income`;
        }

        if (components.jobStability > 0) {
            factors.job_stability = `+${components.jobStability} points for job stability`;
        }

        return factors;
    }

    /**
     * Generate recommendations for improving credit score
     * @param {Object} components - Score components
     * @param {Object} user - The seeker
     * @param {Array} experiences - User's experiences
     * @returns {Array} - Recommendations
     */
    generateRecommendations(components, user, experiences) {
        const recommendations = [];

        if (components.savingsGoal === 0) {
            recommendations.push({
                priority: 'high',
                action: 'Set a monthly savings goal',
                impact: '+5-15 points',
                description: 'Setting a savings goal shows financial planning and can significantly boost your score'
            });
        }

        if (components.jobCount === 0) {
            recommendations.push({
                priority: 'high',
                action: 'Find employment',
                impact: '+8-15 points',
                description: 'Having a job is the biggest factor in improving your credit score'
            });
        } else if (components.jobCount < 12) {
            recommendations.push({
                priority: 'medium',
                action: 'Consider a second job or side gig',
                impact: '+5-8 points',
                description: 'Multiple income sources improve financial stability'
            });
        }

        if (experiences && experiences.length > 0 && components.salaryScore === 0) {
            recommendations.push({
                priority: 'medium',
                action: 'Get your salary recorded',
                impact: '+3-26 points',
                description: 'Ask your employer to record your salary payments, then confirm them in the app to show verified income'
            });
        }

        if (experiences && experiences.length > 0 && components.jobStability < 5) {
            recommendations.push({
                priority: 'low',
                action: 'Maintain job stability',
                impact: '+1-3 points',
                description: 'Longer job tenure improves your credit profile'
            });
        }

        return recommendations;
    }

    /**
     * Update credit score for a user
     * @param {String} userId - User ID
     * @returns {Object} - Updated credit score
     */
    async updateCreditScore(userId) {
        try {
            const calculation = await this.calculateCreditScore(userId);
            
            if (calculation.error) {
                return calculation;
            }

            // Get old score for comparison
            const existingCreditScore = await CreditScore.findOne({ user_id: userId });
            const oldScore = existingCreditScore ? existingCreditScore.score : this.baseScore;
            
            // Update or create credit score record
            const creditScore = await CreditScore.findOneAndUpdate(
                { user_id: userId },
                {
                    score: calculation.totalScore,
                    factors: calculation.factors,
                    last_calculated: new Date()
                },
                { 
                    upsert: true, 
                    new: true 
                }
            );

            // Send notification if score changed significantly (more than 2 points)
            if (Math.abs(calculation.totalScore - oldScore) >= 2) {
                try {
                    await NotificationService.notifyCreditScoreUpdate(userId, oldScore, calculation.totalScore);
                } catch (notificationError) {
                    console.error('Error sending credit score update notification:', notificationError);
                }
            }

            return {
                ...calculation,
                creditScore,
                updated: true,
                oldScore
            };

        } catch (error) {
            console.error('Error updating credit score:', error);
            throw error;
        }
    }

    /**
     * Bulk update credit scores for all seekers
     * @returns {Object} - Update summary
     */
    async updateAllSeekerCreditScores() {
        try {
            const seekers = await User.find({ role: 'seeker' });
            
            let updated = 0;
            let errors = 0;
            const results = [];

            for (const seeker of seekers) {
                try {
                    const result = await this.updateCreditScore(seeker._id);
                    if (!result.error) {
                        updated++;
                        results.push({
                            userId: seeker._id,
                            email: seeker.email || seeker.phone_number,
                            oldScore: result.creditScore.score,
                            newScore: result.totalScore,
                            improvement: result.totalScore - (result.creditScore.score || this.baseScore)
                        });
                    }
                } catch (error) {
                    errors++;
                    console.error(`Error updating credit score for user ${seeker._id}:`, error.message);
                }
            }

            return {
                totalSeekers: seekers.length,
                updated,
                errors,
                results: results.slice(0, 10) // Return first 10 results
            };

        } catch (error) {
            console.error('Error in bulk credit score update:', error);
            throw error;
        }
    }
}

module.exports = new CreditScoreService();