const Employer = require('../Model/Employer');

exports.createEmployerProfile = async (userId, companyName, companyType, gstinNumber, investorHistory) => {
  const employer = new Employer({
    user_id: userId,
    company_name: companyName,
    company_type: companyType,
    gstin_number: gstinNumber,
    investor_history: investorHistory,
  });
  await employer.save();
  return employer;
};

exports.getEmployerProfileByUserId = async (userId) => {
  return await Employer.findOne({ user_id: userId });
};

exports.updateEmployerProfile = async (userId, updates) => {
  return await Employer.findOneAndUpdate({ user_id: userId }, updates, { new: true });
};

exports.verifyEmployer = async (gstinNumber) => {
  const employer = await Employer.findOne({ gstin_number: gstinNumber });
  if (employer) {
    employer.is_verified = true;
    await employer.save();
    return employer;
  }
  return null;
};