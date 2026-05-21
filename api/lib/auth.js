const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'rahul_notes_secret_dev';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid or expired token' }); }
};

const adminMiddleware = (req, res, next) =>
  authMiddleware(req, res, () =>
    req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admin access required' })
  );

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) { try { req.user = jwt.verify(token, SECRET); } catch {} }
  next();
};

module.exports = { authMiddleware, adminMiddleware, optionalAuth, SECRET };
