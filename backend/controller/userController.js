const userService = require('../services/userService');
const User = require('../Model/User');
const UserRating = require('../Model/UserRating');
const Seeker = require('../Model/Seeker');
const Employer = require('../Model/Employer');
const employerService = require('../services/employerService');
const jwt = require('jsonwebtoken');
const { resolveLocation } = require('../services/geocoding');
const creditScoreService = require('../services/creditScoreService');

// Remove everything signup may have created for a user whose signup failed part-way.
const rollbackSignup = async (userId) => {
  const CreditScore = require('../Model/creditScore');
  await Promise.all([
    Seeker.deleteMany({ user_id: userId }),
    Employer.deleteMany({ user_id: userId }),
    CreditScore.deleteMany({ user_id: userId }),
  ]);
  await User.deleteOne({ _id: userId });
};

exports.signup = async (req, res, next) => {
  let user;
  try {
    const { latitude, longitude, ...userData } = req.body; // already validated and stripped by signupSchema
    // Fill in whichever of city / coordinates is missing (never blocks signup if the geocoder is down)
    const { city, location } = await resolveLocation({ city: userData.city, location: userData.location, latitude, longitude });
    if (city) userData.city = city;
    if (location) userData.location = location;
    user = await userService.createUser(userData);
    // Handle role-specific setup
    if (user.role === 'seeker') {
      // Create seeker profile
      await Seeker.create({ user_id: user._id });
      
      // Calculate and save initial credit score
      try {
        await creditScoreService.updateCreditScore(user._id);
        console.log(`✅ Initial credit score created for seeker: ${user._id}`);
      } catch (creditError) {
        console.error(`❌ Error creating initial credit score for seeker ${user._id}:`, creditError.message);
        // Don't fail signup if credit score creation fails
      }
    } else if (user.role === 'provider') {
      // Assuming req.body contains necessary employer details like company_name, company_type, gstin_number
      await employerService.createEmployerProfile(user._id, req.body.company_name, req.body.company_type, req.body.gstin_number, req.body.investor_history);
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    if (user) await rollbackSignup(user._id); // do not leave a half-created account behind
    next(err); // errorHandler maps duplicate key -> 409, validation -> 400
  }
};

const { generateLoanSuggestion } = require('../services/loanSuggestionService');


exports.login = async (req, res) => {
  
  const { phone_number, password } = req.body;
  const user = await userService.findByPhone(phone_number);
  const valid = user && await userService.comparePassword(user, password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' }); // same answer for unknown phone and wrong password
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  console.log(`User ${user._id} logged in. Generating loan suggestion...`);
  

  // Generate loan suggestion after successful login
  if (user.role === 'seeker') {
    try {
      await generateLoanSuggestion(user._id);
      console.log(`Loan suggestion process completed for user ${user._id}.`);
      
    } catch (error) {
      console.error(`Error generating loan suggestion for user ${user._id}:`, error.message);
      
    }
  }

  res.json({ user, token });
};

exports.getProfile = async (req, res) => {
  const user = await userService.findById(req.user._id)
    .populate({
      path: 'experiences',
      populate: {
        path: 'job_id',
        select: 'employer_id title', // Select employer_id and title from Job model
        populate: {
          path: 'employer_id', // Populate the actual employer user object
          select: 'name email', // Select name and email from User model
          populate: {
            path: 'employer_profile',
            model: 'Employer',
            select: 'company_name company',
          },
        },
      },
    });
  console.log('User object after experience population:', user);

  let ratings = [];
  if (user.role === 'seeker') {
    ratings = await UserRating.find({ seeker_id: user._id });
  } else if (user.role === 'provider') {
    ratings = await UserRating.find({ employer_id: user._id });
  }

  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b.rating, 0) / ratings.length) : null;
  const reviewCount = ratings.length;

  res.json({ ...user.toObject(), avgRating, reviewCount, false_accusation_count: user.false_accusation_count, abuse_true_count: user.abuse_true_count });
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password;
    delete updates.phone_number;
    delete updates.role;

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user language preference
exports.updateLanguage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { language } = req.body;

    // Validate language code
    const validLanguages = ['en', 'hi', 'pa', 'mr', 'ta', 'te', 'ml', 'kn', 'bn', 'gu'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ message: 'Invalid language code' });
    }

    const user = await User.findByIdAndUpdate(
      userId, 
      { language }, 
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Language preference updated successfully', 
      language: user.language 
    });
  } catch (error) {
    console.error('Update language error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user (for authentication check)
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.changeLanguage = async (req, res) => {
  const user = await userService.updateUser(req.user._id, { language: req.body.language });
  res.json(user);
};

exports.updateNotificationSettings = async (req, res) => {
  const user = await userService.updateUser(req.user._id, { notification_settings: req.body });
  res.json(user);
};

// Visible only to the user themselves and admins. Phone number and profile basics stay visible so
// employers and seekers can still see who they are dealing with.
const PRIVATE_USER_FIELDS = ['pan', 'address', 'email', 'income_history', 'monthlySavings', 'notification_settings'];

exports.getUserById = async (req, res) => {
  try {
    const user = await userService.findById(req.params.id).populate('experiences');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const json = user.toJSON();
    const viewerIsOwner = String(req.user._id) === String(user._id) || req.user.role === 'admin';
    if (!viewerIsOwner) for (const f of PRIVATE_USER_FIELDS) delete json[f];
    res.status(200).json(json);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

exports.updateSavingsGoal = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { monthlySavings: req.body.monthly_savings_goal }, { new: true });
  res.json({ monthly_savings_goal: user.monthlySavings });
};

exports.getAllSeekers = async (req, res) => {
  try {
    const seekers = await userService.findAll({ role: 'seeker' });
    res.json(seekers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching seekers', error: error.message });
  }
};