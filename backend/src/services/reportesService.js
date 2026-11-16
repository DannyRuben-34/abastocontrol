// RF-12 reporte de ventas, RF-13 inventario valorizado y más vendidos, RF-14 exportación (CSV para hoja de cálculo).
const { AppError } = require('../utils/errors');
const { fecha, entero, redondear } = require('../utils/validar');

const DIA_MS = 24 * 60 * 60 * 1000;

function validarPeriodo({ desde, hasta }) {
  const d = fecha(desde, 'desde');
  const h = fecha(hasta, 'hasta');
  const dias = (Date.parse(h) - Date.parse(d)) / DIA_MS;
  if (dias < 0) throw new AppError(400, 'La fecha inicial no puede ser posterior a la final', 'DATO_INVALIDO');
  if (dias > 366) throw new AppError(400, 'El periodo no puede superar un año', 'DATO_INVALIDO');
  return { desde: d, hasta: h };
}

function celdaCsv(valor) {
  const s = valor === null || valor === undefined ? '' : String(valor);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function aCsv(filas, columnas) {
  const encabezado = columnas.map((c) => celdaCsv(c.titulo)).join(',');
  const cuerpo = filas.map((f) => columnas.map((c) => celdaCsv(f[c.campo])).join(','));
  return [encabezado, ...cuerpo].join('\n');
}

function crearReportesService({ repos }) {
  async function ventasPorPeriodo(params) {
    const p = validarPeriodo(params);
    const filas = await repos.reportes.ventasPorDia(p);
    const totalGeneral = redondear(filas.reduce((s, f) => s + Number(f.total), 0));
    return { periodo: p, filas, totalGeneral };
  }

  async function inventarioValorizado() {
    const filas = await repos.reportes.inventario();
    const valorTotal = redondear(filas.reduce((s, f) => s + Number(f.valor), 0));
    return { filas, valorTotal };
  }

  async function masVendidos({ desde, hasta, limite = 10 }) {
    const p = validarPeriodo({ desde, hasta });
    const n = Math.min(entero(limite, 'limite'), 100);
    return { periodo: p, filas: await repos.reportes.masVendidos({ ...p, limite: n }) };
  }

  async function exportarCsv(tipo, params) {
    if (tipo === 'ventas') {
      const r = await ventasPorPeriodo(params);
      return aCsv(r.filas, [
        { titulo: 'Fecha', campo: 'fecha' },
        { titulo: 'Cantidad de ventas', campo: 'cantidad' },
        { titulo: 'Total (S/)', campo: 'total' },
      ]);
    }
    if (tipo === 'inventario') {
      const r = await inventarioValorizado();
      return aCsv(r.filas, [
        { titulo: 'Código', campo: 'codigo' },
        { titulo: 'Producto', campo: 'nombre' },
        { titulo: 'Stock', campo: 'stock' },
        { titulo: 'Costo (S/)', campo: 'costo' },
        { titulo: 'Valor (S/)', campo: 'valor' },
      ]);
    }
    throw new AppError(400, 'tipo debe ser ventas o inventario', 'DATO_INVALIDO');
  }

  return { ventasPorPeriodo, inventarioValorizado, masVendidos, exportarCsv };
}

module.exports = { crearReportesService, validarPeriodo, aCsv };
