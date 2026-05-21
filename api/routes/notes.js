const express = require('express');
const { getDB } = require('../lib/database');
const { authMiddleware, optionalAuth } = require('../lib/auth');
const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  try {
    const db = getDB();
    const { subject, is_free, language, search, sort, limit=20, offset=0 } = req.query;
    let sql = `SELECT n.*,s.name as subject_name,s.slug as subject_slug,s.emoji as subject_emoji
               FROM notes n LEFT JOIN subjects s ON n.subject_id=s.id WHERE n.is_published=1`;
    const p = [];
    if (subject)   { sql += ' AND s.slug=?';                       p.push(subject); }
    if (is_free!=null) { sql += ' AND n.is_free=?';                p.push(is_free==='true'||is_free==='1'?1:0); }
    if (language)  { sql += ' AND n.language=?';                   p.push(language); }
    if (search)    { sql += ' AND (n.title LIKE ? OR n.tags LIKE ?)'; const q=`%${search}%`; p.push(q,q); }
    const sortMap = { popular:'n.downloads DESC', newest:'n.created_at DESC', price_asc:'n.price ASC', price_desc:'n.price DESC', rating:'n.rating DESC' };
    sql += ` ORDER BY ${sortMap[sort]||'n.downloads DESC'} LIMIT ? OFFSET ?`;
    p.push(+limit, +offset);
    const notes = db.prepare(sql).all(...p);
    const total = db.prepare(`SELECT COUNT(*) as c FROM notes n LEFT JOIN subjects s ON n.subject_id=s.id WHERE n.is_published=1`).get().c;
    res.json({ notes, total });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/subjects', (_req, res) => {
  const subjects = getDB().prepare(`
    SELECT s.*,COUNT(n.id) as note_count FROM subjects s
    LEFT JOIN notes n ON n.subject_id=s.id AND n.is_published=1
    GROUP BY s.id ORDER BY s.sort_order`).all();
  res.json(subjects);
});

router.get('/:slug', optionalAuth, (req, res) => {
  const db = getDB();
  const note = db.prepare(`SELECT n.*,s.name as subject_name,s.slug as subject_slug
    FROM notes n LEFT JOIN subjects s ON n.subject_id=s.id
    WHERE n.slug=? AND n.is_published=1`).get(req.params.slug);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  let hasPurchased = false;
  if (req.user) hasPurchased = !!db.prepare('SELECT id FROM purchases WHERE user_id=? AND note_id=?').get(req.user.id, note.id);
  const reviews = db.prepare(`SELECT r.*,u.name as user_name FROM reviews r JOIN users u ON r.user_id=u.id WHERE r.note_id=? ORDER BY r.created_at DESC LIMIT 10`).all(note.id);
  res.json({ ...note, hasPurchased, reviews });
});

router.post('/:id/review', authMiddleware, (req, res) => {
  const { rating, comment } = req.body;
  if (!rating||rating<1||rating>5) return res.status(400).json({ error: 'Rating 1–5 required' });
  const db = getDB();
  const note = db.prepare('SELECT * FROM notes WHERE id=?').get(req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  if (!note.is_free && !db.prepare('SELECT id FROM purchases WHERE user_id=? AND note_id=?').get(req.user.id, note.id))
    return res.status(403).json({ error: 'Purchase this note to review' });
  db.prepare('INSERT OR REPLACE INTO reviews (user_id,note_id,rating,comment) VALUES (?,?,?,?)').run(req.user.id, +req.params.id, rating, comment);
  const avg = db.prepare('SELECT AVG(rating) as a,COUNT(*) as c FROM reviews WHERE note_id=?').get(+req.params.id);
  db.prepare('UPDATE notes SET rating=?,rating_count=? WHERE id=?').run(Math.round(avg.a*10)/10, avg.c, +req.params.id);
  res.json({ message: 'Review submitted' });
});

router.get('/:id/download', authMiddleware, (req, res) => {
  const db = getDB();
  const note = db.prepare('SELECT * FROM notes WHERE id=?').get(+req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  if (!note.is_free && !db.prepare('SELECT id FROM purchases WHERE user_id=? AND note_id=?').get(req.user.id, note.id))
    return res.status(403).json({ error: 'Please purchase this note first' });
  db.prepare('UPDATE notes SET downloads=downloads+1 WHERE id=?').run(note.id);
  res.json({ message: 'Download ready', title: note.title, note_id: note.id });
});

router.post('/:id/wishlist', authMiddleware, (req, res) => {
  const db = getDB();
  const exists = db.prepare('SELECT id FROM wishlist WHERE user_id=? AND note_id=?').get(req.user.id, +req.params.id);
  if (exists) { db.prepare('DELETE FROM wishlist WHERE user_id=? AND note_id=?').run(req.user.id, +req.params.id); res.json({ wishlisted: false }); }
  else         { db.prepare('INSERT INTO wishlist (user_id,note_id) VALUES (?,?)').run(req.user.id, +req.params.id); res.json({ wishlisted: true }); }
});

module.exports = router;
