require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── static uploads ── */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/* ── routes ── */
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/notes',   require('./routes/notes'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/admin',   require('./routes/admin'));

/* ── health ── */
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', app: 'Rahul Notes Hub', version: '1.0.0' })
);

/* ── 404 for unknown /api/* ── */
app.use('/api/*', (_req, res) => res.status(404).json({ error: 'API route not found' }));

/* ── serve frontend for local dev ── */
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, '../frontend')));
  app.get('*', (_req, res) =>
    res.sendFile(path.join(__dirname, '../frontend/index.html'))
  );
}

/* ── error handler ── */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

/* ── local server ── */
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(`\n🚀  Rahul Notes Hub  →  http://localhost:${PORT}\n`)
  );
}

module.exports = app;
