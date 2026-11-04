const { requireAuth, authorizeRoles } = require('./auth');

// Compatibility names: the actual logic now lives in ./auth.js
const authenticateToken = requireAuth;                // bad/missing token is now 401 (was 403)
const requireEmployer = authorizeRoles('provider');
const requireSeeker = authorizeRoles('seeker');

// Middleware to check if user owns the resource (for employers)
const requireResourceOwnership = (paramName = 'employerId') => {
  return (req, res, next) => {
    const resourceOwnerId = req.params[paramName];
    
    if (req.user.role === 'provider' && req.user._id.toString() !== resourceOwnerId) {
      return res.status(403).json({ 
        message: 'Access denied. You can only access your own resources.',
        requested: resourceOwnerId,
        authenticated: req.user._id.toString()
      });
    }
    
    next();
  };
};

// Middleware to validate employer access to job applications
const validateEmployerJobAccess = async (req, res, next) => {
  try {
    const { employerId } = req.params;
    
    // Check if the authenticated user is the employer requesting the data
    if (req.user._id.toString() !== employerId) {
      return res.status(403).json({ 
        message: 'Access denied. You can only view applications for your own jobs.',
        requestedEmployer: employerId,
        authenticatedUser: req.user._id.toString()
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error validating access', error: error.message });
  }
};

module.exports = {
  authenticateToken,
  requireEmployer,
  requireSeeker,
  requireResourceOwnership,
  validateEmployerJobAccess
};