const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

/**
 * Genera un código alfanumérico aleatorio de 8 caracteres usando CSPRNG.
 * Se omiten caracteres visualmente ambiguos (0/O, 1/I) para facilitar la lectura familiar.
 */
function generateInvitationCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    const index = crypto.randomInt(0, ALPHABET.length);
    code += ALPHABET[index];
  }
  return code;
}

module.exports = {
  generateInvitationCode,
  CODE_LENGTH
};
