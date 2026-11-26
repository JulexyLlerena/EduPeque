const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const env = {
  port: Number.parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT || '3307', 10),
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edupeque'
  },
  session: {
    secret: process.env.SESSION_SECRET || '',
    maxAgeMs: Number.parseInt(process.env.SESSION_MAX_AGE_MS || '28800000', 10)
  },
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000'
};

function validateEnv() {
  const missing = [];
  if (!env.db.user) {
    missing.push('DB_USER');
  }
  if (!env.db.password) {
    missing.push('DB_PASSWORD');
  }
  if (!env.session.secret || env.session.secret.length < 16) {
    missing.push('SESSION_SECRET (mínimo 16 caracteres)');
  }
  if (Number.isNaN(env.db.port) || env.db.port <= 0) {
    missing.push('DB_PORT válido');
  }
  if (missing.length > 0) {
    throw new Error(`Variables de entorno faltantes o inválidas en .env: ${missing.join(', ')}`);
  }
}

module.exports = {
  env,
  validateEnv
};
