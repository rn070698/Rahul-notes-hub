const express = require('express');
const { getDB } = require('../lib/database');
const { adminMiddleware } = require('../lib/auth');
const router = express.Router();

/* ── Dashboard ── */
router.get('/dashboard', adminMiddleware, (req, res) => {
  const db = getDB();
  res.json({
    totalNotes:    db.prepare('SELECT COUNT(*) as c FROM notes WHERE is_published=1').get().c,
    totalUsers:    db.prepare("SELECT COUNT(*) as c FROM users WHERE role='user'").get().c,
    totalOrders:   db.prepare("SELECT COUNT(*) as c FROM orders WHERE status='paid'").get().c,
    totalRevenue:  db.prepare("SELECT COALESCE(SUM(amount),0) as r FROM orders WHERE status='paid'").get().r,
    totalDownloads:db.prepare('SELECT COALESCE(SUM(downloads),0) as d FROM notes').get().d,
    freeNotes:     db.prepare('SELECT COUNT(*) as c FROM notes WHERE is_free=1').get().c,
    recentOrders:  db.prepare(`SELECT o.*,u.name as user_name,u.email,n.title as note_title FROM orders o JOIN users u ON o.user_id=u.id LEFT JOIN notes n ON o.note_id=n.id WHERE o.status='paid' ORDER BY o.paid_at DESC LIMIT 8`).all(),
    topNotes:      db.prepare(`SELECT n.*,s.name as subject_name FROM notes n LEFT JOIN subjects s ON n.subject_id=s.id ORDER BY n.downloads DESC LIMIT 5`).all(),
    revenueByMonth:db.prepare(`SELECT strftime('%Y-%m',paid_at) as month,SUM(amount) as revenue,COUNT(*) as orders FROM orders WHERE status='paid' AND paid_at>=date('now','-6 months') GROUP BY month ORDER BY month`).all(),
  });
});

/* ── Notes CRUD ── */
router.get('/notes', adminMiddleware, (req, res) => {
  const { search='', page=1 } = req.query;
  const limit=20, offset=(+page-1)*limit;
  const db = getDB();
  const sql = `SELECT n.*,s.name as subject_name FROM notes n LEFT JOIN subjects s ON n.subject_id=s.id WHERE (n.title LIKE ? OR n.tags LIKE ?) ORDER BY n.created_at DESC LIMIT ? OFFSET ?`;
  const q = `%${search}%`;
  res.json({ notes: db.prepare(sql).all(q,q,limit,offset), total: db.prepare('SELECT COUNT(*) as c FROM notes').get().c });
});

router.post('/notes', adminMiddleware, (req, res) => {
  try {
    const { title,slug,description,subject_id,price,is_free,pages,language,exam_type,emoji,tags } = req.body;
    if (!title||!slug) return res.status(400).json({ error: 'title and slug required' });
    const r = getDB().prepare(`INSERT INTO notes (title,slug,description,subject_id,price,is_free,pages,language,exam_type,emoji,tags,is_published) VALUES (?,?,?,?,?,?,?,?,?,?,?,1)`)
      .run(title,slug,description,+subject_id,+price||0,+is_free||0,+pages||0,language||'English',exam_type||'UPSC',emoji||'📄',tags||'');
    res.status(201).json({ message:'Note created', id: r.lastInsertRowid });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/notes/:id', adminMiddleware, (req, res) => {
  try {
    const { title,slug,description,subject_id,price,is_free,pages,language,exam_type,emoji,tags,is_published } = req.body;
    getDB().prepare(`UPDATE notes SET title=?,slug=?,description=?,subject_id=?,price=?,is_free=?,pages=?,language=?,exam_type=?,emoji=?,tags=?,is_published=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
      .run(title,slug,description,+subject_id,+price||0,+is_free||0,+pages||0,language,exam_type,emoji,tags,+is_published??1,+req.params.id);
    res.json({ message:'Note updated' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/notes/:id', adminMiddleware, (req, res) => {
  getDB().prepare('UPDATE notes SET is_published=0 WHERE id=?').run(+req.params.id);
  res.json({ message:'Note unpublished' });
});

/* ── Users ── */
router.get('/users', adminMiddleware, (req, res) => {
  const { search='', page=1 } = req.query;
  const limit=20, offset=(+page-1)*limit, q=`%${search}%`;
  const db = getDB();
  res.json({
    users: db.prepare(`SELECT u.id,u.name,u.email,u.role,u.created_at,u.last_login, COUNT(DISTINCT p.id) as purchases_count, COALESCE(SUM(o.amount),0) as total_spent FROM users u LEFT JOIN purchases p ON p.user_id=u.id LEFT JOIN orders o ON o.user_id=u.id AND o.status='paid' WHERE u.name LIKE ? OR u.email LIKE ? GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`).all(q,q,limit,offset),
    total: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
  });
});

router.put('/users/:id/role', adminMiddleware, (req, res) => {
  const { role } = req.body;
  if (!['user','admin'].includes(role)) return res.status(400).json({ error:'Invalid role' });
  getDB().prepare('UPDATE users SET role=? WHERE id=?').run(role, +req.params.id);
  res.json({ message:'Role updated' });
});

/* ── Orders ── */
router.get('/orders', adminMiddleware, (req, res) => {
  const { status, page=1 } = req.query;
  const limit=20, offset=(+page-1)*limit;
  const db = getDB();
  let sql = `SELECT o.*,u.name as user_name,u.email,n.title as note_title FROM orders o JOIN users u ON o.user_id=u.id LEFT JOIN notes n ON o.note_id=n.id WHERE 1=1`;
  const p = [];
  if (status) { sql+=' AND o.status=?'; p.push(status); }
  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?'; p.push(limit,offset);
  res.json({ orders: db.prepare(sql).all(...p), total: db.prepare('SELECT COUNT(*) as c FROM orders').get().c });
});

/* ── Coupons ── */
router.get('/coupons', adminMiddleware, (_req, res) => res.json(getDB().prepare('SELECT * FROM coupons ORDER BY created_at DESC').all()));

router.post('/coupons', adminMiddleware, (req, res) => {
  const { code,discount_type,discount_value,min_amount,max_uses,expires_at } = req.body;
  getDB().prepare('INSERT INTO coupons (code,discount_type,discount_value,min_amount,max_uses,expires_at) VALUES (?,?,?,?,?,?)').run(code.toUpperCase(),discount_type,+discount_value,+min_amount||0,+max_uses||100,expires_at||null);
  res.status(201).json({ message:'Coupon created' });
});

router.put('/coupons/:id', adminMiddleware, (req, res) => {
  getDB().prepare('UPDATE coupons SET is_active=? WHERE id=?').run(req.body.is_active?1:0, +req.params.id);
  res.json({ message:'Coupon updated' });
});

/* ── Subjects ── */
router.get('/subjects', adminMiddleware, (_req, res) => res.json(getDB().prepare('SELECT * FROM subjects ORDER BY sort_order').all()));

router.post('/subjects', adminMiddleware, (req, res) => {
  const { name,slug,emoji,description,sort_order } = req.body;
  getDB().prepare('INSERT INTO subjects (name,slug,emoji,description,sort_order) VALUES (?,?,?,?,?)').run(name,slug,emoji,description,+sort_order||0);
  res.status(201).json({ message:'Subject created' });
});

/* ── Analytics ── */
router.get('/analytics', adminMiddleware, (_req, res) => {
  const db = getDB();
  res.json({
    dailyOrders:   db.prepare(`SELECT date(created_at) as date,COUNT(*) as count,SUM(amount) as revenue FROM orders WHERE status='paid' AND created_at>=date('now','-30 days') GROUP BY date(created_at) ORDER BY date`).all(),
    subjectRevenue:db.prepare(`SELECT s.name,SUM(o.amount) as revenue,COUNT(o.id) as orders FROM orders o JOIN notes n ON o.note_id=n.id JOIN subjects s ON n.subject_id=s.id WHERE o.status='paid' GROUP BY s.id ORDER BY revenue DESC`).all(),
    freeVsPaid:    db.prepare(`SELECT SUM(CASE WHEN is_free=1 THEN downloads ELSE 0 END) as free_downloads, SUM(CASE WHEN is_free=0 THEN downloads ELSE 0 END) as paid_downloads FROM notes`).get(),
  });
});

module.exports = router;
