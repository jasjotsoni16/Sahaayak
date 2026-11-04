const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const Loan = require('../Model/Loan');
const User = require('../Model/User');

// Create a new loan application
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      user_id,
      suggested_amount,
      purpose,
      repayment_period_months,
      interest_rate,
      business_name,
      skill_name,
      status = 'pending'
    } = req.body;

    // Validate required fields
    if (!user_id || !suggested_amount || !purpose) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['user_id', 'suggested_amount', 'purpose']
      });
    }

    // Verify user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create loan application
    const loan = new Loan({
      user_id,
      amount: suggested_amount,
      purpose,
      repayment_period_months: repayment_period_months || 12,
      interest_rate: interest_rate || 12,
      business_name,
      skill_name,
      status,
      application_date: new Date(),
      applicant_name: user.name,
      applicant_phone: user.phone_number,
      applicant_email: user.email
    });

    await loan.save();

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      loan: {
        id: loan._id,
        amount: loan.amount,
        purpose: loan.purpose,
        status: loan.status,
        application_date: loan.application_date
      }
    });
  } catch (error) {
    console.error('Error creating loan application:', error);
    res.status(500).json({
      error: 'Failed to submit loan application',
      details: error.message
    });
  }
});

// Get all loan applications for a user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user_id: userId };
    if (status) {
      filter.status = status;
    }

    const loans = await Loan.find(filter)
      .sort({ application_date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user_id', 'name phone_number email');

    const total = await Loan.countDocuments(filter);

    res.json({
      success: true,
      loans,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_loans: total,
        per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user loans:', error);
    res.status(500).json({
      error: 'Failed to fetch loan applications',
      details: error.message
    });
  }
});

// Get a specific loan application
router.get('/:loanId', authenticateToken, async (req, res) => {
  try {
    const { loanId } = req.params;
    
    const loan = await Loan.findById(loanId)
      .populate('user_id', 'name phone_number email city');

    if (!loan) {
      return res.status(404).json({ error: 'Loan application not found' });
    }

    // Check if user can access this loan (owner or admin)
    if (loan.user_id._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      loan
    });
  } catch (error) {
    console.error('Error fetching loan:', error);
    res.status(500).json({
      error: 'Failed to fetch loan application',
      details: error.message
    });
  }
});

// Update loan application status (admin only)
router.put('/:loanId/status', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { loanId } = req.params;
    const { status, admin_notes, approved_amount, approved_interest_rate } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'disbursed', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        valid_statuses: validStatuses
      });
    }

    const updateData = {
      status,
      last_updated: new Date()
    };

    if (admin_notes) updateData.admin_notes = admin_notes;
    if (approved_amount) updateData.approved_amount = approved_amount;
    if (approved_interest_rate) updateData.approved_interest_rate = approved_interest_rate;
    if (status === 'approved') updateData.approval_date = new Date();
    if (status === 'disbursed') updateData.disbursement_date = new Date();

    const loan = await Loan.findByIdAndUpdate(
      loanId,
      updateData,
      { new: true }
    ).populate('user_id', 'name phone_number email');

    if (!loan) {
      return res.status(404).json({ error: 'Loan application not found' });
    }

    res.json({
      success: true,
      message: `Loan application ${status} successfully`,
      loan
    });
  } catch (error) {
    console.error('Error updating loan status:', error);
    res.status(500).json({
      error: 'Failed to update loan status',
      details: error.message
    });
  }
});

// Get all loan applications (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { status, page = 1, limit = 20, sort_by = 'application_date', sort_order = 'desc' } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const sortOrder = sort_order === 'asc' ? 1 : -1;
    const sortObj = { [sort_by]: sortOrder };

    const loans = await Loan.find(filter)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user_id', 'name phone_number email city');

    const total = await Loan.countDocuments(filter);

    // Get status counts for dashboard
    const statusCounts = await Loan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total_amount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      loans,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_loans: total,
        per_page: parseInt(limit)
      },
      statistics: {
        status_counts: statusCounts,
        total_applications: total
      }
    });
  } catch (error) {
    console.error('Error fetching all loans:', error);
    res.status(500).json({
      error: 'Failed to fetch loan applications',
      details: error.message
    });
  }
});

// Delete loan application (user can delete only pending applications)
router.delete('/:loanId', authenticateToken, async (req, res) => {
  try {
    const { loanId } = req.params;
    
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan application not found' });
    }

    // Check if user can delete this loan
    if (loan.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow deletion of pending applications
    if (loan.status !== 'pending' && req.user.role !== 'admin') {
      return res.status(400).json({ 
        error: 'Cannot delete loan application',
        message: 'Only pending applications can be deleted'
      });
    }

    await Loan.findByIdAndDelete(loanId);

    res.json({
      success: true,
      message: 'Loan application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting loan:', error);
    res.status(500).json({
      error: 'Failed to delete loan application',
      details: error.message
    });
  }
});

module.exports = router;