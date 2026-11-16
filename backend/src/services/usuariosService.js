// RF-02 Gestión de usuarios y roles (solo Administrador).
const { AppError } = require('../utils/errors');
const { texto, elegir, entero } = require('../utils/validar');

const ROLES = ['admin', 'vendedor'];

function validarContrasena(c) {
  if (typeof c !== 'string' || c.length < 8 || !/[A-Za-z]/.test(c) || !/\d/.test(c)) {
    throw new AppError(400, 'La contraseña debe tener al menos 8 caracteres, con letras y números', 'DATO_INVALIDO');
  }
  return c;
}

function crearUsuariosService({ repos, hasher }) {
  async function crear(datos, actor) {
    const nombre = texto(datos.nombre, 'nombre', { max: 100 });
    const usuario = texto(datos.usuario, 'usuario', { max: 50 }).toLowerCase();
    if (!/^[a-z0-9._-]{3,50}$/.test(usuario)) {
      throw new AppError(400, 'usuario solo admite letras, números, punto, guion y guion bajo (3 a 50)', 'DATO_INVALIDO');
    }
    const rol = elegir(datos.rol, 'rol', ROLES);
    const hash = await hasher.hashear(validarContrasena(datos.contrasena));
    const id = await repos.usuarios.crear({ nombre, usuario, hash, rol });
    await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'USUARIO_CREADO', entidad: 'usuario', idEntidad: id });
    return { id, nombre, usuario, rol, activo: true };
  }

  async function listar() {
    return repos.usuarios.listar();
  }

  async function actualizar(id, datos, actor) {
    const uid = entero(id, 'id');
    const actual = await repos.usuarios.obtener(uid);
    if (!actual) throw new AppError(404, 'Usuario no encontrado', 'NO_ENCONTRADO');
    const activo = datos.activo === undefined ? actual.activo : Boolean(datos.activo);
    if (uid === actor.id && !activo) {
      throw new AppError(400, 'No puede desactivar su propia cuenta', 'DATO_INVALIDO');
    }
    const nuevo = {
      nombre: datos.nombre === undefined ? actual.nombre : texto(datos.nombre, 'nombre', { max: 100 }),
      rol: datos.rol === undefined ? actual.rol : elegir(datos.rol, 'rol', ROLES),
      activo,
    };
    await repos.usuarios.actualizar(uid, nuevo);
    await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'USUARIO_ACTUALIZADO', entidad: 'usuario', idEntidad: uid });
    return { id: uid, usuario: actual.usuario, ...nuevo };
  }

  async function desbloquear(id, actor) {
    const uid = entero(id, 'id');
    const actual = await repos.usuarios.obtener(uid);
    if (!actual) throw new AppError(404, 'Usuario no encontrado', 'NO_ENCONTRADO');
    await repos.usuarios.reiniciarIntentos(uid);
    await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'USUARIO_DESBLOQUEADO', entidad: 'usuario', idEntidad: uid });
    return { id: uid, desbloqueado: true };
  }

  return { crear, listar, actualizar, desbloquear };
}

module.exports = { crearUsuariosService, validarContrasena, ROLES };
