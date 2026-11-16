// RF-07 Registrar venta (transacción), RF-10 ticket y anulación con bitácora.
const { AppError } = require('../utils/errors');
const { entero, redondear } = require('../utils/validar');
const pagos = require('../strategies/pagos');

// Une las líneas repetidas de un mismo producto para que el control de stock no se evada.
function consolidarLineas(lineas) {
  if (!Array.isArray(lineas) || lineas.length === 0) {
    throw new AppError(400, 'La venta debe tener al menos una línea', 'DATO_INVALIDO');
  }
  const porProducto = new Map();
  for (const l of lineas) {
    const productoId = entero(l.productoId, 'productoId');
    const cantidad = entero(l.cantidad, 'cantidad');
    porProducto.set(productoId, (porProducto.get(productoId) || 0) + cantidad);
  }
  return [...porProducto].map(([productoId, cantidad]) => ({ productoId, cantidad }));
}

function crearVentasService({ db, repos }) {
  async function registrarVenta({ lineas, medioPago, clienteId }, actor) {
    const pedidas = consolidarLineas(lineas);
    const estrategia = pagos.obtener(medioPago);
    const cid = clienteId ? entero(clienteId, 'clienteId') : null;

    return db.transaction(async (conn) => {
      let total = 0;
      const detalle = [];
      for (const l of pedidas) {
        const p = await repos.productos.obtenerParaActualizar(l.productoId, conn);
        if (!p || !p.activo) throw new AppError(404, `Producto ${l.productoId} no encontrado`, 'NO_ENCONTRADO');
        if (l.cantidad > p.stock) {
          throw new AppError(409, `Stock insuficiente de ${p.nombre}`, 'STOCK_INSUFICIENTE', { disponible: p.stock });
        }
        detalle.push({ productoId: p.id, nombre: p.nombre, cantidad: l.cantidad, precioUnitario: p.precioVenta });
        total = redondear(total + p.precioVenta * l.cantidad);
      }
      const contexto = { repos, conn };
      await estrategia.validar({ clienteId: cid, total }, contexto);

      const ventaId = await repos.ventas.crear({ usuarioId: actor.id, clienteId: cid, medioPago, total }, conn);
      await repos.ventas.agregarDetalles(ventaId, detalle, conn);
      for (const d of detalle) {
        await repos.productos.descontarStock(d.productoId, d.cantidad, conn);
      }
      await estrategia.aplicar({ clienteId: cid, total }, contexto);
      await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'VENTA_REGISTRADA', entidad: 'venta', idEntidad: ventaId }, conn);
      return { id: ventaId, total, medioPago, clienteId: cid, lineas: detalle };
    });
  }

  async function obtenerTicket(id) {
    const vid = entero(id, 'id');
    const venta = await repos.ventas.obtener(vid);
    if (!venta) throw new AppError(404, 'Venta no encontrada', 'NO_ENCONTRADO');
    const lineas = await repos.ventas.detalles(vid);
    return {
      numero: venta.id,
      fecha: venta.fecha,
      vendedor: venta.vendedor,
      medioPago: venta.medioPago,
      estado: venta.estado,
      lineas: lineas.map((l) => ({ ...l, subtotal: redondear(l.cantidad * l.precioUnitario) })),
      total: venta.total,
    };
  }

  async function anular(id, actor) {
    const vid = entero(id, 'id');
    return db.transaction(async (conn) => {
      const venta = await repos.ventas.obtenerParaActualizar(vid, conn);
      if (!venta) throw new AppError(404, 'Venta no encontrada', 'NO_ENCONTRADO');
      if (venta.estado === 'anulada') throw new AppError(409, 'La venta ya está anulada', 'ESTADO_FINAL');
      const lineas = await repos.ventas.detalles(vid, conn);
      for (const l of lineas) {
        await repos.productos.aumentarStock(l.productoId, l.cantidad, null, conn);
      }
      if (venta.medioPago === 'fiado' && venta.clienteId) {
        await repos.clientes.restarSaldo(venta.clienteId, venta.total, conn);
      }
      await repos.ventas.marcarAnulada(vid, conn);
      await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'VENTA_ANULADA', entidad: 'venta', idEntidad: vid }, conn);
      return { id: vid, estado: 'anulada' };
    });
  }

  async function listar({ desde, hasta } = {}) {
    return repos.ventas.listar({ desde: desde || null, hasta: hasta || null });
  }

  return { registrarVenta, obtenerTicket, anular, listar };
}

module.exports = { crearVentasService, consolidarLineas };
