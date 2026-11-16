// RF-09 Clientes y ventas al fiado. Ley N.º 29733: consentimiento, finalidad y minimización (solo nombre y teléfono).
const { AppError } = require('../utils/errors');
const { entero, decimal, texto, redondear } = require('../utils/validar');

function crearClientesService({ db, repos }) {
  async function crear({ nombre, telefono, consentimientoDatos }, actor) {
    if (consentimientoDatos !== true) {
      throw new AppError(400, 'Se requiere el consentimiento del cliente para guardar sus datos (Ley N.º 29733)', 'CONSENTIMIENTO_REQUERIDO');
    }
    const datos = {
      nombre: texto(nombre, 'nombre', { max: 100 }),
      telefono: texto(telefono, 'telefono', { max: 20, requerido: false }),
      consentimientoDatos: true,
    };
    const id = await repos.clientes.crear(datos);
    await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'CLIENTE_CREADO', entidad: 'cliente', idEntidad: id });
    return { id, ...datos, saldoFiado: 0 };
  }

  async function listar() {
    return repos.clientes.listar();
  }

  async function registrarPago(clienteId, monto, actor) {
    const cid = entero(clienteId, 'clienteId');
    const importe = decimal(monto, 'monto', { min: 0, exclusivo: true });
    return db.transaction(async (conn) => {
      const cliente = await repos.clientes.obtenerParaActualizar(cid, conn);
      if (!cliente) throw new AppError(404, 'Cliente no encontrado', 'NO_ENCONTRADO');
      if (importe > cliente.saldoFiado) {
        throw new AppError(400, 'El pago no puede superar el saldo pendiente', 'PAGO_EXCEDE_SALDO', { saldo: cliente.saldoFiado });
      }
      const saldoAnterior = cliente.saldoFiado;
      await repos.clientes.restarSaldo(cid, importe, conn);
      await repos.clientes.registrarPago({ clienteId: cid, usuarioId: actor.id, monto: importe }, conn);
      await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'PAGO_FIADO', entidad: 'cliente', idEntidad: cid }, conn);
      return { clienteId: cid, pagado: importe, saldo: redondear(saldoAnterior - importe) };
    });
  }

  return { crear, listar, registrarPago };
}

module.exports = { crearClientesService };
