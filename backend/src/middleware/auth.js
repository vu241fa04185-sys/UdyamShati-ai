const jwt = require('jsonwebtoken');
const config = require('../config');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    // If no token, assign default guest session for demo accessibility
    req.user = { id: 'guest-rural-user', role: 'ENTREPRENEUR', name: 'Demo Entrepreneur' };
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    req.user = { id: 'guest-rural-user', role: 'ENTREPRENEUR', name: 'Demo Entrepreneur' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    req.user = { id: 'guest-rural-user', role: 'ENTREPRENEUR', name: 'Demo Entrepreneur' };
    next();
  }
};

module.exports = { verifyToken };
