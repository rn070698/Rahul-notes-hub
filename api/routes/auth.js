const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getDB } = require('../lib/database');
const { authMiddleware, SECRET } = require('../lib/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password min 6 characters' });
    const db = getDB();
    if (db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase()))
      return res.status(409).json({ error: 'Email already registered' });
    const hashed = bcrypt.hashSync(password, 10);
    const r = db.prepare('INSERT INTO users (name,email,password) VALUES (?,?,?)').run(name, email.toLowerCase(), hashed);
    const user = { id: r.lastInsertRowid, name, email: email.toLowerCase(), role: 'user' };
    const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Registration successful', token, user });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const db = getDB();
    const u = db.prepare('SELECT * FROM users WHERE email=?').get(email.toLowerCase());
    if (!u || !bcrypt.compareSync(password, u.password))
      return res.status(401).json({ error: 'Invalid email or password' });
    db.prepare('UPDATE users SET last_login=CURRENT_TIMESTAMP WHERE id=?').run(u.id);
    const user = { id: u.id, name: u.name, email: u.email, role: u.role };
    const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, user });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', authMiddleware, (req, res) => {
  const u = getDB().prepare('SELECT id,name,email,role,created_at,last_login FROM users WHERE id=?').get(req.user.id);
  u ? res.json(u) : res.status(404).json({ error: 'User not found' });
});

router.put('/profile', authMiddleware, (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  const db = getDB();
  const u  = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (name) db.prepare('UPDATE users SET name=? WHERE id=?').run(name, u.id);
  if (currentPassword && newPassword) {
    if (!bcrypt.compareSync(currentPassword, u.password))
      return res.status(400).json({ error: 'Current password incorrect' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password too short' });
    db.prepare('UPDATE users SET password=? WHERE id=?').run(bcrypt.hashSync(newPassword,10), u.id);
  }
  res.json({ message: 'Profile updated' });
});

module.exports = router;
