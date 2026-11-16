// M3 Ventas y pedidos (RF-07, RF-08, RF-09, RF-10, RF-11).
const express = require('express');

function ventasRoutes({ servicios, mw }) {
  const { autenticar, autorizar, ah } = mw;

  const ventas = express.Router();
  ventas.use(autenticar);
  ventas.get('/', ah(async (req, res) => res.json(await servicios.ventas.listar({ desde: req.query.desde, hasta: req.query.hasta }))));
  ventas.post('/', ah(async (req, res) => res.status(201).json(await servicios.ventas.registrarVenta(req.body, req.usuario))));
  ventas.get('/:id/ticket', ah(async (req, res) => res.json(await servicios.ventas.obtenerTicket(req.params.id))));
  ventas.post('/:id/anular', autorizar('admin'), ah(async (req, res) => res.json(await servicios.ventas.anular(req.params.id, req.usuario))));

  const pedidos = express.Router();
  pedidos.use(autenticar);
  pedidos.get('/', ah(async (req, res) => res.json(await servicios.pedidos.listar({ estado: req.query.estado }))));
  pedidos.post('/', ah(async (req, res) => res.status(201).json(await servicios.pedidos.crear(req.body, req.usuario))));
  pedidos.patch('/:id/avanzar', ah(async (req, res) => res.json(await servicios.pedidos.avanzar(req.params.id, req.usuario))));
  pedidos.patch('/:id/cancelar', ah(async (req, res) => res.json(await servicios.pedidos.cancelar(req.params.id, req.usuario))));
  pedidos.patch('/:id/venta', ah(async (req, res) => res.json(await servicios.pedidos.vincularVenta(req.params.id, req.body.ventaId, req.usuario))));

  const clientes = express.Router();
  clientes.use(autenticar);
  clientes.get('/', ah(async (_req, res) => res.json(await servicios.clientes.listar())));
  clientes.post('/', ah(async (req, res) => res.status(201).json(await servicios.clientes.crear(req.body, req.usuario))));
  clientes.post('/:id/pagos', ah(async (req, res) => res.status(201).json(await servicios.clientes.registrarPago(req.params.id, req.body.monto, req.usuario))));

  const cierres = express.Router();
  cierres.use(autenticar);
  cierres.get('/', autorizar('admin'), ah(async (_req, res) => res.json(await servicios.cierres.listar())));
  cierres.post('/', ah(async (req, res) => res.status(201).json(await servicios.cierres.cerrar(req.body, req.usuario))));

  return { ventas, pedidos, clientes, cierres };
}

module.exports = { ventasRoutes };
