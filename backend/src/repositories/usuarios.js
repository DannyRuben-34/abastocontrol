const { ejecutar } = require('../config/db');

const aUsuario = (r) => r && ({
  id: r.id, nombre: r.nombre, usuario: r.usuario, hash: r.hash_contrasena,
  rol: r.rol, activo: !!r.activo, intentosFallidos: r.intentos_fallidos,
});

exports.obtenerPorUsuario = async (usuario, conn) =>
  aUsuario((await ejecutar('SELECT * FROM usuario WHERE usuario = ?', [usuario], conn))[0]);

exports.obtener = async (id, conn) =>
  aUsuario((await ejecutar('SELECT * FROM usuario WHERE id = ?', [id], conn))[0]);

exports.listar = async () => {
  const filas = await ejecutar('SELECT * FROM usuario ORDER BY nombre');
  return filas.map((f) => {
    const { hash: _hash, ...seguro } = aUsuario(f);
    return seguro;
  });
};

exports.crear = async ({ nombre, usuario, hash, rol }, conn) =>
  (await ejecutar('INSERT INTO usuario (nombre, usuario, hash_contrasena, rol) VALUES (?, ?, ?, ?)', [nombre, usuario, hash, rol], conn)).insertId;

exports.actualizar = (id, { nombre, rol, activo }, conn) =>
  ejecutar('UPDATE usuario SET nombre = ?, rol = ?, activo = ? WHERE id = ?', [nombre, rol, activo ? 1 : 0, id], conn);

exports.registrarFallo = (id) => ejecutar('UPDATE usuario SET intentos_fallidos = intentos_fallidos + 1 WHERE id = ?', [id]);
exports.reiniciarIntentos = (id) => ejecutar('UPDATE usuario SET intentos_fallidos = 0 WHERE id = ?', [id]);
