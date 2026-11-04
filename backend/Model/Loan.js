const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1000, // Minimum loan amount
    max: 10000000 // Maximum loan amount (1 crore)
  },
  purpose: {
    type: String,
    required: true,
    maxlength: 500
  },
  repayment_period_months: {
    type: Number,
    required: true,
    min: 3,
    max: 120 // Maximum 10 years
  },
  interest_rate: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
  business_name: {
    type: String,
    maxlength: 200
  },
  skill_name: {
    type: String,
    maxlength: 100
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'disbursed', 'completed'],
    default: 'pending'
  },
  application_date: {
    type: Date,
    default: Date.now
  },
  approval_date: {
    type: Date
  },
  disbursement_date: {
    type: Date
  },
  completion_date: {
    type: Date
  },
  approved_amount: {
    type: Number
  },
  approved_interest_rate: {
    type: Number
  },
  admin_notes: {
    type: String,
    maxlength: 1000
  },
  applicant_name: {
    type: String,
    required: true
  },
  applicant_phone: {
    type: String,
    required: true
  },
  applicant_email: {
    type: String
  },
  credit_score_at_application: {
    type: Number,
    min: 0,
    max: 100
  },
  monthly_savings_at_application: {
    type: Number,
    min: 0
  },
  employment_history_months: {
    type: Number,
    min: 0
  },
  documents: [{
    document_type: {
      type: String,
      enum: ['identity_proof', 'address_proof', 'income_proof', 'business_plan', 'other']
    },
    document_url: String,
    uploaded_date: {
      type: Date,
      default: Date.now
    }
  }],
  repayment_schedule: [{
    installment_number: Number,
    due_date: Date,
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending'
    },
    paid_date: Date,
    paid_amount: Number
  }],
  last_updated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

// Virtual for calculating total interest
loanSchema.virtual('total_interest').get(function() {
  const principal = this.approved_amount || this.amount;
  const rate = this.approved_interest_rate || this.interest_rate;
  const time = this.repayment_period_months / 12;
  return (principal * rate * time) / 100;
});

// Virtual for calculating total repayment amount
loanSchema.virtual('total_repayment').get(function() {
  const principal = this.approved_amount || this.amount;
  return principal + this.total_interest;
});

// Virtual for calculating monthly EMI
loanSchema.virtual('monthly_emi').get(function() {
  const principal = this.approved_amount || this.amount;
  const rate = (this.approved_interest_rate || this.interest_rate) / 100 / 12;
  const months = this.repayment_period_months;
  
  if (rate === 0) {
    return principal / months;
  }
  
  return (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
});

// Index for efficient queries
loanSchema.index({ user_id: 1, status: 1 });
loanSchema.index({ application_date: -1 });
loanSchema.index({ status: 1, approval_date: -1 });

// Pre-save middleware to update last_updated
loanSchema.pre('save', function(next) {
  this.last_updated = new Date();
  next();
});

// Static method to get loan statistics
loanSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total_amount: { $sum: '$amount' },
        avg_amount: { $avg: '$amount' }
      }
    }
  ]);
  
  const totalLoans = await this.countDocuments();
  const totalAmount = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  return {
    by_status: stats,
    total_loans: totalLoans,
    total_amount: totalAmount[0]?.total || 0
  };
};

// Instance method to generate repayment schedule
loanSchema.methods.generateRepaymentSchedule = function() {
  const schedule = [];
  const monthlyEMI = this.monthly_emi;
  const startDate = this.disbursement_date || new Date();
  
  for (let i = 1; i <= this.repayment_period_months; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    schedule.push({
      installment_number: i,
      due_date: dueDate,
      amount: Math.round(monthlyEMI * 100) / 100, // Round to 2 decimal places
      status: 'pending'
    });
  }
  
  this.repayment_schedule = schedule;
  return schedule;
};

module.exports = mongoose.model('Loan', loanSchema);