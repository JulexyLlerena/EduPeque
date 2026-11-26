const { env, validateEnv } = require('./config/env');
const { testConnection, closePool } = require('./config/database');
const { createApp } = require('./app');

async function startServer() {
  validateEnv();
  await testConnection();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`EduPeque ejecutándose en http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((error) => {
  console.error('No se pudo iniciar el servidor EduPeque:', error.message);
  process.exit(1);
});
