const cron = require('node-cron');
const jobRecommendationService = require('./jobRecommendationService');
const User = require('../Model/User');

class JobRecommendationScheduler {
    constructor() {
        this.isRunning = false;
        this.lastRun = null;
    }

    /**
     * Start the job recommendation scheduler
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ Job recommendation scheduler is already running');
            return;
        }

        // Run daily at 9:00 AM
        this.dailyTask = cron.schedule('0 9 * * *', async () => {
            await this.runDailyRecommendations();
        }, {
            scheduled: false,
            timezone: "Asia/Kolkata"
        });

        // Run weekly on Monday at 10:00 AM for comprehensive analysis
        this.weeklyTask = cron.schedule('0 10 * * 1', async () => {
            await this.runWeeklyRecommendations();
        }, {
            scheduled: false,
            timezone: "Asia/Kolkata"
        });

        this.dailyTask.start();
        this.weeklyTask.start();
        this.isRunning = true;

        console.log('🎯 Job recommendation scheduler started');
        console.log('📅 Daily recommendations: Every day at 9:00 AM');
        console.log('📅 Weekly comprehensive analysis: Every Monday at 10:00 AM');
    }

    /**
     * Stop the scheduler
     */
    stop() {
        if (this.dailyTask) {
            this.dailyTask.stop();
        }
        if (this.weeklyTask) {
            this.weeklyTask.stop();
        }
        this.isRunning = false;
        console.log('🛑 Job recommendation scheduler stopped');
    }

    /**
     * Run daily job recommendations for active seekers
     */
    async runDailyRecommendations() {
        try {
            console.log('🎯 Starting daily job recommendation generation...');
            const startTime = new Date();

            // Get active seekers (those who have logged in recently or have active applications)
            const activeSeekers = await this.getActiveSeekers();
            
            let successful = 0;
            let failed = 0;

            for (const seeker of activeSeekers) {
                try {
                    await jobRecommendationService.generateJobRecommendations(seeker._id);
                    successful++;
                    console.log(`✅ Generated recommendations for ${seeker.name}`);
                } catch (error) {
                    failed++;
                    console.error(`❌ Failed to generate recommendations for ${seeker.name}:`, error.message);
                }

                // Add small delay to prevent overwhelming the system
                await this.delay(1000);
            }

            const endTime = new Date();
            const duration = (endTime - startTime) / 1000;

            console.log(`🎯 Daily recommendation generation completed in ${duration}s`);
            console.log(`📊 Results: ${successful} successful, ${failed} failed out of ${activeSeekers.length} active seekers`);

            this.lastRun = {
                type: 'daily',
                timestamp: endTime,
                totalSeekers: activeSeekers.length,
                successful,
                failed,
                duration
            };

        } catch (error) {
            console.error('❌ Error in daily recommendation generation:', error);
        }
    }

    /**
     * Run weekly comprehensive recommendations for all seekers
     */
    async runWeeklyRecommendations() {
        try {
            console.log('🎯 Starting weekly comprehensive job recommendation generation...');
            const startTime = new Date();

            // Get all seekers for comprehensive weekly analysis
            const allSeekers = await User.find({ role: 'seeker' }).select('_id name email');
            
            let successful = 0;
            let failed = 0;

            for (const seeker of allSeekers) {
                try {
                    await jobRecommendationService.generateJobRecommendations(seeker._id);
                    successful++;
                    console.log(`✅ Generated weekly recommendations for ${seeker.name}`);
                } catch (error) {
                    failed++;
                    console.error(`❌ Failed to generate weekly recommendations for ${seeker.name}:`, error.message);
                }

                // Add delay to prevent system overload
                await this.delay(2000);
            }

            const endTime = new Date();
            const duration = (endTime - startTime) / 1000;

            console.log(`🎯 Weekly recommendation generation completed in ${duration}s`);
            console.log(`📊 Results: ${successful} successful, ${failed} failed out of ${allSeekers.length} total seekers`);

            this.lastRun = {
                type: 'weekly',
                timestamp: endTime,
                totalSeekers: allSeekers.length,
                successful,
                failed,
                duration
            };

        } catch (error) {
            console.error('❌ Error in weekly recommendation generation:', error);
        }
    }

    /**
     * Get active seekers for daily recommendations
     * @returns {Array} - Active seekers
     */
    async getActiveSeekers() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get seekers who have been active recently
        const activeSeekers = await User.find({
            role: 'seeker',
            $or: [
                { updatedAt: { $gte: thirtyDaysAgo } }, // Updated profile recently
                { createdAt: { $gte: thirtyDaysAgo } }   // New users
            ]
        }).select('_id name email');

        // Also include seekers with recent applications
        const UserApplication = require('../Model/UserApplication');
        const recentApplications = await UserApplication.find({
            createdAt: { $gte: thirtyDaysAgo }
        }).distinct('seeker_id');

        const seekersWithRecentApps = await User.find({
            _id: { $in: recentApplications },
            role: 'seeker'
        }).select('_id name email');

        // Combine and deduplicate
        const allActiveSeekers = [...activeSeekers, ...seekersWithRecentApps];
        const uniqueSeekers = allActiveSeekers.filter((seeker, index, self) =>
            index === self.findIndex(s => s._id.toString() === seeker._id.toString())
        );

        console.log(`📊 Found ${uniqueSeekers.length} active seekers for daily recommendations`);
        return uniqueSeekers;
    }

    /**
     * Manual trigger for testing
     */
    async runManualRecommendations(seekerId = null) {
        try {
            if (seekerId) {
                console.log(`🎯 Running manual recommendation for seeker: ${seekerId}`);
                const result = await jobRecommendationService.generateJobRecommendations(seekerId);
                console.log(`✅ Manual recommendation completed for seeker: ${seekerId}`);
                return result;
            } else {
                console.log('🎯 Running manual recommendations for all active seekers...');
                await this.runDailyRecommendations();
                return { success: true, message: 'Manual recommendations completed' };
            }
        } catch (error) {
            console.error('❌ Error in manual recommendation generation:', error);
            throw error;
        }
    }

    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastRun: this.lastRun,
            nextDailyRun: this.dailyTask ? this.dailyTask.nextDate() : null,
            nextWeeklyRun: this.weeklyTask ? this.weeklyTask.nextDate() : null
        };
    }

    /**
     * Utility function to add delay
     * @param {Number} ms - Milliseconds to delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new JobRecommendationScheduler();