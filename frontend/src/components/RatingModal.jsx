import React, { useState } from 'react';
import { submitRating } from '../api';

const RatingModal = ({ isOpen, onClose, giver_user_id, receiver_user_id, job_id, role_of_giver, onRatingSubmitted }) => {
  const [rating, setRating] = useState(1);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      console.log('🎯 Submitting rating with payload:', {
        giver_user_id,
        receiver_user_id,
        job_id,
        rating,
        comments,
        role_of_giver
      });

      const response = await submitRating({
        giver_user_id,
        receiver_user_id,
        job_id,
        rating,
        comments,
        role_of_giver
      });

      if (response.status === 200 || response.status === 201) {
        console.log('✅ Rating submitted successfully');
        onRatingSubmitted();
        onClose();
        
        // Reset form
        setRating(1);
        setComments('');
      } else {
        throw new Error(response.data.message || 'Failed to submit rating. Please try again.');
      }
    } catch (err) {
      console.error('❌ Error submitting rating:', err);
      console.error('Full error object:', JSON.stringify(err, null, 2)); // Log the full error object
      setError(
        err.response?.data?.message || 
        'Failed to submit rating. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">Rate Employee</h2>
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
            <strong>Debug Info:</strong><br/>
            Giver: {giver_user_id}<br/>
            Receiver: {receiver_user_id}<br/>
            Job: {job_id}<br/>
            Role: {role_of_giver}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="rating" className="block text-gray-700 text-sm font-bold mb-2">
              Rating (1-5):
            </label>
            <select
              id="rating"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value={1}>1 - Poor</option>
              <option value={2}>2 - Fair</option>
              <option value={3}>3 - Good</option>
              <option value={4}>4 - Very Good</option>
              <option value={5}>5 - Excellent</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="comments" className="block text-gray-700 text-sm font-bold mb-2">
              Comments (Optional):
            </label>
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows="4"
              placeholder="Share your experience working with this person..."
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              maxLength={1000}
            ></textarea>
            <div className="text-xs text-gray-500 mt-1">
              {comments.length}/1000 characters
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              disabled={submitting || !giver_user_id || !receiver_user_id || !job_id || !role_of_giver}
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;