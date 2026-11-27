const mysql = require('mysql2/promise');
const { env } = require('./env');

let pool = null;

function getPool() {
  if (!pool) {
    const poolConfig = {
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      timezone: 'local'
    };

    if (env.nodeEnv === 'production') {
      poolConfig.ssl = {};
    }

    pool = mysql.createPool(poolConfig);
  }
  return pool;
}

async function testConnection() {
  const currentPool = getPool();
  const connection = await currentPool.getConnection();
  try {
    await connection.query('SELECT 1 AS ok');
    return true;
  } finally {
    connection.release();
  }
}

async function withTransaction(callback) {
  const currentPool = getPool();
  const connection = await currentPool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getPool,
  testConnection,
  withTransaction,
  closePool
};
