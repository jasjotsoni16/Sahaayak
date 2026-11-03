const creditScoreService = require('../services/creditScoreService');
const creditScoreScheduler = require('../services/creditScoreScheduler');
const CreditScore = require('../Model/creditScore');
const User = require('../Model/User');

// Get credit score for a specific user
exports.getCreditScore = async (req, res) => {
    try {
        const userId = req.params.userId || req.user._id;
        
        // Check if user is a seeker
        const user = await User.findById(userId);
        if (!user || user.role !== 'seeker') {
            return res.status(400).json({ 
                message: 'Credit scores are only available for job seekers' 
            });
        }

        const creditScore = await CreditScore.findOne({ user_id: userId });
        
        if (!creditScore) {
            // Calculate and create credit score if it doesn't exist
            const result = await creditScoreService.updateCreditScore(userId);
            return res.status(200).json({
                message: 'Credit score calculated',
                creditScore: result.creditScore,
                calculation: result
            });
        }

        res.status(200).json({
            creditScore,
            lastCalculated: creditScore.last_calculated
        });

    } catch (error) {
        console.error('Error getting credit score:', error);
        res.status(500).json({ 
            message: 'Error retrieving credit score', 
            error: error.message 
        });
    }
};

// Get detailed credit score calculation for a user
exports.getCreditScoreDetails = async (req, res) => {
    try {
        const userId = req.params.userId || req.user._id;
        
        const calculation = await creditScoreService.calculateCreditScore(userId);
        
        if (calculation.error) {
            return res.status(400).json(calculation);
        }

        res.status(200).json({
            message: 'Credit score calculation details',
            ...calculation
        });

    } catch (error) {
        console.error('Error getting credit score details:', error);
        res.status(500).json({ 
            message: 'Error calculating credit score details', 
            error: error.message 
        });
    }
};

// Update credit score for a specific user
exports.updateCreditScore = async (req, res) => {
    try {
        const userId = req.params.userId || req.user._id;
        
        const result = await creditScoreService.updateCreditScore(userId);
        
        if (result.error) {
            return res.status(400).json(result);
        }

        res.status(200).json({
            message: 'Credit score updated successfully',
            ...result
        });

    } catch (error) {
        console.error('Error updating credit score:', error);
        res.status(500).json({ 
            message: 'Error updating credit score', 
            error: error.message 
        });
    }
};

// Bulk update all seeker credit scores (admin only)
exports.updateAllCreditScores = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Admin privileges required.' 
            });
        }

        const result = await creditScoreService.updateAllSeekerCreditScores();

        res.status(200).json({
            message: 'Bulk credit score update completed',
            ...result
        });

    } catch (error) {
        console.error('Error in bulk credit score update:', error);
        res.status(500).json({ 
            message: 'Error updating credit scores', 
            error: error.message 
        });
    }
};

// Get credit score statistics (admin only)
exports.getCreditScoreStats = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Admin privileges required.' 
            });
        }

        const stats = await CreditScore.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    averageScore: { $avg: '$score' },
                    minScore: { $min: '$score' },
                    maxScore: { $max: '$score' },
                    scoreRanges: {
                        $push: {
                            $switch: {
                                branches: [
                                    { case: { $lt: ['$score', 30] }, then: 'poor' },
                                    { case: { $lt: ['$score', 50] }, then: 'fair' },
                                    { case: { $lt: ['$score', 70] }, then: 'good' },
                                    { case: { $lt: ['$score', 85] }, then: 'very_good' }
                                ],
                                default: 'excellent'
                            }
                        }
                    }
                }
            }
        ]);

        // Count score ranges
        const scoreRanges = stats[0]?.scoreRanges || [];
        const rangeCounts = {
            poor: scoreRanges.filter(r => r === 'poor').length,
            fair: scoreRanges.filter(r => r === 'fair').length,
            good: scoreRanges.filter(r => r === 'good').length,
            very_good: scoreRanges.filter(r => r === 'very_good').length,
            excellent: scoreRanges.filter(r => r === 'excellent').length
        };

        res.status(200).json({
            message: 'Credit score statistics',
            stats: stats[0] || {},
            scoreDistribution: rangeCounts,
            schedulerStatus: creditScoreScheduler.getStatus()
        });

    } catch (error) {
        console.error('Error getting credit score stats:', error);
        res.status(500).json({ 
            message: 'Error retrieving credit score statistics', 
            error: error.message 
        });
    }
};

// Trigger immediate credit score update (admin only)
exports.triggerImmediateUpdate = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Admin privileges required.' 
            });
        }

        // Trigger immediate update
        creditScoreScheduler.triggerImmediateUpdate();

        res.status(200).json({
            message: 'Immediate credit score update triggered successfully'
        });

    } catch (error) {
        console.error('Error triggering immediate update:', error);
        res.status(500).json({ 
            message: 'Error triggering credit score update', 
            error: error.message 
        });
    }
};