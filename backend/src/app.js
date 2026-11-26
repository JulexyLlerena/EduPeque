const path = require('path');
const express = require('express');
const helmet = require('helmet');
const { createSessionMiddleware } = require('./config/session');
const { testConnection } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const docenteRoutes = require('./routes/docenteRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"]
        }
      }
    })
  );

  app.use(express.json({ limit: '256kb' }));
  app.use(createSessionMiddleware());

  app.get('/api/health', async (req, res, next) => {
    try {
      await testConnection();
      res.json({ ok: true, service: 'edupeque-api', database: 'connected' });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/docente', docenteRoutes);

  const frontendDir = path.resolve(__dirname, '../../frontend');
  app.use(express.static(frontendDir));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp
};
