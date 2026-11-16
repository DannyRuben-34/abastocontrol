// Patrón State: el estado del pedido define las transiciones permitidas (RF-08).
const { AppError } = require('../utils/errors');

const ORDEN = ['registrado', 'en_preparacion', 'listo', 'entregado'];
const ESTADOS = [...ORDEN, 'cancelado'];

function siguiente(estado) {
  if (estado === 'entregado' || estado === 'cancelado') {
    throw new AppError(409, `Un pedido ${estado} no puede cambiar de estado`, 'ESTADO_FINAL');
  }
  const i = ORDEN.indexOf(estado);
  if (i === -1) throw new AppError(409, 'Estado de pedido desconocido', 'ESTADO_INVALIDO');
  return ORDEN[i + 1];
}

function validarCancelacion(estado) {
  if (estado === 'entregado' || estado === 'cancelado') {
    throw new AppError(409, `Un pedido ${estado} no puede cancelarse`, 'ESTADO_FINAL');
  }
  return 'cancelado';
}

module.exports = { ORDEN, ESTADOS, siguiente, validarCancelacion };
