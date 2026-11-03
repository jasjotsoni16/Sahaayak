const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const jobRecommendationService = require('../services/jobRecommendationService');

// Generate job recommendations for a seeker
router.post('/generate/:seekerId', authenticateToken, async (req, res) => {
  try {
    const { seekerId } = req.params;
    
    // Check if user can access this seeker's data (owner or admin)
    if (req.user._id.toString() !== seekerId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log(`🎯 Generating job recommendations for seeker: ${seekerId}`);
    
    const recommendations = await jobRecommendationService.generateJobRecommendations(seekerId);
    
    res.json({
      success: true,
      message: 'Job recommendations generated successfully',
      ...recommendations
    });

  } catch (error) {
    console.error('Error generating job recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate job recommendations',
      details: error.message
    });
  }
});

// Get existing job recommendations for a seeker
router.get('/seeker/:seekerId', authenticateToken, async (req, res) => {
  try {
    const { seekerId } = req.params;
    
    // Check if user can access this seeker's data (owner or admin)
    if (req.user._id.toString() !== seekerId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const recommendations = await jobRecommendationService.getJobRecommendations(seekerId);
    
    res.json({
      success: true,
      ...recommendations
    });

  } catch (error) {
    console.error('Error fetching job recommendations:', error);
    res.status(500).json({
      error: 'Failed to fetch job recommendations',
      details: error.message
    });
  }
});

// Get recommendations for current user
router.get('/my-recommendations', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'seeker') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Job recommendations are only available for seekers'
      });
    }

    const recommendations = await jobRecommendationService.getJobRecommendations(req.user._id);
    
    res.json({
      success: true,
      ...recommendations
    });

  } catch (error) {
    console.error('Error fetching user recommendations:', error);
    res.status(500).json({
      error: 'Failed to fetch recommendations',
      details: error.message
    });
  }
});

// Generate recommendations for current user
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'seeker') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Job recommendations are only available for seekers'
      });
    }

    console.log(`🎯 Generating job recommendations for current user: ${req.user._id}`);
    
    const recommendations = await jobRecommendationService.generateJobRecommendations(req.user._id);
    
    res.json({
      success: true,
      message: 'Job recommendations generated successfully',
      ...recommendations
    });

  } catch (error) {
    console.error('Error generating user recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      details: error.message
    });
  }
});

// Bulk generate recommendations for all seekers (admin only)
router.post('/generate-all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    console.log('🎯 Generating recommendations for all seekers...');
    
    // Get all seekers
    const User = require('../Model/User');
    const seekers = await User.find({ role: 'seeker' }).select('_id name');
    
    let successful = 0;
    let failed = 0;
    const results = [];

    for (const seeker of seekers) {
      try {
        const recommendations = await jobRecommendationService.generateJobRecommendations(seeker._id);
        successful++;
        results.push({
          seekerId: seeker._id,
          seekerName: seeker.name,
          status: 'success',
          recommendationCount: recommendations.recommendations?.length || 0
        });
      } catch (error) {
        failed++;
        results.push({
          seekerId: seeker._id,
          seekerName: seeker.name,
          status: 'failed',
          error: error.message
        });
        console.error(`Failed to generate recommendations for ${seeker.name}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: `Bulk recommendation generation completed`,
      summary: {
        totalSeekers: seekers.length,
        successful,
        failed
      },
      results: results.slice(0, 20) // Return first 20 results
    });

  } catch (error) {
    console.error('Error in bulk recommendation generation:', error);
    res.status(500).json({
      error: 'Failed to generate bulk recommendations',
      details: error.message
    });
  }
});

module.exports = router;