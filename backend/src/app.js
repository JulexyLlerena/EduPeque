const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { env } = require('./config/env');
const { createSessionMiddleware } = require('./config/session');
const { testConnection } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const docenteRoutes = require('./routes/docenteRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  // Si está detrás de un proxy inverso (como Render, Nginx, etc.)
  if (env.nodeEnv === 'production') {
    app.set('trust proxy', 1);
  }

  // Configuración de CORS para permitir peticiones desde el frontend local o remoto (GitHub Pages)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://julexyllerena.github.io'
  ];

  if (env.clientOrigin && !allowedOrigins.includes(env.clientOrigin)) {
    allowedOrigins.push(env.clientOrigin);
  }

  app.use(
    cors({
      origin: (origin, callback) => {
        // Permitir peticiones sin origen (como apps móviles, Postman o mismo servidor)
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true
    })
  );

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          fontSrc: ["'self'"],
          connectSrc: ["'self'", ...allowedOrigins]
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
