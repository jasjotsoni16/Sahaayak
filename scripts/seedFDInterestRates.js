const mongoose = require('mongoose');
const FDInterestRate = require('../Model/FDInterestRate');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const seedFDInterestRates = async () => {
  await connectDB();

  try {
    await FDInterestRate.deleteMany({});
    console.log('Existing FD interest rates cleared.');

    const rates = [
      // State Bank of India (SBI)
      { bankName: 'State Bank of India', tenureDescription: '7–45 days', minDays: 7, maxDays: 45, generalRate: 3.05, seniorRate: 3.55 },
      { bankName: 'State Bank of India', tenureDescription: '180–210 days', minDays: 180, maxDays: 210, generalRate: 5.65, seniorRate: 6.15 },
      { bankName: 'State Bank of India', tenureDescription: '1–2 yrs', minDays: 365, maxDays: 730, generalRate: 6.25, seniorRate: 6.75 },
      { bankName: 'State Bank of India', tenureDescription: '5–10 yrs', minDays: 1825, maxDays: 3650, generalRate: 6.05, seniorRate: 7.05 },

      // Indian Bank
      { bankName: 'Indian Bank', tenureDescription: '444 days', minDays: 444, maxDays: 444, generalRate: 6.90, seniorRate: 6.90 }, // Assuming general rate for special scheme
      { bankName: 'Indian Bank', tenureDescription: '555 days', minDays: 555, maxDays: 555, generalRate: 6.80, seniorRate: 6.80 }, // Assuming general rate for special scheme
      // For general rates, we need to infer ranges or add more specific entries if available
      { bankName: 'Indian Bank', tenureDescription: 'General (example)', minDays: 365, maxDays: 730, generalRate: 6.00, seniorRate: 6.50 }, // Example for general range

      // HDFC Bank
      { bankName: 'HDFC Bank', tenureDescription: '6 months to 10 years', minDays: 180, maxDays: 3650, generalRate: 5.90, seniorRate: 6.40 }, // Using lower end of general and senior
      // More specific HDFC rates would need more detailed data

      // ICICI Bank
      { bankName: 'ICICI Bank', tenureDescription: 'General (example)', minDays: 365, maxDays: 1825, generalRate: 6.60, seniorRate: 7.10 }, // Example for general range

      // Axis Bank
      { bankName: 'Axis Bank', tenureDescription: '1 yr – 1 yr 10 days', minDays: 365, maxDays: 375, generalRate: 6.25, seniorRate: 6.75 },
      { bankName: 'Axis Bank', tenureDescription: '18 months – 2 years', minDays: 547, maxDays: 730, generalRate: 6.60, seniorRate: 7.10 },

      // DCB Bank
      { bankName: 'DCB Bank', tenureDescription: '46–89 days', minDays: 46, maxDays: 89, generalRate: 5.50, seniorRate: 5.50 }, // Assuming same for senior if not specified

      // AU Small Finance Bank
      { bankName: 'AU Small Finance Bank', tenureDescription: '7 days – 10 years', minDays: 7, maxDays: 3650, generalRate: 7.10, seniorRate: 7.60 }, // Using max general and adding 0.50 for senior

      // Ujjivan Small Finance Bank
      { bankName: 'Ujjivan Small Finance Bank', tenureDescription: 'General (example)', minDays: 365, maxDays: 1825, generalRate: 7.60, seniorRate: 8.10 }, // Using max general and adding 0.50 for senior

      // Jana Small Finance Bank
      { bankName: 'Jana Small Finance Bank', tenureDescription: '3-year FD', minDays: 1095, maxDays: 1095, generalRate: 7.75, seniorRate: 8.25 }, // Inferring general rate

      // Utkarsh Small Finance Bank
      { bankName: 'Utkarsh Small Finance Bank', tenureDescription: '3-year FD', minDays: 1095, maxDays: 1095, generalRate: 8.00, seniorRate: 8.50 }, // Inferring general rate

      // Slice Small Finance Bank
      { bankName: 'Slice Small Finance Bank', tenureDescription: '3-year FD', minDays: 1095, maxDays: 1095, generalRate: 7.75, seniorRate: 8.25 }, // Inferring general rate

      // Suryoday Small Finance Bank
      { bankName: 'Suryoday Small Finance Bank', tenureDescription: '3-year FD', minDays: 1095, maxDays: 1095, generalRate: 7.65, seniorRate: 8.15 }, // Inferring general rate

      // Equitas Small Finance Bank
      { bankName: 'Equitas Small Finance Bank', tenureDescription: '888-day FD', minDays: 888, maxDays: 888, generalRate: 7.60, seniorRate: 8.20 },
    ];

    await FDInterestRate.insertMany(rates);
    console.log('FD interest rates seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding FD interest rates:', error);
    process.exit(1);
  }
};

seedFDInterestRates();