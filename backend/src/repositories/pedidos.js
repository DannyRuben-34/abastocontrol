const { ejecutar } = require('../config/db');

const aPedido = (r) => r && ({
  id: r.id, clienteId: r.cliente_id, cliente: r.cliente, responsableId: r.responsable_id, ventaId: r.venta_id,
  modalidad: r.modalidad, estado: r.estado, notas: r.notas, fechaCreacion: r.fecha_creacion,
});

const BASE = `SELECT p.*, c.nombre AS cliente FROM pedido p JOIN cliente c ON c.id = p.cliente_id`;

exports.obtener = async (id, conn) => aPedido((await ejecutar(`${BASE} WHERE p.id = ?`, [id], conn))[0]);
exports.listar = async ({ estado }) =>
  (estado
    ? await ejecutar(`${BASE} WHERE p.estado = ? ORDER BY p.id DESC LIMIT 300`, [estado])
    : await ejecutar(`${BASE} ORDER BY p.id DESC LIMIT 300`)).map(aPedido);
exports.crear = async ({ clienteId, responsableId, modalidad, estado, notas }, conn) =>
  (await ejecutar(
    'INSERT INTO pedido (cliente_id, responsable_id, modalidad, estado, notas) VALUES (?, ?, ?, ?, ?)',
    [clienteId, responsableId, modalidad, estado, notas], conn,
  )).insertId;
exports.actualizarEstado = (id, estado, conn) => ejecutar('UPDATE pedido SET estado = ? WHERE id = ?', [estado, id], conn);
exports.vincularVenta = (id, ventaId, conn) => ejecutar('UPDATE pedido SET venta_id = ? WHERE id = ?', [ventaId, id], conn);
