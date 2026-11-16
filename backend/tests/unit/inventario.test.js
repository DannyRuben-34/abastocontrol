const { entorno } = require('../helpers/fakes');
const { crearProductosService } = require('../../src/services/productosService');
const { crearProveedoresService } = require('../../src/services/proveedoresService');
const { crearComprasService } = require('../../src/services/comprasService');

const admin = { id: 1, rol: 'admin' };
let e;

beforeEach(() => { e = entorno(); });

describe('RF-03 Productos', () => {
  it('crea un producto válido y registra la bitácora', async () => {
    const s = crearProductosService({ repos: e.repos });
    const p = await s.crear({ codigo: 'N-1', nombre: 'Fideos 500 g', categoriaId: 1, precioVenta: 3.2, costo: 2.5, stock: 20, stockMinimo: 5 }, admin);
    expect(p.id).toBeGreaterThan(0);
    expect(e.almacen.bitacora[0].accion).toBe('PRODUCTO_CREADO');
  });

  it('rechaza datos inválidos', async () => {
    const s = crearProductosService({ repos: e.repos });
    const base = { codigo: 'N-2', nombre: 'X', categoriaId: 1, precioVenta: 3, costo: 1, stock: 1, stockMinimo: 1 };
    await expect(s.crear({ ...base, precioVenta: 0 }, admin)).rejects.toMatchObject({ status: 400 });
    await expect(s.crear({ ...base, nombre: '' }, admin)).rejects.toMatchObject({ status: 400 });
    await expect(s.crear({ ...base, stock: -1 }, admin)).rejects.toMatchObject({ status: 400 });
    await expect(s.crear({ ...base, fechaVencimiento: '31/12/2026' }, admin)).rejects.toMatchObject({ status: 400 });
    await expect(s.crear({ ...base, codigo: 'x'.repeat(31) }, admin)).rejects.toMatchObject({ status: 400 });
  });

  it('actualiza, desactiva y da 404 si no existe', async () => {
    const s = crearProductosService({ repos: e.repos });
    const p = await s.actualizar(1, { precioVenta: 5 }, admin);
    expect(p.precioVenta).toBe(5);
    expect((await s.desactivar(1, admin)).activo).toBe(false);
    await expect(s.actualizar(99, {}, admin)).rejects.toMatchObject({ status: 404 });
    await expect(s.desactivar(99, admin)).rejects.toMatchObject({ status: 404 });
  });

  it('RF-06: la alerta lista los productos en o bajo el stock mínimo', async () => {
    const s = crearProductosService({ repos: e.repos });
    const alertas = await s.alertasStock();
    expect(alertas).toHaveLength(1);
    expect(alertas[0].nombre).toBe('Gaseosa 500 ml');
    expect((await s.listar({ buscar: 'arroz' })).length).toBeGreaterThan(0);
  });
});

describe('RF-05 Proveedores', () => {
  it('crea, actualiza y desactiva con baja lógica', async () => {
    const s = crearProveedoresService({ repos: e.repos });
    const p = await s.crear({ nombre: 'Nuevo Proveedor', telefono: '222' }, admin);
    expect(p.activo).toBe(true);
    expect((await s.actualizar(p.id, { telefono: '333' }, admin)).telefono).toBe('333');
    await s.desactivar(p.id, admin);
    expect((await s.listar()).some((x) => x.id === p.id)).toBe(false);
    await expect(s.actualizar(99, {}, admin)).rejects.toMatchObject({ status: 404 });
    await expect(s.desactivar(99, admin)).rejects.toMatchObject({ status: 404 });
    await expect(s.crear({ nombre: '' }, admin)).rejects.toMatchObject({ status: 400 });
  });
});

describe('RF-04 Ingreso de mercadería', () => {
  it('aumenta el stock según las cantidades de la compra y actualiza el costo', async () => {
    const s = crearComprasService({ db: e.db, repos: e.repos });
    const c = await s.registrar({ proveedorId: 1, lineas: [{ productoId: 1, cantidad: 5, costoUnitario: 3.7 }, { productoId: 2, cantidad: 10, costoUnitario: 1.9 }] }, admin);
    expect(c.total).toBe(37.5);
    expect(e.almacen.productos[0].stock).toBe(15);
    expect(e.almacen.productos[1].stock).toBe(12);
    expect(e.almacen.productos[0].costo).toBe(3.7);
    expect(await s.listar()).toHaveLength(1);
  });

  it('rechaza proveedor inexistente, producto inexistente, líneas repetidas o vacías', async () => {
    const s = crearComprasService({ db: e.db, repos: e.repos });
    const linea = { productoId: 1, cantidad: 1, costoUnitario: 1 };
    await expect(s.registrar({ proveedorId: 99, lineas: [linea] }, admin)).rejects.toMatchObject({ status: 404 });
    await expect(s.registrar({ proveedorId: 1, lineas: [{ ...linea, productoId: 99 }] }, admin)).rejects.toMatchObject({ status: 404 });
    await expect(s.registrar({ proveedorId: 1, lineas: [linea, linea] }, admin)).rejects.toMatchObject({ status: 400 });
    await expect(s.registrar({ proveedorId: 1, lineas: [] }, admin)).rejects.toMatchObject({ status: 400 });
    expect(e.almacen.productos[0].stock).toBe(10);
  });
});
