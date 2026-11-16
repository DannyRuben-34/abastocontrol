// Patrón Strategy: cada medio de pago aplica su propia regla al registrar la venta (RF-07, RF-09).
const { AppError } = require('../utils/errors');

const sinRegla = { async validar() {}, async aplicar() {} };

const fiado = {
  async validar({ clienteId }, { repos, conn }) {
    if (!clienteId) throw new AppError(400, 'La venta al fiado requiere seleccionar un cliente', 'CLIENTE_REQUERIDO');
    const cliente = await repos.clientes.obtener(clienteId, conn);
    if (!cliente) throw new AppError(404, 'Cliente no encontrado', 'NO_ENCONTRADO');
    if (!cliente.consentimientoDatos) {
      throw new AppError(409, 'El cliente no tiene consentimiento de datos registrado', 'CONSENTIMIENTO_REQUERIDO');
    }
  },
  async aplicar({ clienteId, total }, { repos, conn }) {
    await repos.clientes.sumarSaldo(clienteId, total, conn);
  },
};

const estrategias = { efectivo: sinRegla, yape: sinRegla, plin: sinRegla, fiado };
const MEDIOS = Object.keys(estrategias);

function obtener(medioPago) {
  const e = estrategias[medioPago];
  if (!e) throw new AppError(400, `medioPago debe ser uno de: ${MEDIOS.join(', ')}`, 'DATO_INVALIDO');
  return e;
}

module.exports = { MEDIOS, obtener };
