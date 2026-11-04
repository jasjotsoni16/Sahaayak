const fdService = require('../services/fdService');

exports.getFDInterestRate = async (req, res) => {
  const { bankName, years, isSeniorCitizen } = req.query;

  if (!bankName || !years) {
    return res.status(400).json({ message: 'Bank name and years are required.' });
  }

  const totalDays = parseInt(years) * 365; // Convert years to days for more granular tenure matching
  const senior = isSeniorCitizen === 'true';

  try {
    const interestRate = await fdService.getInterestRate(bankName, totalDays, senior);
    if (interestRate !== null) {
      res.json({ interestRate });
    } else {
      res.status(404).json({ message: 'Interest rate not found for the given bank and years.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getBankList = async (req, res) => {
  try {
    const banks = await fdService.getBankList();
    res.json(banks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};