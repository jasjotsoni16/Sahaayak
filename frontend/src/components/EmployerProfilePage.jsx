import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { notify } from '../ui/toastBus';

export default function EmployerProfilePage() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('individual');
  const [gstinNumber, setGstinNumber] = useState('');
  const [investorHistory, setInvestorHistory] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchEmployerProfile = async () => {
      setLoading(true);
      try {
        const res = await API.get('/employer');
        const profile = res.data;
        setCompanyName(profile.company_name);
        setCompanyType(profile.company_type);
        setGstinNumber(profile.gstin_number);
        setInvestorHistory(profile.investor_history);
        setIsVerified(profile.is_verified);
        setIsEditing(true); // Profile exists, so we are in editing mode
      } catch (err) {
        if (err.response && err.response.status === 404) {
          // Profile not found, user needs to create one
          setIsEditing(false);
        } else {
          setError('Failed to load employer profile.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchEmployerProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEditing) {
        await API.put('/employer', {
          company_name: companyName,
          company_type: companyType,
          gstin_number: gstinNumber,
          investor_history: investorHistory,
        });
        notify.auto('Employer profile updated successfully!');
      } else {
        await API.post('/employer', {
          company_name: companyName,
          company_type: companyType,
          gstin_number: gstinNumber,
          investor_history: investorHistory,
        });
        notify.auto('Employer profile created successfully!');
        setIsEditing(true); // Switch to editing mode after creation
      }
      // Optionally navigate to dashboard or refresh data
      // navigate('/employer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-gray-800">
      <div className="max-w-xl mx-auto py-8 px-4">
        <motion.div className="bg-white rounded-2xl shadow-xl p-8 mb-6" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold mb-4">{isEditing ? 'Edit Employer Profile' : 'Create Employer Profile'}</h2>
          
          {isEditing && (
            <div className="mb-4">
              <p className="text-lg font-semibold">Verification Status: 
                {isVerified ? (
                  <span className="text-green-600">✅ Verified Employer</span>
                ) : (
                  <span className="text-red-600">❌ Not Verified</span>
                )}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="companyName">
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="companyType">
                Company Type
              </label>
              <select
                id="companyType"
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="individual">Individual</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
                <option value="startup">Startup</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gstinNumber">
                GSTIN Number
              </label>
              <input
                type="text"
                id="gstinNumber"
                value={gstinNumber}
                onChange={(e) => setGstinNumber(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="investorHistory">
                Investor History (Optional)
              </label>
              <textarea
                id="investorHistory"
                value={investorHistory}
                onChange={(e) => setInvestorHistory(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
              ></textarea>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button
              type="submit"
              className="w-full py-2 px-4 bg-primary hover:bg-blue-600 text-white font-semibold rounded-lg shadow transition"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Profile' : 'Create Profile')}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}