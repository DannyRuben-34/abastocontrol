// RF-08 Pedidos con estados y modalidad (recojo o reparto).
const { AppError } = require('../utils/errors');
const { entero, texto, elegir } = require('../utils/validar');
const estadoPedido = require('../domain/estadoPedido');

const MODALIDADES = ['recojo', 'reparto'];

function crearPedidosService({ repos }) {
  async function cargar(id) {
    const pid = entero(id, 'id');
    const pedido = await repos.pedidos.obtener(pid);
    if (!pedido) throw new AppError(404, 'Pedido no encontrado', 'NO_ENCONTRADO');
    return pedido;
  }

  async function crear({ clienteId, modalidad, notas }, actor) {
    const cid = entero(clienteId, 'clienteId');
    const cliente = await repos.clientes.obtener(cid);
    if (!cliente) throw new AppError(404, 'Cliente no encontrado', 'NO_ENCONTRADO');
    const datos = {
      clienteId: cid,
      responsableId: actor.id,
      modalidad: elegir(modalidad, 'modalidad', MODALIDADES),
      estado: 'registrado',
      notas: texto(notas, 'notas', { max: 255, requerido: false }),
    };
    const id = await repos.pedidos.crear(datos);
    await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'PEDIDO_CREADO', entidad: 'pedido', idEntidad: id });
    return { id, ...datos };
  }

  async function avanzar(id, actor) {
    const pedido = await cargar(id);
    const nuevo = estadoPedido.siguiente(pedido.estado);
    await repos.pedidos.actualizarEstado(pedido.id, nuevo);
    await repos.bitacora.registrar({ usuarioId: actor.id, accion: `PEDIDO_${nuevo.toUpperCase()}`, entidad: 'pedido', idEntidad: pedido.id });
    return { id: pedido.id, estado: nuevo };
  }

  async function cancelar(id, actor) {
    const pedido = await cargar(id);
    const nuevo = estadoPedido.validarCancelacion(pedido.estado);
    await repos.pedidos.actualizarEstado(pedido.id, nuevo);
    await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'PEDIDO_CANCELADO', entidad: 'pedido', idEntidad: pedido.id });
    return { id: pedido.id, estado: nuevo };
  }

  async function vincularVenta(id, ventaId, actor) {
    const pedido = await cargar(id);
    const vid = entero(ventaId, 'ventaId');
    const venta = await repos.ventas.obtener(vid);
    if (!venta) throw new AppError(404, 'Venta no encontrada', 'NO_ENCONTRADO');
    await repos.pedidos.vincularVenta(pedido.id, vid);
    await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'PEDIDO_VINCULADO', entidad: 'pedido', idEntidad: pedido.id });
    return { id: pedido.id, ventaId: vid };
  }

  async function listar({ estado } = {}) {
    if (estado) elegir(estado, 'estado', estadoPedido.ESTADOS);
    return repos.pedidos.listar({ estado: estado || null });
  }

  return { crear, avanzar, cancelar, vincularVenta, listar };
}

module.exports = { crearPedidosService, MODALIDADES };
