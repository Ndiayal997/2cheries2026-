// routes/weeks.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// ─── GET /api/weeks ───────────────────────────────────────
// Retourne toutes les semaines avec leur nombre de commandes
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        w.*,
        COUNT(o.id) FILTER (WHERE o.status != 'cancelled') AS order_count
      FROM weeks w
      LEFT JOIN orders o ON o.week_id = w.id
      GROUP BY w.id
      ORDER BY w.sort_order
    `);

    // Calculer quelle semaine est "ouverte" (première non complète, non fermée)
    const weeks = rows.map(w => ({
      ...w,
      order_count: parseInt(w.order_count),
      is_full: parseInt(w.order_count) >= w.max_orders,
    }));

    // Première semaine non fermée et non pleine
    const firstOpenIdx = weeks.findIndex(w => !w.is_closed && !w.is_full && w.id !== 'w0');
    weeks.forEach((w, i) => {
      w.is_current_open = (i === firstOpenIdx);
    });

    res.json(weeks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── PATCH /api/weeks/:weekId/closure (admin) ─────────────
router.patch('/:weekId/closure', requireAdmin, [
  body('is_closed').isBoolean().withMessage('Statut de fermeture invalide').toBoolean(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { weekId } = req.params;
  const { is_closed } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE weeks
       SET is_closed = $1
       WHERE id = $2
       RETURNING *`,
      [is_closed, weekId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Semaine introuvable' });

    res.json({
      message: is_closed ? 'Semaine bouclée' : 'Semaine rouverte',
      week: rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── POST /api/weeks/:weekId/reserve ──────────────────────
router.post('/:weekId/reserve', requireAuth, [
  body('description').trim().notEmpty().withMessage('Description requise'),
  body('amount').isInt({ min: 1000 }).withMessage('Montant invalide (min 1000 FCFA)'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  if (req.user.role === 'admin') {
    return res.status(403).json({ error: 'L\'admin ne peut pas créer de commande client' });
  }

  const { weekId } = req.params;
  const { description, amount } = req.body;

  try {
    // Vérifier que la semaine existe et est ouverte
    const weekRes = await pool.query('SELECT * FROM weeks WHERE id = $1', [weekId]);
    if (!weekRes.rows.length) return res.status(404).json({ error: 'Semaine introuvable' });
    const week = weekRes.rows[0];
    if (week.is_closed) return res.status(400).json({ error: 'Cette semaine est fermée' });

    // Compter les commandes actives
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE week_id = $1 AND status != 'cancelled'`,
      [weekId]
    );
    const count = parseInt(countRes.rows[0].count);
    if (count >= week.max_orders) {
      return res.status(400).json({ error: 'Cette semaine est complète' });
    }

    // Vérifier que ce client n'a pas déjà une commande active pour cette semaine
    const dupCheck = await pool.query(
      `SELECT id FROM orders WHERE week_id = $1 AND client_id = $2 AND status != 'cancelled'`,
      [weekId, req.user.id]
    );
    if (dupCheck.rows.length) {
      return res.status(409).json({ error: 'Vous avez déjà une réservation pour cette semaine' });
    }

    const wave_amount = Math.ceil(amount / 2);

    const { rows } = await pool.query(
      `INSERT INTO orders (client_id, week_id, description, amount, wave_amount)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, weekId, description, amount, wave_amount]
    );

    res.status(201).json({
      message: 'Réservation créée. Envoyez la moitié par Wave au 78 157 32 91.',
      order: rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── PATCH /api/weeks/orders/:orderId/status (admin) ──────
router.patch('/orders/:orderId/status', requireAdmin, [
  body('status').isIn(['pending_wave','wave_sent','confirmed','cancelled']),
  body('admin_note').optional().trim(),
], async (req, res) => {
  const { orderId } = req.params;
  const { status, admin_note } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE orders SET status = $1, admin_note = COALESCE($2, admin_note)
       WHERE id = $3 RETURNING *`,
      [status, admin_note || null, orderId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Commande introuvable' });
    res.json({ message: 'Statut mis à jour', order: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── GET /api/weeks/orders/all (admin) ────────────────────
router.get('/orders/all', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        o.*,
        c.name  AS client_name,
        c.email AS client_email,
        c.phone AS client_phone,
        w.label AS week_label
      FROM orders o
      JOIN clients c ON c.id = o.client_id
      JOIN weeks   w ON w.id = o.week_id
      ORDER BY o.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── GET /api/weeks/orders/mine (client) ──────────────────
router.get('/orders/mine', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT o.*, w.label AS week_label
      FROM orders o
      JOIN weeks w ON w.id = o.week_id
      WHERE o.client_id = $1
      ORDER BY o.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
