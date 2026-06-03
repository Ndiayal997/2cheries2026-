// routes/admin.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// ─── MULTER CONFIG ───────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'order-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ─── POST /api/admin/orders/manual ──────────────────────
router.post('/orders/manual', requireAdmin, upload.array('photos', 5), async (req, res) => {
  const { client_name, client_phone, description, amount, week_id, event_id, order_date } = req.body;
  const files = req.files || [];
  const imageUrls = files.map(f => '/uploads/' + f.filename);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Trouver ou créer le client
    let clientId;
    const clientRes = await client.query('SELECT id FROM clients WHERE phone = ', [client_phone]);
    
    if (clientRes.rows.length) {
      clientId = clientRes.rows[0].id;
    } else {
      // Créer un client par défaut (mot de passe aléatoire car créé par admin)
      const dummyPass = await bcrypt.hash(Math.random().toString(36), 10);
      const newClientRes = await client.query(
        'INSERT INTO clients (name, phone, password_hash) VALUES (, , ) RETURNING id',
        [client_name, client_phone, dummyPass]
      );
      clientId = newClientRes.rows[0].id;
    }

    // 2. Créer la commande
    let query, params;
    const wave_amount = Math.ceil((amount || 0) / 2);

    if (event_id) {
      query = `INSERT INTO event_orders (client_id, event_id, description, amount, wave_amount, status, images, order_date)
               VALUES ($1, $2, $3, $4, $5, 'confirmed', $6, $7) RETURNING *`;
      params = [clientId, event_id, description, amount, wave_amount, JSON.stringify(imageUrls), order_date || new Date()];
    } else {
      query = `INSERT INTO orders (client_id, week_id, description, amount, wave_amount, status, images, order_date)
               VALUES ($1, $2, $3, $4, $5, 'confirmed', $6, $7) RETURNING *`;
      params = [clientId, week_id, description, amount, wave_amount, JSON.stringify(imageUrls), order_date || new Date()];
    }

    const { rows } = await client.query(query, params);
    await client.query('COMMIT');

    res.status(201).json({ message: 'Commande manuelle créée', order: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la création de la commande' });
  } finally {
    client.release();
  }
});

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
