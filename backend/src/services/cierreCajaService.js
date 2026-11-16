// RF-11 Cierre de caja diario: totales por medio de pago y diferencia con el efectivo contado.
const { AppError } = require('../utils/errors');
const { fecha, decimal, hoy, redondear } = require('../utils/validar');

function agruparTotales(filas) {
  const t = { efectivo: 0, digital: 0, fiado: 0 };
  for (const f of filas) {
    const clave = f.medioPago === 'yape' || f.medioPago === 'plin' ? 'digital' : f.medioPago;
    t[clave] = redondear(t[clave] + Number(f.total));
  }
  return t;
}

function crearCierreCajaService({ repos, ahora = () => new Date() }) {
  async function cerrar({ fecha: f, efectivoContado } = {}, actor) {
    const dia = f ? fecha(f, 'fecha') : hoy(ahora);
    const contado = efectivoContado === undefined || efectivoContado === null
      ? null
      : decimal(efectivoContado, 'efectivoContado');
    if (await repos.cierres.obtenerPorFecha(dia)) {
      throw new AppError(409, 'La caja de ese día ya fue cerrada', 'CAJA_CERRADA');
    }
    const t = agruparTotales(await repos.ventas.totalesPorMedio(dia));
    const diferencia = contado === null ? null : redondear(contado - t.efectivo);
    const cierre = {
      fecha: dia, usuarioId: actor.id,
      totalEfectivo: t.efectivo, totalDigital: t.digital, totalFiado: t.fiado, diferencia,
    };
    const id = await repos.cierres.crear(cierre);
    await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'CAJA_CERRADA', entidad: 'cierre_caja', idEntidad: id });
    return { id, ...cierre, totalDia: redondear(t.efectivo + t.digital + t.fiado) };
  }

  async function listar() {
    return repos.cierres.listar();
  }

  return { cerrar, listar };
}

module.exports = { crearCierreCajaService, agruparTotales };
