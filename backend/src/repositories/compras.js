const { ejecutar } = require('../config/db');

exports.crear = async ({ proveedorId, usuarioId, total }, conn) =>
  (await ejecutar('INSERT INTO compra (proveedor_id, usuario_id, total) VALUES (?, ?, ?)', [proveedorId, usuarioId, total], conn)).insertId;

exports.agregarDetalles = async (compraId, lineas, conn) => {
  for (const l of lineas) {
    await ejecutar(
      'INSERT INTO detalle_compra (compra_id, producto_id, cantidad, costo_unitario) VALUES (?, ?, ?, ?)',
      [compraId, l.productoId, l.cantidad, l.costoUnitario], conn,
    );
  }
};

exports.listar = async () =>
  (await ejecutar(
    `SELECT c.id, c.fecha, c.total, p.nombre AS proveedor FROM compra c
       JOIN proveedor p ON p.id = c.proveedor_id ORDER BY c.id DESC LIMIT 200`,
  )).map((f) => ({ id: f.id, fecha: f.fecha, total: f.total, proveedor: f.proveedor }));
