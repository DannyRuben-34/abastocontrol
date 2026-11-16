const { ejecutar } = require('../config/db');

const aVenta = (r) => r && ({
  id: r.id, fecha: r.fecha, usuarioId: r.usuario_id, vendedor: r.vendedor, clienteId: r.cliente_id,
  medioPago: r.medio_pago, total: r.total, estado: r.estado,
});

const BASE = `SELECT v.*, u.nombre AS vendedor FROM venta v JOIN usuario u ON u.id = v.usuario_id`;

exports.crear = async ({ usuarioId, clienteId, medioPago, total }, conn) =>
  (await ejecutar('INSERT INTO venta (usuario_id, cliente_id, medio_pago, total) VALUES (?, ?, ?, ?)', [usuarioId, clienteId, medioPago, total], conn)).insertId;

exports.agregarDetalles = async (ventaId, lineas, conn) => {
  for (const l of lineas) {
    await ejecutar(
      'INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
      [ventaId, l.productoId, l.cantidad, l.precioUnitario], conn,
    );
  }
};

exports.obtener = async (id, conn) => aVenta((await ejecutar(`${BASE} WHERE v.id = ?`, [id], conn))[0]);
exports.obtenerParaActualizar = async (id, conn) =>
  aVenta((await ejecutar('SELECT *, NULL AS vendedor FROM venta WHERE id = ? FOR UPDATE', [id], conn))[0]);

exports.detalles = async (ventaId, conn) =>
  (await ejecutar(
    `SELECT d.producto_id, p.nombre, d.cantidad, d.precio_unitario FROM detalle_venta d
       JOIN producto p ON p.id = d.producto_id WHERE d.venta_id = ?`, [ventaId], conn,
  )).map((f) => ({ productoId: f.producto_id, nombre: f.nombre, cantidad: f.cantidad, precioUnitario: f.precio_unitario }));

exports.marcarAnulada = (id, conn) => ejecutar("UPDATE venta SET estado = 'anulada' WHERE id = ?", [id], conn);

exports.listar = async ({ desde, hasta }) => {
  const d = desde || '1970-01-01';
  const h = hasta || '2999-12-31';
  return (await ejecutar(
    `${BASE} WHERE v.fecha >= ? AND v.fecha < DATE_ADD(?, INTERVAL 1 DAY) ORDER BY v.id DESC LIMIT 500`, [d, h],
  )).map(aVenta);
};

exports.totalesPorMedio = async (dia) =>
  (await ejecutar(
    `SELECT medio_pago, SUM(total) AS total FROM venta
      WHERE estado = 'confirmada' AND fecha >= ? AND fecha < DATE_ADD(?, INTERVAL 1 DAY) GROUP BY medio_pago`, [dia, dia],
  )).map((f) => ({ medioPago: f.medio_pago, total: Number(f.total) }));
