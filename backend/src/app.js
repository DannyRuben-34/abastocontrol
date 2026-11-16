// Fábrica de la aplicación Express. Recibe los servicios para poder probarla con servicios simulados.
const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { crearMiddleware, noEncontrado, manejarErrores } = require('./middleware');
const { seguridadRoutes } = require('./routes/seguridad.routes');
const { inventarioRoutes } = require('./routes/inventario.routes');
const { ventasRoutes } = require('./routes/ventas.routes');
const { reportesRoutes } = require('./routes/reportes.routes');

function crearApp({ servicios }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  const origenes = (process.env.CORS_ORIGIN || '').split(',').filter(Boolean);
  app.use(cors({ origin: origenes.length ? origenes : false }));
  app.use(express.json({ limit: '100kb' }));

  const mw = crearMiddleware(servicios.auth);
  const ctx = { servicios, mw };
  const seg = seguridadRoutes(ctx);
  const inv = inventarioRoutes(ctx);
  const ven = ventasRoutes(ctx);
  const rep = reportesRoutes(ctx);

  app.get('/api/salud', (_req, res) => res.json({ estado: 'ok' }));
  app.use('/api/auth', seg.auth);
  app.use('/api/usuarios', seg.usuarios);
  app.use('/api/bitacora', seg.bitacora);
  app.use('/api/productos', inv.productos);
  app.use('/api/proveedores', inv.proveedores);
  app.use('/api/compras', inv.compras);
  app.use('/api/ventas', ven.ventas);
  app.use('/api/pedidos', ven.pedidos);
  app.use('/api/clientes', ven.clientes);
  app.use('/api/cierres', ven.cierres);
  app.use('/api/reportes', rep.reportes);

  // Si existe la compilación del frontend, se sirve desde el mismo servidor.
  const dist = path.join(__dirname, '..', '..', 'frontend', 'dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use('/api', noEncontrado);
  app.use(manejarErrores);
  return app;
}

module.exports = { crearApp };
