const employerService = require('../services/employerService');

exports.createEmployerProfile = async (req, res) => {
  const { company_name, company_type, gstin_number, investor_history } = req.body;
  try {
    const employer = await employerService.createEmployerProfile(
      req.user._id,
      company_name,
      company_type,
      gstin_number,
      investor_history
    );
    res.status(201).json(employer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getEmployerProfile = async (req, res) => {
  try {
    const employer = await employerService.getEmployerProfileByUserId(req.user._id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer profile not found' });
    }
    res.json(employer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEmployerProfile = async (req, res) => {
  const updates = req.body;
  try {
    const employer = await employerService.updateEmployerProfile(req.user._id, updates);
    if (!employer) {
      return res.status(404).json({ message: 'Employer profile not found' });
    }
    res.json(employer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// This would typically be an admin-only route or part of an automated system
exports.verifyEmployerGSTIN = async (req, res) => {
  const { gstin_number } = req.body;
  try {
    const employer = await employerService.verifyEmployer(gstin_number);
    if (!employer) {
      return res.status(404).json({ message: 'Employer with this GSTIN not found' });
    }
    res.json({ message: 'Employer verified successfully', employer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEmployerByUserId = async (req, res) => {
  try {
    const employer = await employerService.getEmployerProfileByUserId(req.params.userId);
    if (!employer) {
      return res.status(404).json({ message: 'Employer profile not found for this user ID' });
    }
    res.status(200).json(employer);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employer profile', error: error.message });
  }
};