const pool = require('./database');

const seed = async () => {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding données initiales...');

    // ─── SEMAINES ─────────────────────────────────────────
    await client.query("INSERT INTO weeks (id, label, start_date, end_date, max_orders, is_closed, sort_order) VALUES ('w0', '1 – 7 Juin 2026', '2026-06-01', '2026-06-07', 12, true, 0), ('w1', '8 – 14 Juin 2026', '2026-06-08', '2026-06-14', 12, true, 1), ('w2', '15 – 21 Juin 2026', '2026-06-15', '2026-06-21', 12, false, 2), ('w3', '22 – 28 Juin 2026', '2026-06-22', '2026-06-28', 12, false, 3), ('w4', '29 Juin – 5 Juillet 2026', '2026-06-29', '2026-07-05', 12, false, 4), ('w5', '6 – 12 Juillet 2026', '2026-07-06', '2026-07-12', 12, false, 5), ('w6', '13 – 19 Juillet 2026', '2026-07-13', '2026-07-19', 12, false, 6) ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date, max_orders = EXCLUDED.max_orders, is_closed = EXCLUDED.is_closed, sort_order = EXCLUDED.sort_order;");

    // ─── ÉVÉNEMENTS SPÉCIAUX ──────────────────────────────
    await client.query("INSERT INTO special_events (id, name, icon, event_date, description, max_spots, deadline, sort_order) VALUES ('magal_touba', 'Magal de Touba', '🕌', '2 Août 2026', 'Grand pèlerinage annuel — réservation prioritaire', 30, '20 Juillet 2026', 1), ('gamou', 'Gamou', '✨', 'Novembre 2026', 'Célébration du Prophète Muhammad ﷺ', 35, 'Octobre 2026', 2), ('korite', 'Korite (Eid ul-Fitr)', '🌙', '2027', 'Fin du mois sacré de Ramadan', 40, 'Avant Ramadan', 3), ('tabaski', 'Tabaski (Eid ul-Adha)', '🐏', '2027', 'Fête du sacrifice — tenues festives de prestige', 40, '2 semaines avant', 4), ('noel', 'Noël', '🎄', '25 Décembre 2026', 'Tenues de fête et célébrations de fin d’année', 35, '10 Décembre 2026', 5), ('paques', 'Pâques', '🥚', 'Avril 2027', 'Célébration de la résurrection — tenues printanières', 30, 'Mars 2027', 6) ON CONFLICT (id) DO NOTHING;");

    console.log('✅ Données initiales insérées');
  } catch (err) {
    console.error('❌ Erreur seed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed().catch(() => process.exit(1));
