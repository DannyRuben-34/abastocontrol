// Pruebas de integración de la API con Supertest. Usan servicios reales sobre repositorios en memoria,
// por lo que no necesitan MySQL. (Requiere ejecutar `npm install` primero.)
const request = require('supertest');
const { crearApp } = require('../../src/app');
const { entorno } = require('../helpers/fakes');
const { crearAuthService } = require('../../src/services/authService');
const { crearUsuariosService } = require('../../src/services/usuariosService');
const { crearBitacoraService } = require('../../src/services/bitacoraService');
const { crearProductosService } = require('../../src/services/productosService');
const { crearProveedoresService } = require('../../src/services/proveedoresService');
const { crearComprasService } = require('../../src/services/comprasService');
const { crearClientesService } = require('../../src/services/clientesService');
const { crearVentasService } = require('../../src/services/ventasService');
const { crearPedidosService } = require('../../src/services/pedidosService');
const { crearCierreCajaService } = require('../../src/services/cierreCajaService');
const { crearReportesService } = require('../../src/services/reportesService');

let app;

beforeEach(() => {
  const e = entorno();
  const { db, repos, hasher, tokens } = e;
  const servicios = {
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
  app = crearApp({ servicios });
});

async function token(usuario) {
  const r = await request(app).post('/api/auth/login').send({ usuario, contrasena: 'Clave1234' });
  return `Bearer ${r.body.token}`;
}

describe('API de AbastoControl', () => {
  it('responde el estado de salud', async () => {
    const r = await request(app).get('/api/salud');
    expect(r.status).toBe(200);
  });

  it('rechaza el acceso sin token (A01)', async () => {
    const r = await request(app).get('/api/productos');
    expect(r.status).toBe(401);
  });

  it('inicia sesión y permite consultar productos', async () => {
    const r = await request(app).get('/api/productos').set('Authorization', await token('vende'));
    expect(r.status).toBe(200);
    expect(r.body.length).toBeGreaterThan(0);
  });

  it('un vendedor no accede a usuarios ni crea productos (RF-02)', async () => {
    const t = await token('vende');
    expect((await request(app).get('/api/usuarios').set('Authorization', t)).status).toBe(403);
    expect((await request(app).post('/api/productos').set('Authorization', t).send({})).status).toBe(403);
  });

  it('el administrador crea productos y ve la bitácora', async () => {
    const t = await token('admin');
    const nuevo = { codigo: 'Z-1', nombre: 'Producto nuevo', categoriaId: 1, precioVenta: 3, costo: 2, stock: 4, stockMinimo: 1 };
    expect((await request(app).post('/api/productos').set('Authorization', t).send(nuevo)).status).toBe(201);
    expect((await request(app).get('/api/bitacora').set('Authorization', t)).status).toBe(200);
  });

  it('registra una venta y rechaza la que supera el stock con 409', async () => {
    const t = await token('vende');
    const ok = await request(app).post('/api/ventas').set('Authorization', t)
      .send({ lineas: [{ productoId: 1, cantidad: 2 }], medioPago: 'efectivo' });
    expect(ok.status).toBe(201);
    expect(ok.body.total).toBe(9);
    const mal = await request(app).post('/api/ventas').set('Authorization', t)
      .send({ lineas: [{ productoId: 1, cantidad: 500 }], medioPago: 'efectivo' });
    expect(mal.status).toBe(409);
  });

  it('el login incorrecto devuelve 401 y la ruta desconocida 404', async () => {
    const r = await request(app).post('/api/auth/login').send({ usuario: 'admin', contrasena: 'incorrecta' });
    expect(r.status).toBe(401);
    expect((await request(app).get('/api/nada')).status).toBe(404);
  });

  it('un JSON inválido devuelve 400', async () => {
    const r = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{malo');
    expect(r.status).toBe(400);
  });
});
