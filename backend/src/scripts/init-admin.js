const readline = require('readline');
const bcrypt = require('bcryptjs');
const { validateEnv } = require('../config/env');
const { testConnection, closePool } = require('../config/database');
const docenteModel = require('../models/docenteModel');
const { isValidEmail, isStrongPassword, normalizeText } = require('../utils/validators');

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

async function runInitAdmin() {
  validateEnv();
  await testConnection();

  const alreadyExists = await docenteModel.hasAnyAdmin();
  if (alreadyExists) {
    console.log('Ya existe un docente administrador activo en la base de datos. No se realizaron cambios.');
    await closePool();
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    console.log('=== EduPeque | Registro Seguro del Docente Administrador Inicial ===');

    const nombres = normalizeText(await askQuestion(rl, 'Nombres: '));
    const apellidos = normalizeText(await askQuestion(rl, 'Apellidos: '));
    const correo = normalizeText(await askQuestion(rl, 'Correo electrónico: ')).toLowerCase();
    const especialidad = normalizeText(await askQuestion(rl, 'Especialidad (opcional): '));
    const password = await askQuestion(rl, 'Contraseña (mínimo 8 caracteres): ', true);
    const confirmPassword = await askQuestion(rl, 'Confirmar contraseña: ', true);

    if (nombres.length < 2 || apellidos.length < 2) {
      throw new Error('Nombres y apellidos válidos son obligatorios.');
    }
    if (!isValidEmail(correo)) {
      throw new Error('El correo electrónico no tiene un formato válido.');
    }
    if (!isStrongPassword(password)) {
      throw new Error('La contraseña debe tener entre 8 y 72 caracteres.');
    }
    if (password !== confirmPassword) {
      throw new Error('Las contraseñas no coinciden.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const docenteId = await docenteModel.createDocente({
      correo,
      passwordHash,
      nombres,
      apellidos,
      especialidad: especialidad || 'Coordinación Académica',
      telefonoContacto: null,
      esAdministrador: true
    });

    console.log(`Docente administrador inicial creado correctamente (ID docente: ${docenteId}).`);
  } finally {
    rl.close();
    await closePool();
  }
}

runInitAdmin().catch((error) => {
  console.error('No se pudo crear el docente administrador:', error.message);
  process.exit(1);
});
