// routes/events.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// ─── GET /api/events ──────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        e.*,
        COUNT(eo.id) FILTER (WHERE eo.status != 'cancelled') AS order_count
      FROM special_events e
      LEFT JOIN event_orders eo ON eo.event_id = e.id
      WHERE e.is_active = true
      GROUP BY e.id
      ORDER BY e.sort_order
    `);

    const events = rows.map(e => ({
      ...e,
      order_count: parseInt(e.order_count),
      spots_left: e.max_spots - parseInt(e.order_count),
      is_full: parseInt(e.order_count) >= e.max_spots,
    }));

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── POST /api/events/:eventId/reserve ───────────────────
router.post('/:eventId/reserve', requireAuth, [
  body('description').trim().notEmpty().withMessage('Description de la tenue requise'),
  body('amount').isInt({ min: 1000 }).withMessage('Montant invalide'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  if (req.user.role === 'admin') {
    return res.status(403).json({ error: 'L\'admin ne peut pas créer de commande' });
  }

  const { eventId } = req.params;
  const { description, amount } = req.body;

  try {
    const eventRes = await pool.query('SELECT * FROM special_events WHERE id = $1 AND is_active = true', [eventId]);
    if (!eventRes.rows.length) return res.status(404).json({ error: 'Événement introuvable' });
    const event = eventRes.rows[0];

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM event_orders WHERE event_id = $1 AND status != 'cancelled'`,
      [eventId]
    );
    if (parseInt(countRes.rows[0].count) >= event.max_spots) {
      return res.status(400).json({ error: 'Cet événement est complet' });
    }

    // Vérifier doublon
    const dup = await pool.query(
      `SELECT id FROM event_orders WHERE event_id = $1 AND client_id = $2 AND status != 'cancelled'`,
      [eventId, req.user.id]
    );
    if (dup.rows.length) {
      return res.status(409).json({ error: 'Vous avez déjà une réservation pour cet événement' });
    }

    const wave_amount = Math.ceil(amount / 2);

    const { rows } = await pool.query(
      `INSERT INTO event_orders (client_id, event_id, description, amount, wave_amount)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, eventId, description, amount, wave_amount]
    );

    res.status(201).json({
      message: `Réservation pour ${event.name} créée. Envoyez la moitié par Wave.`,
      order: rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── PATCH /api/events/orders/:orderId/status (admin) ─────
router.patch('/orders/:orderId/status', requireAdmin, [
  body('status').isIn(['pending_wave','wave_sent','confirmed','cancelled']),
  body('admin_note').optional().trim(),
], async (req, res) => {
  const { orderId } = req.params;
  const { status, admin_note } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE event_orders SET status = $1, admin_note = COALESCE($2, admin_note)
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

// ─── GET /api/events/orders/all (admin) ───────────────────
router.get('/orders/all', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        eo.*,
        c.name  AS client_name,
        c.email AS client_email,
        c.phone AS client_phone,
        e.name  AS event_name,
        e.event_date
      FROM event_orders eo
      JOIN clients       c ON c.id = eo.client_id
      JOIN special_events e ON e.id = eo.event_id
      ORDER BY eo.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── GET /api/events/orders/mine ──────────────────────────
router.get('/orders/mine', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT eo.*, e.name AS event_name, e.event_date, e.icon
      FROM event_orders eo
      JOIN special_events e ON e.id = eo.event_id
      WHERE eo.client_id = $1
      ORDER BY eo.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
