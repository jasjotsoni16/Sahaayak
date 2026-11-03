const mongoose = require('mongoose');

// A salary agreement is a RECORD of what an employer pays an employee and when it was paid.
// No money moves through Sahayak: the employer records a payment, the employee confirms it,
// and only confirmed payments count towards the employee's credit score.

const FREQUENCIES = ['daily', 'weekly', 'monthly'];

const addPeriod = (date, frequency) => {
  const next = new Date(date);
  if (frequency === 'daily') next.setDate(next.getDate() + 1);
  else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);
  return next;
};

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0.01 },
  paid_on: { type: Date, default: Date.now },
  note: { type: String, maxlength: 200 },
  status: { type: String, enum: ['recorded', 'confirmed', 'disputed'], default: 'recorded' },
  confirmed_at: { type: Date },
  dispute_reason: { type: String, maxlength: 300 },
}, { timestamps: true });

const salaryAgreementSchema = new mongoose.Schema({
  employer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  amount: { type: Number, required: true, min: 1, max: 10000000 },
  frequency: { type: String, enum: FREQUENCIES, required: true },
  description: { type: String, maxlength: 200 },
  status: { type: String, enum: ['active', 'paused', 'ended'], default: 'active' },
  start_date: { type: Date, default: Date.now },
  next_due_date: { type: Date },
  payments: [paymentSchema],
}, { timestamps: true });

salaryAgreementSchema.pre('validate', function setFirstDueDate(next) {
  if (!this.next_due_date) this.next_due_date = addPeriod(this.start_date || new Date(), this.frequency);
  next();
});

// What this agreement is worth per month, used for credit score and recommendations.
salaryAgreementSchema.methods.monthlyAmount = function monthlyAmount() {
  if (this.frequency === 'daily') return this.amount * 30;
  if (this.frequency === 'weekly') return this.amount * 4;
  return this.amount;
};

salaryAgreementSchema.methods.advanceSchedule = function advanceSchedule() {
  this.next_due_date = addPeriod(this.next_due_date || new Date(), this.frequency);
};

// Active agreements with at least one confirmed payment: the only ones that count as verified income.
salaryAgreementSchema.statics.verifiedForEmployee = function verifiedForEmployee(userId) {
  return this.find({ employee_id: userId, status: 'active', 'payments.status': 'confirmed' });
};

salaryAgreementSchema.statics.FREQUENCIES = FREQUENCIES;

module.exports = mongoose.model('SalaryAgreement', salaryAgreementSchema);
