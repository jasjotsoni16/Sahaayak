const cron = require('node-cron');
const creditScoreService = require('./creditScoreService');

class CreditScoreScheduler {
    constructor() {
        this.isRunning = false;
    }

    // Start the credit score scheduler
    start() {
        if (this.isRunning) {
            console.log('Credit score scheduler is already running');
            return;
        }

        console.log('🎯 Starting automatic credit score scheduler...');
        
        // Run daily at 2 AM to update all credit scores
        this.dailyTask = cron.schedule('0 2 * * *', async () => {
            await this.runDailyUpdate();
        }, {
            scheduled: true,
            timezone: "Asia/Kolkata"
        });

        // Run every 6 hours for real-time updates (when users make changes)
        this.realTimeTask = cron.schedule('0 */6 * * *', async () => {
            await this.runRealtimeUpdate();
        }, {
            scheduled: true,
            timezone: "Asia/Kolkata"
        });

        this.isRunning = true;
        console.log('✅ Credit score scheduler started successfully');
    }

    // Stop the credit score scheduler
    stop() {
        if (this.dailyTask) {
            this.dailyTask.stop();
        }
        if (this.realTimeTask) {
            this.realTimeTask.stop();
        }
        this.isRunning = false;
        console.log('⏹️ Credit score scheduler stopped');
    }

    // Run daily comprehensive update
    async runDailyUpdate() {
        try {
            console.log('🔄 Running daily credit score update for all seekers...');
            
            const startTime = new Date();
            const result = await creditScoreService.updateAllSeekerCreditScores();
            const endTime = new Date();
            const duration = (endTime - startTime) / 1000;

            console.log('📊 Daily Credit Score Update Summary:');
            console.log(`   Total seekers: ${result.totalSeekers}`);
            console.log(`   Successfully updated: ${result.updated}`);
            console.log(`   Errors: ${result.errors}`);
            console.log(`   Duration: ${duration}s`);

            // Log top improvements
            if (result.results && result.results.length > 0) {
                console.log('🏆 Top credit score improvements:');
                result.results
                    .sort((a, b) => b.improvement - a.improvement)
                    .slice(0, 5)
                    .forEach((user, index) => {
                        console.log(`   ${index + 1}. ${user.email}: ${user.oldScore} → ${user.newScore} (+${user.improvement})`);
                    });
            }

        } catch (error) {
            console.error('❌ Error in daily credit score update:', error);
        }
    }

    // Run real-time update for recently active users
    async runRealtimeUpdate() {
        try {
            console.log('⚡ Running real-time credit score updates...');
            
            // This could be enhanced to only update users who have had recent activity
            // For now, we'll run a lighter version of the full update
            const result = await creditScoreService.updateAllSeekerCreditScores();
            
            console.log(`⚡ Real-time update: ${result.updated} scores updated, ${result.errors} errors`);

        } catch (error) {
            console.error('❌ Error in real-time credit score update:', error);
        }
    }

    // Manual trigger for immediate update
    async triggerImmediateUpdate() {
        console.log('🚀 Triggering immediate credit score update...');
        await this.runDailyUpdate();
    }

    // Get scheduler status
    getStatus() {
        return {
            isRunning: this.isRunning,
            nextDailyRun: this.dailyTask ? this.dailyTask.nextDate() : null,
            nextRealtimeRun: this.realTimeTask ? this.realTimeTask.nextDate() : null
        };
    }
}

// Export singleton instance
module.exports = new CreditScoreScheduler();