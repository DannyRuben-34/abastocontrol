// RF-04 Ingreso de mercadería: el stock aumenta según las cantidades de la compra.
const { AppError } = require('../utils/errors');
const { entero, decimal, redondear } = require('../utils/validar');

function validarLineas(lineas) {
  if (!Array.isArray(lineas) || lineas.length === 0) {
    throw new AppError(400, 'La compra debe tener al menos una línea', 'DATO_INVALIDO');
  }
  const vistos = new Set();
  return lineas.map((l) => {
    const productoId = entero(l.productoId, 'productoId');
    if (vistos.has(productoId)) throw new AppError(400, 'No repita el mismo producto en la compra', 'DATO_INVALIDO');
    vistos.add(productoId);
    return {
      productoId,
      cantidad: entero(l.cantidad, 'cantidad'),
      costoUnitario: decimal(l.costoUnitario, 'costoUnitario', { min: 0, exclusivo: true }),
    };
  });
}

function crearComprasService({ db, repos }) {
  async function registrar({ proveedorId, lineas }, actor) {
    const pid = entero(proveedorId, 'proveedorId');
    const detalle = validarLineas(lineas);
    return db.transaction(async (conn) => {
      const proveedor = await repos.proveedores.obtener(pid, conn);
      if (!proveedor || !proveedor.activo) throw new AppError(404, 'Proveedor no encontrado', 'NO_ENCONTRADO');
      let total = 0;
      for (const l of detalle) {
        const producto = await repos.productos.obtenerParaActualizar(l.productoId, conn);
        if (!producto) throw new AppError(404, `Producto ${l.productoId} no encontrado`, 'NO_ENCONTRADO');
        total = redondear(total + l.cantidad * l.costoUnitario);
      }
      const compraId = await repos.compras.crear({ proveedorId: pid, usuarioId: actor.id, total }, conn);
      await repos.compras.agregarDetalles(compraId, detalle, conn);
      for (const l of detalle) {
        await repos.productos.aumentarStock(l.productoId, l.cantidad, l.costoUnitario, conn);
      }
      await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'COMPRA_REGISTRADA', entidad: 'compra', idEntidad: compraId }, conn);
      return { id: compraId, proveedorId: pid, total, lineas: detalle };
    });
  }

  async function listar() {
    return repos.compras.listar();
  }

  return { registrar, listar };
}

module.exports = { crearComprasService, validarLineas };
