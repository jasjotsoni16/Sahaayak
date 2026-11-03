const mongoose = require('mongoose');
const UserRating = require('../Model/UserRating');
const User = require('../Model/User');
const Job = require('../Model/Job');

exports.createOrUpdateRating = async (req, res) => {
  try {
    const { giver_user_id, receiver_user_id, rating, comments, job_id, role_of_giver } = req.body;
    
    // Detailed validation with specific error messages
    const missingFields = [];
    if (!giver_user_id) missingFields.push('giver_user_id');
    if (!receiver_user_id) missingFields.push('receiver_user_id');
    if (!rating) missingFields.push('rating');
    if (!job_id) missingFields.push('job_id');
    if (!role_of_giver) missingFields.push('role_of_giver');

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Missing required rating fields.',
        missingFields: missingFields,
        requiredFields: ['giver_user_id', 'receiver_user_id', 'rating', 'job_id', 'role_of_giver'],
        example: {
          giver_user_id: 'user_id_of_person_giving_rating',
          receiver_user_id: 'user_id_of_person_receiving_rating',
          rating: 5,
          comments: 'Great work!',
          job_id: 'job_id_for_this_rating',
          role_of_giver: 'seeker' // or 'provider'
        }
      });
    }

    // Validate rating value
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: 'Rating must be a number between 1 and 5.',
        providedRating: rating
      });
    }

    // Validate role_of_giver
    if (!['seeker', 'provider'].includes(role_of_giver)) {
      return res.status(400).json({ 
        message: 'role_of_giver must be either "seeker" or "provider".',
        providedRole: role_of_giver
      });
    }

    // Verify that the giver is the authenticated user
    if (giver_user_id !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'You can only submit ratings as yourself.',
        authenticatedUser: req.user._id,
        providedGiver: giver_user_id
      });
    }

    // Verify that giver and receiver are different
    if (giver_user_id === receiver_user_id) {
      return res.status(400).json({ 
        message: 'You cannot rate yourself.',
      });
    }

    // Verify users exist
    const [giverUser, receiverUser, job] = await Promise.all([
      User.findById(giver_user_id),
      User.findById(receiver_user_id),
      Job.findById(job_id)
    ]);

    if (!giverUser) {
      return res.status(404).json({ message: 'Giver user not found.' });
    }

    if (!receiverUser) {
      return res.status(404).json({ message: 'Receiver user not found.' });
    }

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    // Verify role consistency
    if (giverUser.role !== role_of_giver) {
      return res.status(400).json({ 
        message: 'role_of_giver does not match the actual user role.',
        actualRole: giverUser.role,
        providedRole: role_of_giver
      });
    }

    // Determine receiver role
    const role_of_receiver = receiverUser.role;

    // Check if rating already exists
    let userRating = await UserRating.findOne({
      giver_user_id,
      receiver_user_id,
      job_id,
    });

    if (userRating) {
      // Check if already updated once (comparing timestamps)
      if (userRating.updated_at && userRating.updated_at.getTime() !== userRating.created_at.getTime()) {
        return res.status(403).json({ 
          message: 'Rating can only be edited once.',
          existingRating: {
            rating: userRating.rating,
            comments: userRating.comments,
            created_at: userRating.created_at,
            updated_at: userRating.updated_at
          }
        });
      }

      // Update existing rating
      userRating.rating = rating;
      userRating.comments = comments || userRating.comments;
      userRating.updated_at = new Date();
      await userRating.save();

      res.status(200).json({ 
        message: 'Rating updated successfully.', 
        userRating: {
          id: userRating._id,
          giver_user_id: userRating.giver_user_id,
          receiver_user_id: userRating.receiver_user_id,
          job_id: userRating.job_id,
          rating: userRating.rating,
          comments: userRating.comments,
          role_of_giver: userRating.role_of_giver,
          role_of_receiver: userRating.role_of_receiver,
          created_at: userRating.created_at,
          updated_at: userRating.updated_at
        }
      });
    } else {
      // Create new rating
      const newRating = new UserRating({
        giver_user_id,
        receiver_user_id,
        rating,
        comments: comments || '',
        job_id,
        role_of_giver,
        role_of_receiver,
      });

      userRating = await newRating.save();

      res.status(201).json({ 
        message: 'Rating created successfully.', 
        userRating: {
          id: userRating._id,
          giver_user_id: userRating.giver_user_id,
          receiver_user_id: userRating.receiver_user_id,
          job_id: userRating.job_id,
          rating: userRating.rating,
          comments: userRating.comments,
          role_of_giver: userRating.role_of_giver,
          role_of_receiver: userRating.role_of_receiver,
          created_at: userRating.created_at,
          updated_at: userRating.updated_at
        }
      });
    }
  } catch (error) {
    console.error('Error creating or updating rating:', error);
    res.status(500).json({ 
      message: 'Error creating or updating rating.', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.getRating = async (req, res) => {
  try {
    const { jobId, giverId, receiverId } = req.params;

    // Validate parameters
    if (!jobId || !giverId || !receiverId) {
      return res.status(400).json({ 
        message: 'Missing required parameters.',
        required: ['jobId', 'giverId', 'receiverId'],
        provided: { jobId, giverId, receiverId }
      });
    }

    const userRating = await UserRating.findOne({
      job_id: jobId,
      giver_user_id: giverId,
      receiver_user_id: receiverId,
    }).populate('giver_user_id', 'name phone_number')
      .populate('receiver_user_id', 'name phone_number')
      .populate('job_id', 'title');

    if (!userRating) {
      return res.status(404).json({ 
        message: 'Rating not found.',
        searchCriteria: { jobId, giverId, receiverId }
      });
    }

    res.status(200).json({
      message: 'Rating found successfully.',
      userRating
    });
  } catch (error) {
    console.error('Error fetching rating:', error);
    res.status(500).json({ 
      message: 'Error fetching rating.', 
      error: error.message 
    });
  }
};

// Get all ratings for a user (as receiver)
exports.getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const ratings = await UserRating.find({ receiver_user_id: userId })
      .populate('giver_user_id', 'name phone_number')
      .populate('job_id', 'title')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await UserRating.countDocuments({ receiver_user_id: userId });
    const averageRating = await UserRating.aggregate([
      { $match: { receiver_user_id: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      message: 'User ratings retrieved successfully.',
      ratings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRatings: total,
        perPage: parseInt(limit)
      },
      statistics: {
        averageRating: averageRating[0]?.avgRating || 0,
        totalRatings: averageRating[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    res.status(500).json({ 
      message: 'Error fetching user ratings.', 
      error: error.message 
    });
  }
};

// Get ratings given by a user
exports.getRatingsGivenByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const ratings = await UserRating.find({ giver_user_id: userId })
      .populate('receiver_user_id', 'name phone_number')
      .populate('job_id', 'title')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await UserRating.countDocuments({ giver_user_id: userId });

    res.status(200).json({
      message: 'Ratings given by user retrieved successfully.',
      ratings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRatings: total,
        perPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching ratings given by user:', error);
    res.status(500).json({ 
      message: 'Error fetching ratings given by user.', 
      error: error.message 
    });
  }
};