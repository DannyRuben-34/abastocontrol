// Patrón Chain of Responsibility: autenticación, autorización por rol y manejo de errores encadenados (OWASP A01).
const { AppError } = require('../utils/errors');

function crearMiddleware(authService) {
  function autenticar(req, _res, next) {
    const cabecera = req.headers.authorization || '';
    const [tipo, token] = cabecera.split(' ');
    if (tipo !== 'Bearer' || !token) return next(new AppError(401, 'Falta el token de acceso', 'TOKEN'));
    try {
      req.usuario = authService.verificar(token);
      return next();
    } catch (error) {
      return next(error);
    }
  }

  const autorizar = (...roles) => (req, _res, next) =>
    (roles.includes(req.usuario.rol)
      ? next()
      : next(new AppError(403, 'No tiene permiso para esta operación', 'PROHIBIDO')));

  const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

  return { autenticar, autorizar, ah };
}

function noEncontrado(_req, res) {
  res.status(404).json({ error: 'Ruta no encontrada', codigo: 'NO_ENCONTRADO' });
}

// eslint-disable-next-line no-unused-vars
function manejarErrores(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, codigo: err.codigo, detalle: err.detalle });
  }
  if (err && err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'El registro ya existe', codigo: 'DUPLICADO' });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud no es un JSON válido', codigo: 'DATO_INVALIDO' });
  }
  console.error(err); // el detalle interno solo se registra, no se envía al cliente (OWASP A05)
  return res.status(500).json({ error: 'Error interno del servidor', codigo: 'INTERNO' });
}

module.exports = { crearMiddleware, noEncontrado, manejarErrores };
