import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../api';

export default function ToolDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loanRequest, setLoanRequest] = useState({
    start_date: '',
    end_date: '',
  });
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const { user } = useAuth();
  const currentUserId = user?._id;
  const [existingLoan, setExistingLoan] = useState(null);

  useEffect(() => {
    const fetchToolAndLoan = async () => {
      try {
        const toolResponse = await API.get(`/tools/${id}`);
        setTool(toolResponse.data);

        if (currentUserId) {
          try {
            const loanResponse = await API.get(`/tool-loans/tool/${id}/borrower/${currentUserId}`);
            setExistingLoan(loanResponse.data);
          } catch (loanErr) {
            // It's okay if no existing loan is found
            if (loanErr.response?.status !== 404) {
              console.error('Error fetching existing loan:', loanErr);
            }
          }
        }
      } catch (err) {
        if (err.response?.status === 401) {
          // Authentication error - redirect to login
          navigate('/login');
          return;
        }
        setError('Failed to fetch tool details.');
        console.error('Error fetching tool details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchToolAndLoan();
    }
  }, [id, currentUserId, navigate]);

  const handleLoanRequestChange = (e) => {
    setLoanRequest({ ...loanRequest, [e.target.name]: e.target.value });
  };

  const handleLoanRequestSubmit = async (e) => {
    e.preventDefault();
    setRequestLoading(true);
    setRequestMessage('');
    setRequestError('');

    try {
      const response = await API.post('/tool-loans', {
        tool_id: tool._id,
        start_date: loanRequest.start_date,
        end_date: loanRequest.end_date,
        agreed_price: tool.price_per_day * ((new Date(loanRequest.end_date) - new Date(loanRequest.start_date)) / (1000 * 60 * 60 * 24) + 1), // Calculate total price
      });
      setRequestMessage('Loan request sent successfully!');
      setExistingLoan(response.data); // Update existing loan state
      // Clear the form
      setLoanRequest({ start_date: '', end_date: '' });
    } catch (err) {
      if (err.response?.status === 401) {
        // Authentication error - redirect to login
        navigate('/login');
        return;
      }
      setRequestError('Failed to send loan request: ' + (err.response?.data?.message || err.message));
      console.error('Error sending loan request:', err);
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading tool details...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500 text-center">{error}</div>;
  }

  if (!tool) {
    return <div className="container mx-auto p-4 text-center">Tool not found.</div>;
  }

  const isOwner = tool.owner_id === currentUserId;

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
        <h1 className="text-3xl font-bold mb-4">{tool.name}</h1>
        {tool.images && tool.images.length > 0 && (
          <img src={tool.images[0]} alt={tool.name} className="w-full h-64 object-cover mb-4 rounded-md" />
        )}
        <p className="text-gray-700 mb-2"><strong>Description:</strong> {tool.description}</p>
        <p className="text-gray-700 mb-2"><strong>Category:</strong> {tool.skill_id.name}</p>
        <p className="text-gray-700 mb-2"><strong>Condition:</strong> {tool.condition}</p>
        <p className="text-gray-700 mb-2"><strong>Price Per Day:</strong> ₹{tool.price_per_day}</p>
        <p className="text-gray-700 mb-2"><strong>Deposit:</strong> ₹{tool.deposit}</p>
        <p className="text-gray-700 mb-4"><strong>Location:</strong> {tool.location}</p>

        {isOwner ? (
          <p className="text-center text-gray-600 mt-6">You own this tool.</p>
        ) : (
          existingLoan ? (
            <div className="mt-6 p-4 border rounded-lg shadow-sm bg-blue-50">
              <h2 className="text-2xl font-bold mb-4 text-blue-800">Your Loan Request</h2>
              <p><strong>Status:</strong> {existingLoan.status}</p>
              <p><strong>Requested Dates:</strong> {new Date(existingLoan.start_date).toLocaleDateString()} - {new Date(existingLoan.end_date).toLocaleDateString()}</p>
              <p><strong>Agreed Price:</strong> ₹{existingLoan.agreed_price}</p>
              {/* Add more details about the existing loan */}
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mt-6 mb-4">Request to Borrow</h2>
              <form onSubmit={handleLoanRequestSubmit} className="space-y-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input type="date" name="start_date" id="start_date" value={loanRequest.start_date} onChange={handleLoanRequestChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">End Date</label>
                  <input type="date" name="end_date" id="end_date" value={loanRequest.end_date} onChange={handleLoanRequestChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <button type="submit" disabled={requestLoading || !tool.availability} className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-300">
                  {requestLoading ? 'Sending Request...' : (tool.availability ? 'Send Loan Request' : 'Not Available')}
                </button>
                {requestMessage && <p className="text-green-500 text-center mt-4">{requestMessage}</p>}
                {requestError && <p className="text-red-500 text-center mt-4">{requestError}</p>}
              </form>
            </>
          )
        )}
      </div>
    </div>
  );
}
