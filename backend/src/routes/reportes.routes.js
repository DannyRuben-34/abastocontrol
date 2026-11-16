// M4 Reportes (RF-12, RF-13, RF-14).
const express = require('express');

function reportesRoutes({ servicios, mw }) {
  const { autenticar, autorizar, ah } = mw;
  const r = express.Router();
  r.use(autenticar);

  r.get('/ventas', ah(async (req, res) => res.json(await servicios.reportes.ventasPorPeriodo({ desde: req.query.desde, hasta: req.query.hasta }))));
  r.get('/inventario', autorizar('admin'), ah(async (_req, res) => res.json(await servicios.reportes.inventarioValorizado())));
  r.get('/mas-vendidos', autorizar('admin'), ah(async (req, res) =>
    res.json(await servicios.reportes.masVendidos({ desde: req.query.desde, hasta: req.query.hasta, limite: req.query.limite }))));

  // Exportación a hoja de cálculo (CSV con BOM para que Excel respete las tildes).
  r.get('/exportar/:tipo', autorizar('admin'), ah(async (req, res) => {
    const csv = await servicios.reportes.exportarCsv(req.params.tipo, { desde: req.query.desde, hasta: req.query.hasta });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-${req.params.tipo}.csv"`);
    res.send(`\uFEFF${csv}`);
  }));

  return { reportes: r };
}

module.exports = { reportesRoutes };
