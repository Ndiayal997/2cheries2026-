// middleware/auth.js
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// ─── Middleware client authentifié ────────────────────────
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'admin') {
      req.user = { id: 'admin', role: 'admin', name: 'Administrateur' };
      return next();
    }

    // Vérifier que le client existe toujours
    const { rows } = await pool.query(
      'SELECT id, name, email, phone FROM clients WHERE id = $1 AND is_active = true',
      [decoded.id]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Compte introuvable ou désactivé' });
    }

    req.user = { ...rows[0], role: 'client' };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    }
    return res.status(401).json({ error: 'Token invalide' });
  }
};

// ─── Middleware admin seulement ────────────────────────────
const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès réservé à l\'administrateur' });
    }
    next();
  });
};

module.exports = { requireAuth, requireAdmin };
