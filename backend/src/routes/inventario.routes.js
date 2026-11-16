// M2 Inventario (RF-03, RF-04, RF-05, RF-06).
const express = require('express');

function inventarioRoutes({ servicios, mw }) {
  const { autenticar, autorizar, ah } = mw;

  const productos = express.Router();
  productos.use(autenticar);
  productos.get('/alertas', ah(async (_req, res) => res.json(await servicios.productos.alertasStock())));
  productos.get('/', ah(async (req, res) => res.json(await servicios.productos.listar({ buscar: req.query.buscar }))));
  productos.post('/', autorizar('admin'), ah(async (req, res) => res.status(201).json(await servicios.productos.crear(req.body, req.usuario))));
  productos.put('/:id', autorizar('admin'), ah(async (req, res) => res.json(await servicios.productos.actualizar(req.params.id, req.body, req.usuario))));
  productos.delete('/:id', autorizar('admin'), ah(async (req, res) => res.json(await servicios.productos.desactivar(req.params.id, req.usuario))));

  const proveedores = express.Router();
  proveedores.use(autenticar);
  proveedores.get('/', ah(async (_req, res) => res.json(await servicios.proveedores.listar())));
  proveedores.post('/', autorizar('admin'), ah(async (req, res) => res.status(201).json(await servicios.proveedores.crear(req.body, req.usuario))));
  proveedores.put('/:id', autorizar('admin'), ah(async (req, res) => res.json(await servicios.proveedores.actualizar(req.params.id, req.body, req.usuario))));
  proveedores.delete('/:id', autorizar('admin'), ah(async (req, res) => res.json(await servicios.proveedores.desactivar(req.params.id, req.usuario))));

  const compras = express.Router();
  compras.use(autenticar);
  compras.get('/', ah(async (_req, res) => res.json(await servicios.compras.listar())));
  compras.post('/', ah(async (req, res) => res.status(201).json(await servicios.compras.registrar(req.body, req.usuario))));

  return { productos, proveedores, compras };
}

module.exports = { inventarioRoutes };
