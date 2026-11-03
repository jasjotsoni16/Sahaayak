const User = require('../Model/User');
const Job = require('../Model/Job');
const UserExperience = require('../Model/UserExperience');
const CreditScore = require('../Model/creditScore');
const UserSkill = require('../Model/UserSkill');
const SalaryAgreement = require('../Model/SalaryAgreement');
const UserApplication = require('../Model/UserApplication');
const NotificationService = require('./notificationService');
const OpenAI = require('openai');

class JobRecommendationService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    /**
     * Generate job recommendations for a seeker
     * @param {String} seekerId - User ID of the seeker
     * @returns {Object} - Recommendation results
     */
    async generateJobRecommendations(seekerId) {
        try {
            console.log(`🎯 Starting job recommendation for seeker: ${seekerId}`);

            // Get seeker profile and related data
            const seekerData = await this.getSeekerProfile(seekerId);
            if (!seekerData.user || seekerData.user.role !== 'seeker') {
                throw new Error('Invalid seeker or user not found');
            }

            // Calculate seeker score and preferences
            const seekerAnalysis = await this.analyzeSeekerProfile(seekerData);
            
            // Find suitable jobs
            const candidateJobs = await this.findCandidateJobs(seekerData, seekerAnalysis);
            
            if (candidateJobs.length === 0) {
                console.log('❌ No suitable jobs found for seeker');
                return {
                    success: false,
                    message: 'No suitable jobs found at this time',
                    recommendations: []
                };
            }

            // Score and rank jobs
            const scoredJobs = await this.scoreJobs(candidateJobs, seekerData, seekerAnalysis);
            
            // Get top recommendations
            const topRecommendations = scoredJobs.slice(0, 5);
            
            // Generate AI analysis for top recommendations
            const aiAnalysis = await this.generateAIAnalysis(seekerData, topRecommendations);
            
            // Save recommendations
            const savedRecommendations = await this.saveRecommendations(seekerId, topRecommendations, aiAnalysis);
            
            // Send notifications
            await this.sendRecommendationNotifications(seekerId, topRecommendations);
            
            console.log(`✅ Generated ${topRecommendations.length} job recommendations for seeker`);
            
            return {
                success: true,
                message: `Generated ${topRecommendations.length} job recommendations`,
                recommendations: savedRecommendations,
                aiAnalysis: aiAnalysis,
                seekerProfile: {
                    totalJobs: seekerData.experiences.length,
                    creditScore: seekerData.creditScore?.score || 0,
                    totalSkills: seekerData.skills.length,
                    avgMonthlyIncome: seekerAnalysis.avgMonthlyIncome,
                    experienceMonths: seekerAnalysis.totalExperienceMonths
                }
            };

        } catch (error) {
            console.error('❌ Error generating job recommendations:', error);
            throw error;
        }
    }

    /**
     * Get comprehensive seeker profile data
     * @param {String} seekerId - User ID
     * @returns {Object} - Seeker profile data
     */
    async getSeekerProfile(seekerId) {
        const [user, experiences, creditScore, skills, salaryAgreements, applications] = await Promise.all([
            User.findById(seekerId),
            UserExperience.find({ seeker_id: seekerId }).populate('job_id'),
            CreditScore.findOne({ user_id: seekerId }),
            UserSkill.find({ user_id: seekerId }).populate('skill_id'),
            SalaryAgreement.verifiedForEmployee(seekerId),
            UserApplication.find({ seeker_id: seekerId }).populate('job_id')
        ]);

        return {
            user,
            experiences: experiences || [],
            creditScore,
            skills: skills || [],
            salaryAgreements: salaryAgreements || [],
            applications: applications || []
        };
    }

    /**
     * Analyze seeker profile to determine preferences and capabilities
     * @param {Object} seekerData - Seeker profile data
     * @returns {Object} - Analysis results
     */
    async analyzeSeekerProfile(seekerData) {
        const { user, experiences, creditScore, skills, salaryAgreements } = seekerData;

        // Calculate experience metrics
        const totalExperienceMonths = experiences.reduce((total, exp) => {
            const startDate = new Date(exp.start_date);
            const endDate = exp.end_date ? new Date(exp.end_date) : new Date();
            const months = (endDate - startDate) / (1000 * 60 * 60 * 24 * 30);
            return total + Math.max(0, months);
        }, 0);

        // Calculate average monthly income
        const totalMonthlyIncome = salaryAgreements.reduce((total, payment) => {
            let monthlyAmount = payment.amount;
            switch (payment.frequency) {
                case 'daily': monthlyAmount = payment.amount * 30; break;
                case 'weekly': monthlyAmount = payment.amount * 4; break;
                case 'bi-weekly': monthlyAmount = payment.amount * 2; break;
                default: monthlyAmount = payment.amount; break;
            }
            return total + monthlyAmount;
        }, 0);

        const avgMonthlyIncome = salaryAgreements.length > 0 ? totalMonthlyIncome / salaryAgreements.length : 0;

        // Determine preferred job categories
        const jobCategories = experiences.map(exp => exp.job_id?.category).filter(Boolean);
        const preferredCategories = [...new Set(jobCategories)];

        // Determine skill categories
        const skillCategories = skills.map(skill => skill.skill_id?.category).filter(Boolean);
        const skillSet = skills.map(skill => skill.skill_id?.name).filter(Boolean);

        // Calculate location preferences
        const workLocations = experiences.map(exp => exp.job_id?.location?.city).filter(Boolean);
        const preferredLocations = [...new Set(workLocations)];

        // Determine salary expectations based on history
        const salaryHistory = experiences.map(exp => exp.job_id?.salary).filter(Boolean);
        const avgSalary = salaryHistory.length > 0 ? salaryHistory.reduce((a, b) => a + b, 0) / salaryHistory.length : 0;
        const minExpectedSalary = Math.max(avgSalary * 0.8, avgMonthlyIncome * 0.9);

        return {
            totalExperienceMonths,
            avgMonthlyIncome,
            creditScore: creditScore?.score || 0,
            savingsGoal: user?.monthlySavings || 0,
            preferredCategories,
            skillCategories,
            skillSet,
            preferredLocations,
            minExpectedSalary,
            totalJobs: experiences.length,
            activeJobs: experiences.filter(exp => !exp.end_date).length,
            skillCount: skills.length,
            riskProfile: this.calculateRiskProfile(creditScore?.score || 0, totalExperienceMonths, avgMonthlyIncome)
        };
    }

    /**
     * Calculate risk profile for job recommendations
     * @param {Number} creditScore - Credit score
     * @param {Number} experienceMonths - Total experience in months
     * @param {Number} avgIncome - Average monthly income
     * @returns {String} - Risk profile (low, medium, high)
     */
    calculateRiskProfile(creditScore, experienceMonths, avgIncome) {
        let score = 0;
        
        // Credit score factor
        if (creditScore >= 80) score += 3;
        else if (creditScore >= 60) score += 2;
        else if (creditScore >= 40) score += 1;

        // Experience factor
        if (experienceMonths >= 24) score += 3;
        else if (experienceMonths >= 12) score += 2;
        else if (experienceMonths >= 6) score += 1;

        // Income factor
        if (avgIncome >= 50000) score += 3;
        else if (avgIncome >= 25000) score += 2;
        else if (avgIncome >= 10000) score += 1;

        if (score >= 7) return 'low';
        if (score >= 4) return 'medium';
        return 'high';
    }

    /**
     * Find candidate jobs based on seeker profile
     * @param {Object} seekerData - Seeker profile data
     * @param {Object} seekerAnalysis - Seeker analysis
     * @returns {Array} - Candidate jobs
     */
    async findCandidateJobs(seekerData, seekerAnalysis) {
        const { user, applications } = seekerData;
        const appliedJobIds = applications.map(app => app.job_id?._id?.toString()).filter(Boolean);

        // Build query filters
        const filters = {
            status: 'active',
            _id: { $nin: appliedJobIds } // Exclude already applied jobs
        };

        // Location filter (prefer same city, but include nearby)
        if (user.city) {
            filters.$or = [
                { 'location.city': user.city },
                { 'location.city': { $regex: user.city, $options: 'i' } }
            ];
        }

        // Skill-based filtering
        if (seekerAnalysis.skillSet.length > 0) {
            filters.$or = filters.$or || [];
            filters.$or.push({
                $or: [
                    { required_skills: { $in: seekerAnalysis.skillSet } },
                    { preferred_skills: { $in: seekerAnalysis.skillSet } },
                    { title: { $regex: seekerAnalysis.skillSet.join('|'), $options: 'i' } }
                ]
            });
        }

        // Category filter
        if (seekerAnalysis.preferredCategories.length > 0) {
            filters.$or = filters.$or || [];
            filters.$or.push({
                category: { $in: seekerAnalysis.preferredCategories }
            });
        }

        // Salary filter (not too low compared to expectations)
        if (seekerAnalysis.minExpectedSalary > 0) {
            filters.salary = { $gte: seekerAnalysis.minExpectedSalary * 0.7 };
        }

        const jobs = await Job.find(filters)
            .populate('employer_id', 'name company_name')
            .populate('required_skills')
            .limit(50) // Limit to prevent too many results
            .sort({ created_at: -1 });

        return jobs;
    }

    /**
     * Score jobs based on seeker compatibility
     * @param {Array} jobs - Candidate jobs
     * @param {Object} seekerData - Seeker profile data
     * @param {Object} seekerAnalysis - Seeker analysis
     * @returns {Array} - Scored and sorted jobs
     */
    async scoreJobs(jobs, seekerData, seekerAnalysis) {
        const scoredJobs = jobs.map(job => {
            let score = 0;
            const reasons = [];

            // Skill match score (40% weight)
            const skillMatch = this.calculateSkillMatch(job, seekerAnalysis.skillSet);
            score += skillMatch * 40;
            if (skillMatch > 0.7) reasons.push(`Strong skill match (${Math.round(skillMatch * 100)}%)`);
            else if (skillMatch > 0.4) reasons.push(`Good skill match (${Math.round(skillMatch * 100)}%)`);

            // Location score (20% weight)
            const locationScore = this.calculateLocationScore(job, seekerData.user);
            score += locationScore * 20;
            if (locationScore > 0.8) reasons.push('Excellent location match');
            else if (locationScore > 0.5) reasons.push('Good location match');

            // Salary score (25% weight)
            const salaryScore = this.calculateSalaryScore(job, seekerAnalysis);
            score += salaryScore * 25;
            if (salaryScore > 0.8) reasons.push('Excellent salary offer');
            else if (salaryScore > 0.6) reasons.push('Good salary offer');

            // Experience match (10% weight)
            const experienceScore = this.calculateExperienceMatch(job, seekerAnalysis);
            score += experienceScore * 10;
            if (experienceScore > 0.8) reasons.push('Perfect experience level');

            // Company reputation (5% weight)
            const reputationScore = this.calculateCompanyScore(job);
            score += reputationScore * 5;

            return {
                ...job.toObject(),
                recommendationScore: Math.round(score),
                matchReasons: reasons,
                skillMatch: Math.round(skillMatch * 100),
                locationMatch: Math.round(locationScore * 100),
                salaryMatch: Math.round(salaryScore * 100),
                experienceMatch: Math.round(experienceScore * 100)
            };
        });

        return scoredJobs.sort((a, b) => b.recommendationScore - a.recommendationScore);
    }

    /**
     * Calculate skill match percentage
     * @param {Object} job - Job object
     * @param {Array} userSkills - User skills array
     * @returns {Number} - Match percentage (0-1)
     */
    calculateSkillMatch(job, userSkills) {
        const requiredSkills = job.required_skills || [];
        const preferredSkills = job.preferred_skills || [];
        const allJobSkills = [...requiredSkills, ...preferredSkills];

        if (allJobSkills.length === 0) return 0.5; // Neutral if no skills specified

        const matchedSkills = userSkills.filter(skill => 
            allJobSkills.some(jobSkill => 
                jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(jobSkill.toLowerCase())
            )
        );

        const requiredMatches = userSkills.filter(skill =>
            requiredSkills.some(reqSkill =>
                reqSkill.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(reqSkill.toLowerCase())
            )
        );

        // Weight required skills more heavily
        const requiredWeight = 0.7;
        const preferredWeight = 0.3;

        const requiredScore = requiredSkills.length > 0 ? requiredMatches.length / requiredSkills.length : 1;
        const overallScore = allJobSkills.length > 0 ? matchedSkills.length / allJobSkills.length : 0.5;

        return (requiredScore * requiredWeight) + (overallScore * preferredWeight);
    }

    /**
     * Calculate location compatibility score
     * @param {Object} job - Job object
     * @param {Object} user - User object
     * @returns {Number} - Location score (0-1)
     */
    calculateLocationScore(job, user) {
        if (!job.location || !user.city) return 0.5;

        const jobCity = job.location.city?.toLowerCase();
        const userCity = user.city?.toLowerCase();

        if (jobCity === userCity) return 1.0;
        if (jobCity?.includes(userCity) || userCity?.includes(jobCity)) return 0.8;
        
        // Check if in same state/region (basic check)
        const commonWords = jobCity?.split(' ').filter(word => userCity?.includes(word));
        if (commonWords && commonWords.length > 0) return 0.6;

        return 0.3; // Different location
    }

    /**
     * Calculate salary compatibility score
     * @param {Object} job - Job object
     * @param {Object} seekerAnalysis - Seeker analysis
     * @returns {Number} - Salary score (0-1)
     */
    calculateSalaryScore(job, seekerAnalysis) {
        if (!job.salary || job.salary <= 0) return 0.5;

        const expectedSalary = seekerAnalysis.minExpectedSalary || 10000;
        const ratio = job.salary / expectedSalary;

        if (ratio >= 1.5) return 1.0; // 50% more than expected
        if (ratio >= 1.2) return 0.9; // 20% more than expected
        if (ratio >= 1.0) return 0.8; // Meets expectations
        if (ratio >= 0.8) return 0.6; // 20% less than expected
        if (ratio >= 0.6) return 0.4; // 40% less than expected
        return 0.2; // Much less than expected
    }

    /**
     * Calculate experience level match
     * @param {Object} job - Job object
     * @param {Object} seekerAnalysis - Seeker analysis
     * @returns {Number} - Experience score (0-1)
     */
    calculateExperienceMatch(job, seekerAnalysis) {
        const requiredExp = job.experience_required || 0; // in months
        const userExp = seekerAnalysis.totalExperienceMonths;

        if (requiredExp === 0) return 0.8; // No experience required

        const ratio = userExp / requiredExp;

        if (ratio >= 1.5) return 0.9; // Overqualified
        if (ratio >= 1.0) return 1.0; // Perfect match
        if (ratio >= 0.8) return 0.8; // Close match
        if (ratio >= 0.6) return 0.6; // Somewhat qualified
        return 0.3; // Underqualified
    }

    /**
     * Calculate company reputation score
     * @param {Object} job - Job object
     * @returns {Number} - Company score (0-1)
     */
    calculateCompanyScore(job) {
        // This is a placeholder - in real implementation, you might have company ratings
        const employer = job.employer_id;
        if (!employer) return 0.5;

        // Basic scoring based on available data
        let score = 0.5;
        
        if (employer.company_name) score += 0.2;
        if (employer.verified) score += 0.2;
        if (employer.rating && employer.rating > 4) score += 0.1;

        return Math.min(score, 1.0);
    }

    /**
     * Generate AI analysis for job recommendations
     * @param {Object} seekerData - Seeker profile data
     * @param {Array} recommendations - Top job recommendations
     * @returns {Object} - AI analysis
     */
    async generateAIAnalysis(seekerData, recommendations) {
        try {
            const { user, experiences, skills } = seekerData;
            
            const prompt = `
            Analyze job recommendations for a seeker with the following profile:
            
            Seeker Profile:
            - Name: ${user.name}
            - Location: ${user.city || 'Not specified'}
            - Total Experience: ${experiences.length} jobs
            - Skills: ${skills.map(s => s.skill_id?.name).filter(Boolean).join(', ') || 'None specified'}
            - Previous Job Categories: ${experiences.map(e => e.job_id?.category).filter(Boolean).join(', ') || 'None'}
            
            Top Job Recommendations:
            ${recommendations.slice(0, 3).map((job, index) => `
            ${index + 1}. ${job.title} at ${job.employer_id?.company_name || 'Company'}
               - Salary: ₹${job.salary?.toLocaleString() || 'Not specified'}
               - Location: ${job.location?.city || 'Not specified'}
               - Required Skills: ${job.required_skills?.join(', ') || 'Not specified'}
               - Match Score: ${job.recommendationScore}%
               - Reasons: ${job.matchReasons.join(', ')}
            `).join('')}
            
            Provide a comprehensive analysis including:
            1. Overall career trajectory assessment
            2. Skill gap analysis and recommendations
            3. Salary progression potential
            4. Career growth opportunities
            5. Specific advice for each recommended job
            6. Action items for the seeker
            
            Format the response as a professional career counselor would, being encouraging but realistic.
            `;

            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert career counselor and job market analyst. Provide detailed, actionable career advice based on job recommendations and seeker profiles."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 1500,
                temperature: 0.7
            });

            const analysis = response.choices[0]?.message?.content || 'Analysis not available';

            return {
                aiAnalysis: analysis,
                analysisDate: new Date(),
                recommendationCount: recommendations.length,
                topMatchScore: recommendations[0]?.recommendationScore || 0,
                averageMatchScore: Math.round(
                    recommendations.reduce((sum, job) => sum + job.recommendationScore, 0) / recommendations.length
                ),
                keyInsights: this.extractKeyInsights(recommendations, seekerData)
            };

        } catch (error) {
            console.error('Error generating AI analysis:', error);
            return {
                aiAnalysis: 'AI analysis temporarily unavailable. Please check back later.',
                analysisDate: new Date(),
                error: error.message
            };
        }
    }

    /**
     * Extract key insights from recommendations
     * @param {Array} recommendations - Job recommendations
     * @param {Object} seekerData - Seeker data
     * @returns {Object} - Key insights
     */
    extractKeyInsights(recommendations, seekerData) {
        const avgSalary = recommendations.reduce((sum, job) => sum + (job.salary || 0), 0) / recommendations.length;
        const topCategories = [...new Set(recommendations.map(job => job.category))].slice(0, 3);
        const skillGaps = this.identifySkillGaps(recommendations, seekerData.skills);

        return {
            averageRecommendedSalary: Math.round(avgSalary),
            topJobCategories: topCategories,
            skillGaps: skillGaps,
            locationDiversity: [...new Set(recommendations.map(job => job.location?.city))].length,
            highMatchJobs: recommendations.filter(job => job.recommendationScore >= 80).length
        };
    }

    /**
     * Identify skill gaps from job recommendations
     * @param {Array} recommendations - Job recommendations
     * @param {Array} userSkills - User skills
     * @returns {Array} - Missing skills
     */
    identifySkillGaps(recommendations, userSkills) {
        const userSkillNames = userSkills.map(s => s.skill_id?.name?.toLowerCase()).filter(Boolean);
        const allRequiredSkills = recommendations.flatMap(job => job.required_skills || []);
        const skillFrequency = {};

        allRequiredSkills.forEach(skill => {
            const skillLower = skill.toLowerCase();
            if (!userSkillNames.includes(skillLower)) {
                skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
            }
        });

        return Object.entries(skillFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([skill, count]) => ({ skill, demandCount: count }));
    }

    /**
     * Save recommendations to database
     * @param {String} seekerId - Seeker ID
     * @param {Array} recommendations - Job recommendations
     * @param {Object} aiAnalysis - AI analysis
     * @returns {Array} - Saved recommendations
     */
    async saveRecommendations(seekerId, recommendations, aiAnalysis) {
        // For now, we'll return the recommendations with additional metadata
        // In a full implementation, you might want to create a JobRecommendation model
        return recommendations.map(job => ({
            jobId: job._id,
            title: job.title,
            company: job.employer_id?.company_name,
            salary: job.salary,
            location: job.location?.city,
            matchScore: job.recommendationScore,
            matchReasons: job.matchReasons,
            recommendedAt: new Date(),
            aiAnalysis: aiAnalysis.aiAnalysis
        }));
    }

    /**
     * Send recommendation notifications to seeker
     * @param {String} seekerId - Seeker ID
     * @param {Array} recommendations - Job recommendations
     */
    async sendRecommendationNotifications(seekerId, recommendations) {
        try {
            const topJob = recommendations[0];
            if (!topJob) return;

            const notificationData = {
                user_id: seekerId,
                type: 'job_recommendation',
                title: 'New Job Recommendations Available!',
                message: `We found ${recommendations.length} great job matches for you! Top match: ${topJob.title} at ${topJob.employer_id?.company_name} with ${topJob.recommendationScore}% compatibility.`,
                data: {
                    recommendationCount: recommendations.length,
                    topJobId: topJob._id,
                    topJobTitle: topJob.title,
                    topJobCompany: topJob.employer_id?.company_name,
                    matchScore: topJob.recommendationScore
                }
            };

            await NotificationService.createNotification(notificationData);
            console.log(`📧 Sent job recommendation notification to seeker ${seekerId}`);

        } catch (error) {
            console.error('Error sending recommendation notification:', error);
        }
    }

    /**
     * Get job recommendations for a seeker (for API endpoint)
     * @param {String} seekerId - Seeker ID
     * @returns {Object} - Recommendations with analysis
     */
    async getJobRecommendations(seekerId) {
        try {
            // This would typically fetch from a saved recommendations table
            // For now, we'll generate fresh recommendations
            return await this.generateJobRecommendations(seekerId);
        } catch (error) {
            console.error('Error getting job recommendations:', error);
            throw error;
        }
    }
}

module.exports = new JobRecommendationService();