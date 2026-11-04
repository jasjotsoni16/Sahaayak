const jwt = require('jsonwebtoken');
const User = require('../Model/User');

const sameId = (a, b) => String(a) === String(b);

const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    req.user = await User.findById(decoded._id);
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `User role ${req.user.role} is not authorized to access this route` });
  }
  next();
};

const requireSelfOrAdmin = (param = 'userId') => (req, res, next) => {
  if (req.user.role === 'admin' || sameId(req.user._id, req.params[param])) return next();
  return res.status(403).json({ error: 'Forbidden' });
};

// Like requireSelfOrAdmin, but also lets the listed roles through (e.g. employers viewing applicants).
const requireSelfOrRole = (param = 'userId', ...roles) => (req, res, next) => {
  if (req.user.role === 'admin' || roles.includes(req.user.role) || sameId(req.user._id, req.params[param])) return next();
  return res.status(403).json({ error: 'Forbidden' });
};

const loadOwned = (Model, { param = 'id', ownerFields }) => async (req, res, next) => {
  const doc = await Model.findById(req.params[param]); // CastError -> 400 via errorHandler
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const allowed = req.user.role === 'admin' || ownerFields.some((f) => sameId(doc[f], req.user._id));
  if (!allowed) return res.status(403).json({ error: 'Forbidden' });
  req.doc = doc;
  next();
};

const bindBodyToUser = (...fields) => (req, res, next) => {
  if (req.user.role !== 'admin') {
    req.body = req.body || {};
    for (const f of fields) req.body[f] = String(req.user._id);
  }
  next();
};

module.exports = { requireAuth, authorizeRoles, requireSelfOrAdmin, requireSelfOrRole, loadOwned, bindBodyToUser };
