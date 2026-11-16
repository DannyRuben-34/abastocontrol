const { entorno } = require('../helpers/fakes');
const { crearClientesService } = require('../../src/services/clientesService');
const { crearCierreCajaService, agruparTotales } = require('../../src/services/cierreCajaService');
const { crearReportesService, validarPeriodo, aCsv } = require('../../src/services/reportesService');

const actor = { id: 2, rol: 'vendedor' };
let e;

beforeEach(() => { e = entorno(); });

describe('RF-09 Clientes y fiado', () => {
  it('exige el consentimiento de datos (Ley 29733)', async () => {
    const s = crearClientesService({ db: e.db, repos: e.repos });
    await expect(s.crear({ nombre: 'Persona', telefono: '1' }, actor)).rejects.toMatchObject({ status: 400, codigo: 'CONSENTIMIENTO_REQUERIDO' });
    const c = await s.crear({ nombre: 'Persona', telefono: '1', consentimientoDatos: true }, actor);
    expect(c.saldoFiado).toBe(0);
    expect((await s.listar()).length).toBe(2);
  });

  it('registra pagos parciales y rechaza pagos mayores a la deuda', async () => {
    const s = crearClientesService({ db: e.db, repos: e.repos });
    const r = await s.registrarPago(1, 5.5, actor);
    expect(r.saldo).toBe(14.5);
    expect(e.almacen.pagos).toHaveLength(1);
    await expect(s.registrarPago(1, 100, actor)).rejects.toMatchObject({ status: 400, codigo: 'PAGO_EXCEDE_SALDO' });
    await expect(s.registrarPago(99, 1, actor)).rejects.toMatchObject({ status: 404 });
    await expect(s.registrarPago(1, 0, actor)).rejects.toMatchObject({ status: 400 });
  });
});

describe('RF-11 Cierre de caja', () => {
  it('calcula los totales por medio de pago y la diferencia con el efectivo contado', async () => {
    e.almacen.totalesDia = [{ medioPago: 'efectivo', total: 50 }, { medioPago: 'yape', total: 20 }, { medioPago: 'plin', total: 5.5 }, { medioPago: 'fiado', total: 9 }];
    const s = crearCierreCajaService({ repos: e.repos, ahora: () => new Date(2026, 10, 16, 20) });
    const c = await s.cerrar({ efectivoContado: 48 }, actor);
    expect(c.fecha).toBe('2026-11-16');
    expect(c.totalEfectivo).toBe(50);
    expect(c.totalDigital).toBe(25.5);
    expect(c.totalFiado).toBe(9);
    expect(c.diferencia).toBe(-2);
    expect(c.totalDia).toBe(84.5);
  });

  it('no permite cerrar dos veces el mismo día y valida los datos', async () => {
    const s = crearCierreCajaService({ repos: e.repos });
    await s.cerrar({ fecha: '2026-11-15' }, actor);
    await expect(s.cerrar({ fecha: '2026-11-15' }, actor)).rejects.toMatchObject({ status: 409, codigo: 'CAJA_CERRADA' });
    await expect(s.cerrar({ fecha: '15-11-2026' }, actor)).rejects.toMatchObject({ status: 400 });
    expect((await s.cerrar({ fecha: '2026-11-14' }, actor)).diferencia).toBeNull();
    expect(await s.listar()).toHaveLength(2);
    expect(agruparTotales([]).efectivo).toBe(0);
  });
});

describe('RF-12, RF-13 y RF-14 Reportes', () => {
  it('el reporte de ventas filtra por periodo y suma el total', async () => {
    const s = crearReportesService({ repos: e.repos });
    const r = await s.ventasPorPeriodo({ desde: '2026-11-01', hasta: '2026-11-30' });
    expect(r.filas).toHaveLength(2);
    expect(r.totalGeneral).toBe(15);
  });

  it('valida el periodo', async () => {
    const s = crearReportesService({ repos: e.repos });
    await expect(s.ventasPorPeriodo({ desde: '2026-11-30', hasta: '2026-11-01' })).rejects.toMatchObject({ status: 400 });
    await expect(s.ventasPorPeriodo({ desde: '2024-01-01', hasta: '2026-11-01' })).rejects.toMatchObject({ status: 400 });
    await expect(s.ventasPorPeriodo({ desde: 'x', hasta: 'y' })).rejects.toMatchObject({ status: 400 });
    expect(validarPeriodo({ desde: '2026-01-01', hasta: '2026-01-02' }).hasta).toBe('2026-01-02');
  });

  it('inventario valorizado y más vendidos', async () => {
    const s = crearReportesService({ repos: e.repos });
    const inv = await s.inventarioValorizado();
    expect(inv.valorTotal).toBe(39.6);
    const top = await s.masVendidos({ desde: '2026-11-01', hasta: '2026-11-30', limite: 5 });
    expect(top.filas[0].unidades).toBe(9);
  });

  it('exporta a CSV con escape correcto y rechaza tipos desconocidos', async () => {
    const s = crearReportesService({ repos: e.repos });
    const csv = await s.exportarCsv('ventas', { desde: '2026-11-01', hasta: '2026-11-30' });
    expect(csv.split('\n')[0]).toBe('Fecha,Cantidad de ventas,Total (S/)');
    expect(csv.split('\n')).toHaveLength(3);
    expect((await s.exportarCsv('inventario', {})).split('\n')[0]).toContain('Producto');
    await expect(s.exportarCsv('otro', {})).rejects.toMatchObject({ status: 400 });
    expect(aCsv([{ a: 'dice "hola", ok', b: null }], [{ titulo: 'A', campo: 'a' }, { titulo: 'B', campo: 'b' }])).toBe('A,B\n"dice ""hola"", ok",');
  });
});
