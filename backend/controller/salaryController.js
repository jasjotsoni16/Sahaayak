const SalaryAgreement = require('../Model/SalaryAgreement');
const User = require('../Model/User');
const Job = require('../Model/Job');
const UserExperience = require('../Model/UserExperience');

const fail = (status, error) => Object.assign(new Error(error), { status });

// An employer may only create agreements for people who have actually worked for them.
const hasWorkedFor = async (employerId, seekerId) => {
  const jobIds = await Job.find({ employer_id: employerId }).distinct('_id');
  return !!(await UserExperience.exists({ seeker_id: seekerId, job_id: { $in: jobIds } }));
};

exports.createAgreement = async (req, res) => {
  const { employee_id, amount, frequency, description, job_id } = req.body;
  const employee = await User.findById(employee_id);
  if (!employee || employee.role !== 'seeker') throw fail(400, 'employee_id must belong to a job seeker');
  if (!(await hasWorkedFor(req.user._id, employee._id))) {
    throw fail(403, 'You can only create salary agreements for people who have worked for you');
  }
  const agreement = await SalaryAgreement.create({ employer_id: req.user._id, employee_id, amount, frequency, description, job_id });
  res.status(201).json({ agreement });
};

exports.listForEmployer = async (req, res) => {
  const agreements = await SalaryAgreement.find({ employer_id: req.user._id }).sort({ createdAt: -1 }).populate('employee_id', 'name phone_number');
  res.json({ agreements });
};

exports.listForEmployee = async (req, res) => {
  const agreements = await SalaryAgreement.find({ employee_id: req.user._id }).sort({ createdAt: -1 }).populate('employer_id', 'name phone_number');
  res.json({ agreements });
};

exports.getAgreement = (req, res) => res.json({ agreement: req.doc });

exports.updateStatus = async (req, res) => {
  req.doc.status = req.body.status;
  await req.doc.save();
  res.json({ agreement: req.doc });
};

exports.recordPayment = async (req, res) => {
  const agreement = req.doc;
  if (agreement.status !== 'active') throw fail(400, `Cannot record a payment on a ${agreement.status} agreement`);
  agreement.payments.push({ amount: req.body.amount ?? agreement.amount, paid_on: req.body.paid_on, note: req.body.note });
  agreement.advanceSchedule();
  await agreement.save();
  res.status(201).json({ agreement, payment: agreement.payments[agreement.payments.length - 1] });
};

const findPayment = (agreement, paymentId) => {
  const payment = agreement.payments.id(paymentId);
  if (!payment) throw fail(404, 'Payment not found');
  return payment;
};

exports.confirmPayment = async (req, res) => {
  const payment = findPayment(req.doc, req.params.paymentId);
  if (payment.status === 'disputed') throw fail(400, 'A disputed payment cannot be confirmed');
  if (payment.status !== 'confirmed') {
    payment.status = 'confirmed';
    payment.confirmed_at = new Date();
    await req.doc.save();
  }
  res.json({ payment });
};

exports.disputePayment = async (req, res) => {
  const payment = findPayment(req.doc, req.params.paymentId);
  if (payment.status === 'confirmed') throw fail(400, 'A confirmed payment cannot be disputed');
  payment.status = 'disputed';
  payment.dispute_reason = req.body.reason;
  await req.doc.save();
  res.json({ payment });
};
