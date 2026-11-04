import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function AddToolPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    skill_id: '',
    condition: 'good',
    price_per_day: '',
    deposit: '',
    location: '',
    images: [], // Will handle image uploads later
  });
  const [skills, setSkills] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await API.get('/skills');
        setSkills(response.data);
      } catch (err) {
        console.error('Error fetching skills:', err);
      }
    };
    fetchSkills();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await API.post('/tools', formData);
      setMessage('Tool added successfully!');
      setFormData({
        name: '',
        description: '',
        skill_id: '',
        condition: 'good',
        price_per_day: '',
        deposit: '',
        location: '',
        images: [],
      });
      navigate('/tools/my'); // Navigate to my tools page
    } catch (err) {
      setError('Failed to add tool: ' + (err.response?.data?.message || err.message));
      console.error('Error adding tool:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">List Your Tool</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md max-w-lg mx-auto space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tool Name</label>
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea name="description" id="description" value={formData.description} onChange={handleChange} required rows="4" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"></textarea>
        </div>
        <div>
          <label htmlFor="skill_id" className="block text-sm font-medium text-gray-700">Skill/Category</label>
          <select name="skill_id" id="skill_id" value={formData.skill_id} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
            <option value="">Select a Skill</option>
            {skills.map((skill) => (
              <option key={skill._id} value={skill._id}>
                {skill.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-gray-700">Condition</label>
          <select name="condition" id="condition" value={formData.condition} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="used">Used</option>
          </select>
        </div>
        <div>
          <label htmlFor="price_per_day" className="block text-sm font-medium text-gray-700">Price Per Day (₹)</label>
          <input type="number" name="price_per_day" id="price_per_day" value={formData.price_per_day} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label htmlFor="deposit" className="block text-sm font-medium text-gray-700">Deposit (₹)</label>
          <input type="number" name="deposit" id="deposit" value={formData.deposit} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
          <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
        {/* Image upload input will go here */}
        <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300">
          {loading ? 'Adding...' : 'Add Tool'}
        </button>
        {message && <p className="text-green-500 text-center mt-4">{message}</p>}
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </form>
    </div>
  );
}
