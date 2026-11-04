import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import API from '../api'; // Import the API utility

export default function InvestmentAnalyzer() {
  const location = useLocation();
  const stateGoal = location.state?.monthly_savings_goal;
  // The goal normally arrives via navigation state; if the page is opened directly, read it from the profile.
  const [monthly_savings_goal, setMonthlySavingsGoal] = useState(stateGoal ?? 0);

  const [investmentAmount, setInvestmentAmount] = useState(stateGoal ?? 0);

  useEffect(() => {
    if (stateGoal !== undefined) return;
    API.get('/users/profile')
      .then((res) => {
        const goal = res.data.monthlySavings || 0;
        setMonthlySavingsGoal(goal);
        setInvestmentAmount(goal);
      })
      .catch(() => {});
  }, [stateGoal]);
  const [investmentYears, setInvestmentYears] = useState(1);
  const [bankName, setBankName] = useState('');
  const [isSeniorCitizen, setIsSeniorCitizen] = useState(false); // New state for senior citizen
  const [annualInterestRate, setAnnualInterestRate] = useState(0);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [banks, setBanks] = useState([]); // New state for bank list

  // Fetch bank list on component mount
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await API.get('/fd/banks');
        setBanks(res.data);
        if (res.data.length > 0) {
          setBankName(res.data[0]); // Set first bank as default
        }
      } catch (err) {
        console.error('Error fetching bank list:', err);
        setError('Failed to load bank list.');
      }
    };
    fetchBanks();
  }, []);

  useEffect(() => {
    const fetchInterestRateAndCalculate = async () => {
      if (bankName && investmentYears > 0) {
        setLoading(true);
        setError('');
        try {
          const res = await API.get(`/fd/interest-rate?bankName=${bankName}&years=${investmentYears}&isSeniorCitizen=${isSeniorCitizen}`);
          setAnnualInterestRate(res.data.interestRate);
          const rate = res.data.interestRate / 100;
          // Monthly compounding formula for future value of a series of payments (annuity future value)
          // FV = P * [((1 + r/n)^(nt) - 1) / (r/n)]
          // Where P = monthly_savings_goal, r = annual interest rate, n = number of times interest is compounded per year (12 for monthly), t = number of years
          const futureValue = investmentAmount * ((Math.pow((1 + rate / 12), (investmentYears * 12)) - 1) / (rate / 12));
          setCalculatedAmount(futureValue.toFixed(2));
        } catch (err) {
          console.error('Error fetching interest rate:', err);
          setError(err.response?.data?.message || 'Failed to fetch interest rate. Please check bank name and years.');
          setAnnualInterestRate(0);
          setCalculatedAmount(0);
        } finally {
          setLoading(false);
        }
      } else {
        setAnnualInterestRate(0);
        setCalculatedAmount(0);
      }
    };

    fetchInterestRateAndCalculate();
  }, [investmentAmount, investmentYears, bankName, isSeniorCitizen]); // Recalculate when these change

  return (
    <div className="min-h-screen bg-background text-gray-800">
      <div className="max-w-xl mx-auto py-8 px-4">
        <motion.div className="bg-green-100 rounded-2xl shadow-xl p-8 mb-6" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-2xl font-bold mb-4">Investment Analyzer</div>
          <p className="mb-4">Your current monthly savings goal: ₹{monthly_savings_goal}</p>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bankName">
              Select Bank
            </label>
            <select
              id="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              {banks.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="investmentAmount">
              Monthly Investment Amount
            </label>
            <input
              type="number"
              id="investmentAmount"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(Number(e.target.value))}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="investmentYears">
              Investment Years
            </label>
            <input
              type="number"
              id="investmentYears"
              value={investmentYears}
              onChange={(e) => setInvestmentYears(Number(e.target.value))}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="isSeniorCitizen"
              checked={isSeniorCitizen}
              onChange={(e) => setIsSeniorCitizen(e.target.checked)}
              className="mr-2 leading-tight"
            />
            <label className="text-gray-700 text-sm font-bold" htmlFor="isSeniorCitizen">
              Senior Citizen
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="annualInterestRate">
              Annual Interest Rate (%)
            </label>
            <input
              type="number"
              id="annualInterestRate"
              value={annualInterestRate}
              readOnly // Make it read-only as it's fetched from API
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200"
            />
          </div>

          {loading && <p className="text-center text-blue-500">Fetching interest rate...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}

          <div className="mt-6 p-4 bg-green-200 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Projected Future Value:</h3>
            <p className="text-3xl font-bold text-green-700">₹{calculatedAmount}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
