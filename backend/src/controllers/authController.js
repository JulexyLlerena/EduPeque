const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const body = req.body || {};
    const user = await authService.login({
      correo: body.correo,
      password: body.password,
      rolEsperado: body.rol
    });

    req.session.regenerate((regenErr) => {
      if (regenErr) {
        return next(regenErr);
      }

      req.session.user = {
        id: user.id,
        rol: user.rol,
        docenteId: user.docenteId,
        esAdministrador: user.esAdministrador
      };

      if (!body.recordarme) {
        req.session.cookie.expires = false;
      }

      return req.session.save((saveErr) => {
        if (saveErr) {
          return next(saveErr);
        }
        return res.json({
          ok: true,
          message: 'Inicio de sesión exitoso.',
          data: { user }
        });
      });
    });
  } catch (error) {
    next(error);
  }
}

function logout(req, res, next) {
  if (!req.session) {
    return res.json({ ok: true, message: 'Sesión cerrada.' });
  }
  return req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie('edupeque.sid');
    return res.json({ ok: true, message: 'Sesión cerrada correctamente.' });
  });
}

function me(req, res) {
  return res.json({
    ok: true,
    data: { user: req.user }
  });
}

module.exports = {
  login,
  logout,
  me
};
