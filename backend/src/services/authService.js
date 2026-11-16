// RF-01 Autenticación. Bloqueo tras 5 intentos fallidos (OWASP A07).
const { AppError } = require('../utils/errors');

const MAX_INTENTOS = 5;

function crearAuthService({ repos, hasher, tokens }) {
  async function login(usuario, contrasena) {
    if (!usuario || !contrasena) {
      throw new AppError(400, 'Usuario y contraseña son obligatorios', 'DATO_INVALIDO');
    }
    const u = await repos.usuarios.obtenerPorUsuario(usuario);
    if (!u || !u.activo) throw new AppError(401, 'Credenciales inválidas', 'CREDENCIALES');
    if (u.intentosFallidos >= MAX_INTENTOS) {
      throw new AppError(423, 'Cuenta bloqueada por intentos fallidos. Contacte al administrador', 'CUENTA_BLOQUEADA');
    }
    const correcta = await hasher.comparar(contrasena, u.hash);
    if (!correcta) {
      await repos.usuarios.registrarFallo(u.id);
      await repos.bitacora.registrar({ usuarioId: u.id, accion: 'LOGIN_FALLIDO', entidad: 'usuario', idEntidad: u.id });
      throw new AppError(401, 'Credenciales inválidas', 'CREDENCIALES');
    }
    await repos.usuarios.reiniciarIntentos(u.id);
    const token = tokens.firmar({ sub: u.id, rol: u.rol, nombre: u.nombre });
    return { token, usuario: { id: u.id, nombre: u.nombre, rol: u.rol } };
  }

  function verificar(token) {
    try {
      const datos = tokens.verificar(token);
      return { id: datos.sub, rol: datos.rol, nombre: datos.nombre };
    } catch (_e) {
      throw new AppError(401, 'Token inválido o vencido', 'TOKEN');
    }
  }

  return { login, verificar, MAX_INTENTOS };
}

module.exports = { crearAuthService, MAX_INTENTOS };
