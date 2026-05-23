// config/migrate.js
const pool = require('./database');

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Migration en cours...'); console.log('Connecting...');

    await client.query(`
      -- Extension UUID
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- ─── TABLE CLIENTS ────────────────────────────────────
      CREATE TABLE IF NOT EXISTS clients (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name          VARCHAR(150) NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        phone         VARCHAR(30) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active     BOOLEAN DEFAULT true,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );

      -- ─── TABLE SEMAINES ───────────────────────────────────
      CREATE TABLE IF NOT EXISTS weeks (
        id          VARCHAR(20) PRIMARY KEY,
        label       VARCHAR(100) NOT NULL,
        start_date  DATE NOT NULL,
        end_date    DATE NOT NULL,
        max_orders  INT DEFAULT 12,
        is_active   BOOLEAN DEFAULT true,
        is_closed   BOOLEAN DEFAULT false,
        sort_order  INT NOT NULL
      );

      -- ─── TABLE EVENEMENTS SPECIAUX ────────────────────────
      CREATE TABLE IF NOT EXISTS special_events (
        id           VARCHAR(30) PRIMARY KEY,
        name         VARCHAR(100) NOT NULL,
        icon         VARCHAR(10),
        event_date   VARCHAR(50),
        description  TEXT,
        max_spots    INT DEFAULT 30,
        deadline     VARCHAR(100),
        is_active    BOOLEAN DEFAULT true,
        sort_order   INT NOT NULL
      );

      -- ─── TABLE COMMANDES (semaines) ───────────────────────
      CREATE TABLE IF NOT EXISTS orders (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        week_id       VARCHAR(20) NOT NULL REFERENCES weeks(id),
        description   TEXT NOT NULL,
        amount        NUMERIC(12,0) NOT NULL,
        wave_amount   NUMERIC(12,0) NOT NULL,
        status        VARCHAR(30) DEFAULT 'pending_wave'
                      CHECK (status IN ('pending_wave','wave_sent','confirmed','cancelled')),
        admin_note    TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );

      -- ─── TABLE COMMANDES EVENEMENTS ───────────────────────
      CREATE TABLE IF NOT EXISTS event_orders (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        event_id      VARCHAR(30) NOT NULL REFERENCES special_events(id),
        description   TEXT NOT NULL,
        amount        NUMERIC(12,0) NOT NULL,
        wave_amount   NUMERIC(12,0) NOT NULL,
        status        VARCHAR(30) DEFAULT 'pending_wave'
                      CHECK (status IN ('pending_wave','wave_sent','confirmed','cancelled')),
        admin_note    TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );

      -- ─── INDEX ────────────────────────────────────────────
      CREATE INDEX IF NOT EXISTS idx_orders_client_id   ON orders(client_id);
      CREATE INDEX IF NOT EXISTS idx_orders_week_id     ON orders(week_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_event_orders_event ON event_orders(event_id);
      CREATE INDEX IF NOT EXISTS idx_event_orders_client ON event_orders(client_id);

      -- ─── TRIGGER updated_at ───────────────────────────────
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_clients_updated ON clients;
      CREATE TRIGGER trg_clients_updated
        BEFORE UPDATE ON clients
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();

      DROP TRIGGER IF EXISTS trg_orders_updated ON orders;
      CREATE TRIGGER trg_orders_updated
        BEFORE UPDATE ON orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();

      DROP TRIGGER IF EXISTS trg_event_orders_updated ON event_orders;
      CREATE TRIGGER trg_event_orders_updated
        BEFORE UPDATE ON event_orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    console.log('✅ Tables créées avec succès');
  } catch (err) {
    console.error('❌ Erreur migration:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate().catch(() => process.exit(1));
