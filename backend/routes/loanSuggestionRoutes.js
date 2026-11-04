
const express = require('express');
const router = express.Router();
const LoanSuggestion = require('../Model/LoanSuggestion');
const { requireAuth } = require('../middleware/auth');

// Get loan suggestions for a specific user
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const suggestions = await LoanSuggestion.find({ userId: req.params.userId })
      .populate('skillId', 'name')
      .sort({ timestamp: -1 });
    res.status(200).json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Manually trigger loan suggestion generation for a user
router.post('/generate/:userId', requireAuth, async (req, res) => {
  try {
    const { generateLoanSuggestion } = require('../services/loanSuggestionService');
    const suggestions = await generateLoanSuggestion(req.params.userId);
    
    if (suggestions && suggestions.length > 0) {
      res.status(200).json({ 
        message: `Generated ${suggestions.length} loan suggestions`, 
        suggestions 
      });
    } else {
      res.status(200).json({ 
        message: 'No new loan suggestions generated (may already exist or no skills found)', 
        suggestions: [] 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
