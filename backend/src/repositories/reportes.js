const { ejecutar } = require('../config/db');

exports.ventasPorDia = async ({ desde, hasta }) =>
  (await ejecutar(
    `SELECT DATE(fecha) AS fecha, COUNT(*) AS cantidad, SUM(total) AS total FROM venta
      WHERE estado = 'confirmada' AND fecha >= ? AND fecha < DATE_ADD(?, INTERVAL 1 DAY)
      GROUP BY DATE(fecha) ORDER BY fecha`, [desde, hasta],
  )).map((f) => ({ fecha: f.fecha, cantidad: Number(f.cantidad), total: Number(f.total) }));

exports.inventario = async () =>
  (await ejecutar(
    `SELECT codigo, nombre, stock, costo, ROUND(stock * costo, 2) AS valor FROM producto
      WHERE activo = 1 ORDER BY nombre`,
  )).map((f) => ({ codigo: f.codigo, nombre: f.nombre, stock: f.stock, costo: f.costo, valor: Number(f.valor) }));

exports.masVendidos = async ({ desde, hasta, limite }) => {
  const n = Number(limite) | 0; // validado por el servicio
  return (await ejecutar(
    `SELECT p.codigo, p.nombre, SUM(d.cantidad) AS unidades, SUM(d.cantidad * d.precio_unitario) AS monto
       FROM detalle_venta d JOIN venta v ON v.id = d.venta_id JOIN producto p ON p.id = d.producto_id
      WHERE v.estado = 'confirmada' AND v.fecha >= ? AND v.fecha < DATE_ADD(?, INTERVAL 1 DAY)
      GROUP BY p.id, p.codigo, p.nombre ORDER BY unidades DESC LIMIT ${n}`, [desde, hasta],
  )).map((f) => ({ codigo: f.codigo, nombre: f.nombre, unidades: Number(f.unidades), monto: Number(f.monto) }));
};
