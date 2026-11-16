// M1 Seguridad y usuarios (RF-01, RF-02, RF-15).
const express = require('express');
const rateLimit = require('express-rate-limit');

function seguridadRoutes({ servicios, mw }) {
  const { autenticar, autorizar, ah } = mw;
  const auth = express.Router();
  const limitador = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

  auth.post('/login', limitador, ah(async (req, res) => {
    res.json(await servicios.auth.login(req.body.usuario, req.body.contrasena));
  }));
  auth.get('/yo', autenticar, (req, res) => res.json(req.usuario));

  const usuarios = express.Router();
  usuarios.use(autenticar, autorizar('admin'));
  usuarios.get('/', ah(async (_req, res) => res.json(await servicios.usuarios.listar())));
  usuarios.post('/', ah(async (req, res) => res.status(201).json(await servicios.usuarios.crear(req.body, req.usuario))));
  usuarios.patch('/:id', ah(async (req, res) => res.json(await servicios.usuarios.actualizar(req.params.id, req.body, req.usuario))));
  usuarios.post('/:id/desbloquear', ah(async (req, res) => res.json(await servicios.usuarios.desbloquear(req.params.id, req.usuario))));

  const bitacora = express.Router();
  bitacora.use(autenticar, autorizar('admin'));
  bitacora.get('/', ah(async (req, res) => res.json(await servicios.bitacora.listar({ limite: req.query.limite }))));

  return { auth, usuarios, bitacora };
}

module.exports = { seguridadRoutes };
