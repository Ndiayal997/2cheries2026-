// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// ─── POST /api/auth/register ──────────────────────────────
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Le nom est requis'),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail().withMessage('Email invalide'),
  body('phone').trim().notEmpty().withMessage('Le téléphone est requis'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe: 6 caractères minimum'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { name, email, phone, password } = req.body;

  try {
    // Vérifier si l'email existe déjà
    const existing = await pool.query('SELECT id FROM clients WHERE phone = $1', [phone]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Ce numéro de téléphone est déjà utilisé' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO clients (name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone, created_at`,
      [name, email, phone, password_hash]
    );

    const client = rows[0];
    const token = jwt.sign(
      { id: client.id, role: 'client' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      user: { id: client.id, name: client.name, email: client.email, phone: client.phone, role: 'client' }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────
router.post('/login', [
  body('email').notEmpty(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Identifiant ou mot de passe invalide' });
  }

  const { email, password } = req.body;

  try {
    const { rows } = await pool.query(
      'SELECT * FROM clients WHERE (email = $1 OR phone = $1) AND is_active = true',
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
    }

    const client = rows[0];
    const match = await bcrypt.compare(password, client.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: client.id, role: 'client' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: { id: client.id, name: client.name, email: client.email, phone: client.phone, role: 'client' }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── POST /api/auth/admin/login ───────────────────────────
router.post('/admin/login', [
  body('username').notEmpty(),
  body('password').notEmpty(),
], async (req, res) => {
  const { username, password } = req.body; 

  const adminUser = process.env.ADMIN_USERNAME || 'admin2cheries';
  const adminPass = process.env.ADMIN_PASSWORD || '2cheries2026!';
  if (username !== adminUser || password !== adminPass) {
    return res.status(401).json({ error: 'Identifiants administrateur incorrects' });
  }

  const token = jwt.sign(
    { role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({
    token,
    user: { id: 'admin', name: 'Administrateur', role: 'admin' }
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
