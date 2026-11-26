const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mysql = require('mysql2/promise');
const { env } = require('../config/env');

function askQuestion(rl, promptText, hidden = false) {
  return new Promise((resolve) => {
    if (!hidden || !process.stdin.isTTY) {
      rl.question(promptText, (answer) => resolve(answer));
      return;
    }

    const onData = (char) => {
      const str = char.toString('utf8');
      if (str === '\r' || str === '\n' || str === '\u0004') {
        process.stdin.removeListener('data', onData);
      } else {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${promptText}${'*'.repeat(rl.line.length)}`);
      }
    };

    process.stdin.on('data', onData);
    rl.question(promptText, (answer) => {
      process.stdin.removeListener('data', onData);
      resolve(answer);
    });
  });
}

async function runSetup() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let connection = null;
  try {
    console.log('=== EduPeque | Inicialización de Base de Datos MySQL ===');
    console.log(`Destino configurado: ${env.db.host}:${env.db.port} -> ${env.db.database}`);

    const rootPassword = await askQuestion(
      rl,
      'Ingresa la contraseña del usuario administrador MySQL (root): ',
      true
    );

    const appUser = env.db.user || (await askQuestion(rl, 'Nombre del usuario de aplicación: '));
    const appPassword =
      env.db.password ||
      (await askQuestion(rl, 'Contraseña para el usuario de aplicación: ', true));

    if (!appUser || !appPassword || appPassword.length < 8) {
      throw new Error('El usuario de aplicación y una contraseña (mín. 8 caracteres) son obligatorios.');
    }

    connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: 'root',
      password: rootPassword,
      multipleStatements: true,
      charset: 'utf8mb4'
    });

    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Ejecutando schema.sql...');
    await connection.query(schemaSql);

    console.log('Ejecutando seed.sql (catálogos sin datos personales)...');
    await connection.query(seedSql);

    if (!/^[a-zA-Z0-9_]+$/.test(env.db.database)) {
      throw new Error('El nombre de la base de datos contiene caracteres inválidos.');
    }

    console.log(`Configurando usuario de aplicación con privilegios mínimos (${appUser})...`);
    await connection.query('CREATE USER IF NOT EXISTS ?@? IDENTIFIED BY ?', [
      appUser,
      env.db.host,
      appPassword
    ]);
    await connection.query('ALTER USER ?@? IDENTIFIED BY ?', [
      appUser,
      env.db.host,
      appPassword
    ]);
    await connection.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON \`${env.db.database}\`.* TO ?@?`,
      [appUser, env.db.host]
    );
    await connection.query('FLUSH PRIVILEGES');

    console.log('Base de datos edupeque inicializada correctamente.');
  } finally {
    rl.close();
    if (connection) {
      await connection.end();
    }
  }
}

runSetup().catch((error) => {
  console.error('Error al inicializar la base de datos:', error.message);
  process.exit(1);
});
