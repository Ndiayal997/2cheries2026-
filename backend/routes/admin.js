// routes/admin.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAdmin } = require('../middleware/auth');

// ─── GET /api/admin/stats ─────────────────────────────────
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [
      clientsRes,
      weekOrdersRes,
      eventOrdersRes,
      weekConfirmedRes,
      eventConfirmedRes,
      recentRes
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM clients WHERE is_active = true'),
      pool.query(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status='confirmed')    AS confirmed,
        COUNT(*) FILTER (WHERE status='pending_wave') AS pending_wave,
        COUNT(*) FILTER (WHERE status='wave_sent')    AS wave_sent,
        COUNT(*) FILTER (WHERE status='cancelled')    AS cancelled
        FROM orders`),
      pool.query(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status='confirmed')    AS confirmed,
        COUNT(*) FILTER (WHERE status='pending_wave') AS pending_wave,
        COUNT(*) FILTER (WHERE status='wave_sent')    AS wave_sent,
        COUNT(*) FILTER (WHERE status='cancelled')    AS cancelled
        FROM event_orders`),
      pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM orders WHERE status='confirmed'`),
      pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM event_orders WHERE status='confirmed'`),
      pool.query(`
        (SELECT 'week' AS type, id, client_id, status, created_at, description FROM orders ORDER BY created_at DESC LIMIT 5)
        UNION ALL
        (SELECT 'event' AS type, id, client_id, status, created_at, description FROM event_orders ORDER BY created_at DESC LIMIT 5)
        ORDER BY created_at DESC LIMIT 8
      `)
    ]);

    const wo = weekOrdersRes.rows[0];
    const eo = eventOrdersRes.rows[0];

    res.json({
      clients: parseInt(clientsRes.rows[0].count),
      week_orders: {
        total: parseInt(wo.total),
        confirmed: parseInt(wo.confirmed),
        pending_wave: parseInt(wo.pending_wave),
        wave_sent: parseInt(wo.wave_sent),
        cancelled: parseInt(wo.cancelled),
      },
      event_orders: {
        total: parseInt(eo.total),
        confirmed: parseInt(eo.confirmed),
        pending_wave: parseInt(eo.pending_wave),
        wave_sent: parseInt(eo.wave_sent),
        cancelled: parseInt(eo.cancelled),
      },
      revenue: {
        weeks: parseFloat(weekConfirmedRes.rows[0].total),
        events: parseFloat(eventConfirmedRes.rows[0].total),
        total: parseFloat(weekConfirmedRes.rows[0].total) + parseFloat(eventConfirmedRes.rows[0].total),
      },
      recent_orders: recentRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── GET /api/admin/clients ───────────────────────────────
router.get('/clients', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.id, c.name, c.email, c.phone, c.is_active, c.created_at,
        COUNT(DISTINCT o.id)  AS week_orders,
        COUNT(DISTINCT eo.id) AS event_orders
      FROM clients c
      LEFT JOIN orders       o  ON o.client_id  = c.id
      LEFT JOIN event_orders eo ON eo.client_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── PATCH /api/admin/clients/:id/toggle ──────────────────
router.patch('/clients/:id/toggle', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE clients SET is_active = NOT is_active WHERE id = $1 RETURNING id, name, is_active`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Client introuvable' });
    res.json({ message: `Client ${rows[0].is_active ? 'activé' : 'désactivé'}`, client: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
