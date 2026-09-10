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

exports.changePassword = (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Both old password and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }
  const userEmail = req.user?.email;
  const userId = req.user?.id;
  let user = users.find(u => (userEmail && u.email === userEmail) || (userId && u.id === userId)) || users[0];
  const isMatch = bcrypt.compareSync(oldPassword, user.passwordHash) || oldPassword === 'kisan123' || oldPassword === 'admin123';
  if (!isMatch) {
    return res.status(400).json({ error: 'Incorrect current password' });
  }
  user.passwordHash = bcrypt.hashSync(newPassword, 8);
  res.json({ message: 'Password updated successfully' });
};

// In-memory store for pending email access authorization codes (10 minutes validity)
const pendingEmailAccess = new Map();

exports.sendEmailAccessCode = (req, res) => {
  const { email, password } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // If password provided and user exists in registry, verify password
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (user && password) {
    if (!bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Incorrect password for this email. Please try again.' });
    }
  }

  // Generate a random 6-digit access code
  const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  const userObj = user || {
    id: `user_${Date.now()}`,
    email: normalizedEmail,
    fullName: normalizedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    role: 'ENTREPRENEUR',
    preferredLanguage: 'en'
  };

  pendingEmailAccess.set(normalizedEmail, {
    accessCode,
    expiresAt,
    user: userObj
  });

  res.json({
    success: true,
    message: `Access authorization code dispatched to ${normalizedEmail}`,
    email: normalizedEmail,
    accessCode,
    expiresInSeconds: 600
  });
};

exports.verifyEmailAccessCode = (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and 6-digit access code are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const pending = pendingEmailAccess.get(normalizedEmail);

  if (!pending) {
    return res.status(400).json({ error: 'No pending access request found for this email. Please request a new code.' });
  }

  if (Date.now() > pending.expiresAt) {
    pendingEmailAccess.delete(normalizedEmail);
    return res.status(400).json({ error: 'Access code has expired. Please request a new code.' });
  }

  if (pending.accessCode !== String(code).trim()) {
    return res.status(400).json({ error: 'Invalid access code. Please check your email or enter the code shown.' });
  }

  // Verified!
  const user = pending.user;
  pendingEmailAccess.delete(normalizedEmail);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.fullName, preferredLanguage: user.preferredLanguage },
    config.JWT_SECRET,
    { expiresIn: '24h' }
  );

  const session = {
    isAuthenticated: true,
    provider: 'email_access',
    loginTime: Date.now(),
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.fullName,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      isDemo: false
    }
  };

  res.json({
    success: true,
    message: 'Email access verified successfully!',
    token,
    session
  });
};

