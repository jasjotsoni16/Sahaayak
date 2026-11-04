import React, { useState, useEffect } from 'react';
import API from '../api';

export default function InvestorProfileSetup() {
  const [formData, setFormData] = useState({
    investment_categories: [],
    preferred_equity_range: '',
    available_funds: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem('userId');

  const INVESTMENT_CATEGORIES = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Real Estate', 'Retail', 'Food & Beverage', 'Manufacturing', ''
  ];
  const EQUITY_RANGES = [
    '0-5%', '5-10%', '10-20%', '20-30%', '30-50%', '50-100%', ''
  ];

  useEffect(() => {
    if (userId) {
      const fetchProfile = async () => {
        try {
          const response = await API.get(`/investors/profile/${userId}`);
          if (response.data) {
            setFormData({
              investment_categories: response.data.investment_categories || [],
              preferred_equity_range: response.data.preferred_equity_range || '',
              available_funds: response.data.available_funds || '',
            });
          }
        } catch (err) {
          console.error('Error fetching investor profile:', err);
          // If profile not found, it's a new investor, form remains empty
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [userId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prevData) => ({
        ...prevData,
        investment_categories: checked
          ? [...prevData.investment_categories, value]
          : prevData.investment_categories.filter((category) => category !== value),
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!userId) {
      setError('User not logged in. Please log in to set up your profile.');
      setLoading(false);
      return;
    }

    try {
      const payload = { ...formData, user_id: userId };
      // Check if profile exists to decide between POST (create) or PUT (update)
      const existingProfile = await API.get(`/investors/profile/${userId}`).catch(() => null);
      if (existingProfile && existingProfile.data) {
        await API.put(`/investors/profile/${userId}`, payload);
        setMessage('Investor profile updated successfully!');
      } else {
        await API.post('/investors/profile', payload);
        setMessage('Investor profile created successfully!');
      }
    } catch (err) {
      setError('Failed to save profile: ' + (err.response?.data?.message || err.message));
      console.error('Error saving investor profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Investor Profile Setup</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md max-w-lg mx-auto space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Investment Categories</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {INVESTMENT_CATEGORIES.map((category) => (
              <label key={category} className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="investment_categories"
                  value={category}
                  checked={formData.investment_categories.includes(category)}
                  onChange={handleChange}
                  className="form-checkbox"
                />
                <span className="ml-2 text-gray-700">{category}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="preferred_equity_range" className="block text-sm font-medium text-gray-700">Preferred Equity Range</label>
          <select name="preferred_equity_range" id="preferred_equity_range" value={formData.preferred_equity_range} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
            {EQUITY_RANGES.map((range) => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="available_funds" className="block text-sm font-medium text-gray-700">Available Funds (₹)</label>
          <input type="number" name="available_funds" id="available_funds" value={formData.available_funds} onChange={handleChange} min="0" step="0.01" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300">
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
        {message && <p className="text-green-500 text-center mt-4">{message}</p>}
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </form>
    </div>
  );
}
