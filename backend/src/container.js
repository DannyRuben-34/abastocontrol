// Composición de dependencias reales (base de datos, bcrypt, JWT) para el servidor.
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./config/db');
const repos = {
  usuarios: require('./repositories/usuarios'),
  bitacora: require('./repositories/bitacora'),
  productos: require('./repositories/productos'),
  proveedores: require('./repositories/proveedores'),
  compras: require('./repositories/compras'),
  clientes: require('./repositories/clientes'),
  ventas: require('./repositories/ventas'),
  pedidos: require('./repositories/pedidos'),
  cierres: require('./repositories/cierres'),
  reportes: require('./repositories/reportes'),
};
const { crearAuthService } = require('./services/authService');
const { crearUsuariosService } = require('./services/usuariosService');
const { crearBitacoraService } = require('./services/bitacoraService');
const { crearProductosService } = require('./services/productosService');
const { crearProveedoresService } = require('./services/proveedoresService');
const { crearComprasService } = require('./services/comprasService');
const { crearClientesService } = require('./services/clientesService');
const { crearVentasService } = require('./services/ventasService');
const { crearPedidosService } = require('./services/pedidosService');
const { crearCierreCajaService } = require('./services/cierreCajaService');
const { crearReportesService } = require('./services/reportesService');

function crearServicios() {
  const secreto = process.env.JWT_SECRET;
  if (!secreto || secreto.length < 32) {
    throw new Error('JWT_SECRET debe definirse en el archivo .env con al menos 32 caracteres');
  }
  const hasher = {
    hashear: (clave) => bcrypt.hash(clave, 12),
    comparar: (clave, hash) => bcrypt.compare(clave, hash),
  };
  const tokens = {
    firmar: (datos) => jwt.sign(datos, secreto, { expiresIn: process.env.JWT_EXPIRA || '2h' }),
    verificar: (token) => jwt.verify(token, secreto),
  };
  return {
    auth: crearAuthService({ repos, hasher, tokens }),
    usuarios: crearUsuariosService({ repos, hasher }),
    bitacora: crearBitacoraService({ repos }),
    productos: crearProductosService({ repos }),
    proveedores: crearProveedoresService({ repos }),
    compras: crearComprasService({ db, repos }),
    clientes: crearClientesService({ db, repos }),
    ventas: crearVentasService({ db, repos }),
    pedidos: crearPedidosService({ repos }),
    cierres: crearCierreCajaService({ repos }),
    reportes: crearReportesService({ repos }),
  };
}

module.exports = { crearServicios };
