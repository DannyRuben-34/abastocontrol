// RF-03 Productos y RF-06 alertas de stock mínimo.
const { AppError } = require('../utils/errors');
const { entero, decimal, texto, fecha } = require('../utils/validar');

function validarProducto(d) {
  return {
    codigo: texto(d.codigo, 'codigo', { max: 30 }),
    nombre: texto(d.nombre, 'nombre'),
    categoriaId: entero(d.categoriaId, 'categoriaId'),
    precioVenta: decimal(d.precioVenta, 'precioVenta', { min: 0, exclusivo: true }),
    costo: decimal(d.costo ?? 0, 'costo'),
    stock: entero(d.stock ?? 0, 'stock', { min: 0 }),
    stockMinimo: entero(d.stockMinimo ?? 0, 'stockMinimo', { min: 0 }),
    fechaVencimiento: d.fechaVencimiento ? fecha(d.fechaVencimiento, 'fechaVencimiento') : null,
  };
}

function crearProductosService({ repos }) {
  async function crear(datos, actor) {
    const p = validarProducto(datos);
    const id = await repos.productos.crear(p);
    await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'PRODUCTO_CREADO', entidad: 'producto', idEntidad: id });
    return { id, ...p, activo: true };
  }

  async function actualizar(id, datos, actor) {
    const pid = entero(id, 'id');
    const actual = await repos.productos.obtener(pid);
    if (!actual) throw new AppError(404, 'Producto no encontrado', 'NO_ENCONTRADO');
    const p = validarProducto({ ...actual, ...datos });
    await repos.productos.actualizar(pid, p);
    await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'PRODUCTO_ACTUALIZADO', entidad: 'producto', idEntidad: pid });
    return { id: pid, ...p, activo: actual.activo };
  }

  async function desactivar(id, actor) {
    const pid = entero(id, 'id');
    const actual = await repos.productos.obtener(pid);
    if (!actual) throw new AppError(404, 'Producto no encontrado', 'NO_ENCONTRADO');
    await repos.productos.desactivar(pid);
    await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'PRODUCTO_DESACTIVADO', entidad: 'producto', idEntidad: pid });
    return { id: pid, activo: false };
  }

  async function listar({ buscar } = {}) {
    return repos.productos.listar({ buscar: buscar ? String(buscar).slice(0, 60) : null });
  }

  async function alertasStock() {
    return repos.productos.alertasStock();
  }

  return { crear, actualizar, desactivar, listar, alertasStock };
}

module.exports = { crearProductosService, validarProducto };
