const { ejecutar } = require('../config/db');

const aProveedor = (r) => r && ({ id: r.id, nombre: r.nombre, telefono: r.telefono, activo: !!r.activo });

exports.obtener = async (id, conn) => aProveedor((await ejecutar('SELECT * FROM proveedor WHERE id = ?', [id], conn))[0]);
exports.listar = async () => (await ejecutar('SELECT * FROM proveedor WHERE activo = 1 ORDER BY nombre')).map(aProveedor);
exports.crear = async ({ nombre, telefono }, conn) =>
  (await ejecutar('INSERT INTO proveedor (nombre, telefono) VALUES (?, ?)', [nombre, telefono], conn)).insertId;
exports.actualizar = (id, { nombre, telefono }, conn) =>
  ejecutar('UPDATE proveedor SET nombre = ?, telefono = ? WHERE id = ?', [nombre, telefono, id], conn);
exports.desactivar = (id, conn) => ejecutar('UPDATE proveedor SET activo = 0 WHERE id = ?', [id], conn);
