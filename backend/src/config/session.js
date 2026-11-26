const session = require('express-session');
const MySQLStoreFactory = require('express-mysql-session');
const { env } = require('./env');
const { getPool } = require('./database');

function createSessionMiddleware() {
  const MySQLStore = MySQLStoreFactory(session);
  const sessionStore = new MySQLStore(
    {
      createDatabaseTable: false,
      clearExpired: true,
      checkExpirationInterval: 900000,
      expiration: env.session.maxAgeMs,
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data'
        }
      }
    },
    getPool()
  );

  return session({
    name: 'edupeque.sid',
    secret: env.session.secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
      secure: env.nodeEnv === 'production',
      maxAge: env.session.maxAgeMs
    }
  });
}

module.exports = {
  createSessionMiddleware
};
