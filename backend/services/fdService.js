const FDInterestRate = require('../Model/FDInterestRate');

exports.getInterestRate = async (bankName, totalDays, isSeniorCitizen) => {
  const rateEntry = await FDInterestRate.findOne({
    bankName: new RegExp(bankName, 'i'), // Case-insensitive search
    minDays: { $lte: totalDays },
    maxDays: { $gte: totalDays },
  });

  if (rateEntry) {
    return isSeniorCitizen ? rateEntry.seniorRate : rateEntry.generalRate;
  } else {
    return null;
  }
};

exports.getBankList = async () => {
  const banks = await FDInterestRate.distinct('bankName');
  return banks.sort();
};