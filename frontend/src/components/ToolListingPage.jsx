import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

export default function ToolListingPage() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await API.get('/tools');
        setTools(response.data);
      } catch (err) {
        setError('Failed to fetch tools.');
        console.error('Error fetching tools:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTools();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading tools...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Available Tools</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <div key={tool._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {tool.images && tool.images.length > 0 && (
              <img src={tool.images[0]} alt={tool.name} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{tool.name}</h2>
              <p className="text-gray-600 text-sm mb-2">{tool.skill_id.name} - {tool.condition}</p>
              <p className="text-gray-800 font-bold mb-2">₹{tool.price_per_day} / day</p>
              <p className="text-gray-700 text-sm mb-4">Location: {tool.location}</p>
              <Link to={`/tool/${tool._id}`} className="block w-full bg-blue-500 text-white text-center py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
      {tools.length === 0 && (
        <p className="text-center text-gray-500 mt-8">No tools available for rent yet.</p>
      )}
    </div>
  );
}
