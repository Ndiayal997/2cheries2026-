// config/database.js
const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || '2cheries_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool({
  ...connectionConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Connecté à PostgreSQL');
  }
});

pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL:', err);
  if (isProduction) {
    // En production, on évite de crash violemment le processus immédiatement
    // pour permettre d'autres tentatives de reconnexion du pool
  } else {
    process.exit(-1);
  }
});

module.exports = pool;
