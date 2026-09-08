const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');

// In-memory demo user registry for instant zero-config testing
const users = [
  {
    id: 'user-001',
    email: 'kisan@sih.gov.in',
    passwordHash: bcrypt.hashSync('kisan123', 8),
    fullName: 'Ramesh Kisan',
    role: 'ENTREPRENEUR',
    preferredLanguage: 'hi'
  },
  {
    id: 'user-002',
    email: 'lakshmi@sih.gov.in',
    passwordHash: bcrypt.hashSync('lakshmi123', 8),
    fullName: 'Lakshmi Devi',
    role: 'ENTREPRENEUR',
    preferredLanguage: 'te'
  }
];

exports.login = (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.fullName, preferredLanguage: user.preferredLanguage },
    config.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role, name: user.fullName, preferredLanguage: user.preferredLanguage }
  });
};

exports.demoLogin = (req, res) => {
  const user = users[0];
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.fullName, preferredLanguage: user.preferredLanguage },
    config.JWT_SECRET,
    { expiresIn: '24h' }
  );
  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role, name: user.fullName, preferredLanguage: user.preferredLanguage }
  });
};
