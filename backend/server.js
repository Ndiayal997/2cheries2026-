// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// ─── SÉCURITÉ & MIDDLEWARES ───────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes' },
});
app.use('/api/', limiter);

// Rate limiting plus strict sur auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives, réessayez dans 15 minutes' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/admin', authLimiter);

// ─── ROUTES ───────────────────────────────────────────────
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/weeks',  require('./routes/weeks'));
app.use('/api/events', require('./routes/events'));
app.use('/api/admin',  require('./routes/admin'));

// ─── HEALTH CHECK ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: '2Cheries API', timestamp: new Date().toISOString() });
});

// ─── 404 ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

// ─── ERROR HANDLER ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// ─── START ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌹 2Cheries API démarrée`);
  console.log(`📡 http://localhost:${PORT}`);
  console.log(`🌍 Environnement : ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
