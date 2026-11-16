const { ejecutar } = require('../config/db');
const { AppError } = require('../utils/errors');

const aProducto = (r) => r && ({
  id: r.id, codigo: r.codigo, nombre: r.nombre, categoriaId: r.categoria_id, categoria: r.categoria,
  precioVenta: r.precio_venta, costo: r.costo, stock: r.stock, stockMinimo: r.stock_minimo,
  fechaVencimiento: r.fecha_vencimiento, activo: !!r.activo,
});

const BASE = `SELECT p.*, c.nombre AS categoria FROM producto p JOIN categoria c ON c.id = p.categoria_id`;

exports.obtener = async (id, conn) => aProducto((await ejecutar(`${BASE} WHERE p.id = ?`, [id], conn))[0]);

exports.obtenerParaActualizar = async (id, conn) =>
  aProducto((await ejecutar('SELECT *, NULL AS categoria FROM producto WHERE id = ? FOR UPDATE', [id], conn))[0]);

exports.listar = async ({ buscar } = {}) => {
  const filas = buscar
    ? await ejecutar(`${BASE} WHERE p.activo = 1 AND (p.nombre LIKE ? OR p.codigo LIKE ?) ORDER BY p.nombre`, [`%${buscar}%`, `%${buscar}%`])
    : await ejecutar(`${BASE} WHERE p.activo = 1 ORDER BY p.nombre`);
  return filas.map(aProducto);
};

exports.crear = async (p, conn) =>
  (await ejecutar(
    `INSERT INTO producto (codigo, nombre, categoria_id, precio_venta, costo, stock, stock_minimo, fecha_vencimiento)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [p.codigo, p.nombre, p.categoriaId, p.precioVenta, p.costo, p.stock, p.stockMinimo, p.fechaVencimiento], conn,
  )).insertId;

exports.actualizar = (id, p, conn) =>
  ejecutar(
    `UPDATE producto SET codigo = ?, nombre = ?, categoria_id = ?, precio_venta = ?, costo = ?,
            stock = ?, stock_minimo = ?, fecha_vencimiento = ? WHERE id = ?`,
    [p.codigo, p.nombre, p.categoriaId, p.precioVenta, p.costo, p.stock, p.stockMinimo, p.fechaVencimiento, id], conn,
  );

exports.desactivar = (id, conn) => ejecutar('UPDATE producto SET activo = 0 WHERE id = ?', [id], conn);

// Doble control: la condición stock >= cantidad evita stock negativo aunque falle la validación previa.
exports.descontarStock = async (id, cantidad, conn) => {
  const r = await ejecutar('UPDATE producto SET stock = stock - ? WHERE id = ? AND stock >= ?', [cantidad, id, cantidad], conn);
  if (r.affectedRows !== 1) throw new AppError(409, 'Stock insuficiente', 'STOCK_INSUFICIENTE');
};

exports.aumentarStock = (id, cantidad, costo, conn) =>
  ejecutar('UPDATE producto SET stock = stock + ?, costo = COALESCE(?, costo) WHERE id = ?', [cantidad, costo, id], conn);

exports.alertasStock = async () =>
  (await ejecutar(`${BASE} WHERE p.activo = 1 AND p.stock <= p.stock_minimo ORDER BY p.stock ASC, p.nombre`)).map(aProducto);
