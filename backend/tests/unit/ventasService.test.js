const { entorno } = require('../helpers/fakes');
const { crearVentasService } = require('../../src/services/ventasService');

const actor = { id: 2, rol: 'vendedor' };
let e;
let servicio;

beforeEach(() => {
  e = entorno();
  servicio = crearVentasService({ db: e.db, repos: e.repos });
});

describe('RF-07 Registrar venta', () => {
  it('CP-07-01: vender 2 unidades con stock 10 deja el stock en 8 y calcula el total', async () => {
    const venta = await servicio.registrarVenta({ lineas: [{ productoId: 1, cantidad: 2 }], medioPago: 'efectivo' }, actor);
    expect(venta.total).toBe(9);
    expect(e.almacen.productos[0].stock).toBe(8);
    expect(e.almacen.bitacora[0].accion).toBe('VENTA_REGISTRADA');
  });

  it('CP-07-02: vender más que el stock es rechazado y el stock no cambia', async () => {
    await expect(servicio.registrarVenta({ lineas: [{ productoId: 1, cantidad: 11 }], medioPago: 'efectivo' }, actor))
      .rejects.toMatchObject({ status: 409, codigo: 'STOCK_INSUFICIENTE' });
    expect(e.almacen.productos[0].stock).toBe(10);
    expect(e.almacen.ventas).toHaveLength(0);
  });

  it('CP-07-03: una falla al guardar el detalle revierte la venta completa', async () => {
    e.almacen.fallarEn = 'agregarDetalles';
    await expect(servicio.registrarVenta({ lineas: [{ productoId: 1, cantidad: 2 }], medioPago: 'efectivo' }, actor))
      .rejects.toMatchObject({ message: 'falla simulada en agregarDetalles' });
    expect(e.db.rollbacks).toBe(1);
    expect(e.almacen.ventas).toHaveLength(0);
    expect(e.almacen.productos[0].stock).toBe(10);
  });

  it('CP-07-04: vender al fiado sin cliente es rechazado', async () => {
    await expect(servicio.registrarVenta({ lineas: [{ productoId: 1, cantidad: 1 }], medioPago: 'fiado' }, actor))
      .rejects.toMatchObject({ status: 400, codigo: 'CLIENTE_REQUERIDO' });
    expect(e.almacen.productos[0].stock).toBe(10);
  });

  it('venta al fiado con cliente con consentimiento suma al saldo', async () => {
    await servicio.registrarVenta({ lineas: [{ productoId: 1, cantidad: 2 }], medioPago: 'fiado', clienteId: 1 }, actor);
    expect(e.almacen.clientes[0].saldoFiado).toBe(29);
  });

  it('rechaza al cliente sin consentimiento de datos al fiado', async () => {
    e.almacen.clientes[0].consentimientoDatos = false;
    await expect(servicio.registrarVenta({ lineas: [{ productoId: 1, cantidad: 1 }], medioPago: 'fiado', clienteId: 1 }, actor))
      .rejects.toMatchObject({ status: 409, codigo: 'CONSENTIMIENTO_REQUERIDO' });
  });

  it('rechaza un cliente inexistente al fiado', async () => {
    await expect(servicio.registrarVenta({ lineas: [{ productoId: 1, cantidad: 1 }], medioPago: 'fiado', clienteId: 99 }, actor))
      .rejects.toMatchObject({ status: 404 });
  });

  it('une las líneas repetidas para no evadir el control de stock', async () => {
    await expect(servicio.registrarVenta({ lineas: [{ productoId: 1, cantidad: 6 }, { productoId: 1, cantidad: 6 }], medioPago: 'efectivo' }, actor))
      .rejects.toMatchObject({ status: 409 });
  });

  it('rechaza productos inexistentes o inactivos', async () => {
    await expect(servicio.registrarVenta({ lineas: [{ productoId: 99, cantidad: 1 }], medioPago: 'efectivo' }, actor)).rejects.toMatchObject({ status: 404 });
    await expect(servicio.registrarVenta({ lineas: [{ productoId: 3, cantidad: 1 }], medioPago: 'efectivo' }, actor)).rejects.toMatchObject({ status: 404 });
  });

  it('valida medio de pago, líneas y cantidades', async () => {
    await expect(servicio.registrarVenta({ lineas: [{ productoId: 1, cantidad: 1 }], medioPago: 'tarjeta' }, actor)).rejects.toMatchObject({ status: 400 });
    await expect(servicio.registrarVenta({ lineas: [], medioPago: 'efectivo' }, actor)).rejects.toMatchObject({ status: 400 });
    await expect(servicio.registrarVenta({ lineas: [{ productoId: 1, cantidad: 0 }], medioPago: 'efectivo' }, actor)).rejects.toMatchObject({ status: 400 });
    await expect(servicio.registrarVenta({ lineas: [{ productoId: 1, cantidad: 1.5 }], medioPago: 'efectivo' }, actor)).rejects.toMatchObject({ status: 400 });
  });
});

describe('RF-10 Ticket y anulación', () => {
  it('el ticket muestra detalle, total, fecha y vendedor', async () => {
    const venta = await servicio.registrarVenta({ lineas: [{ productoId: 1, cantidad: 2 }, { productoId: 2, cantidad: 1 }], medioPago: 'yape' }, actor);
    const ticket = await servicio.obtenerTicket(venta.id);
    expect(ticket.total).toBe(11.5);
    expect(ticket.lineas).toHaveLength(2);
    expect(ticket.lineas[0].subtotal).toBe(9);
    expect(ticket.vendedor).toBe('Vendedora');
    expect(ticket.fecha).toBeTruthy();
  });

  it('ticket de una venta inexistente da 404', async () => {
    await expect(servicio.obtenerTicket(99)).rejects.toMatchObject({ status: 404 });
  });

  it('anular devuelve el stock y deja registro en la bitácora', async () => {
    const venta = await servicio.registrarVenta({ lineas: [{ productoId: 1, cantidad: 3 }], medioPago: 'efectivo' }, actor);
    await servicio.anular(venta.id, { id: 1, rol: 'admin' });
    expect(e.almacen.productos[0].stock).toBe(10);
    expect(e.almacen.ventas[0].estado).toBe('anulada');
    expect(e.almacen.bitacora.map((b) => b.accion)).toContain('VENTA_ANULADA');
  });

  it('anular una venta al fiado reduce la deuda del cliente', async () => {
    const venta = await servicio.registrarVenta({ lineas: [{ productoId: 1, cantidad: 2 }], medioPago: 'fiado', clienteId: 1 }, actor);
    await servicio.anular(venta.id, { id: 1, rol: 'admin' });
    expect(e.almacen.clientes[0].saldoFiado).toBe(20);
  });

  it('no permite anular dos veces ni anular una venta inexistente', async () => {
    const venta = await servicio.registrarVenta({ lineas: [{ productoId: 1, cantidad: 1 }], medioPago: 'efectivo' }, actor);
    await servicio.anular(venta.id, { id: 1, rol: 'admin' });
    await expect(servicio.anular(venta.id, { id: 1, rol: 'admin' })).rejects.toMatchObject({ status: 409 });
    await expect(servicio.anular(99, { id: 1, rol: 'admin' })).rejects.toMatchObject({ status: 404 });
  });

  it('lista las ventas', async () => {
    await servicio.registrarVenta({ lineas: [{ productoId: 1, cantidad: 1 }], medioPago: 'efectivo' }, actor);
    expect(await servicio.listar({})).toHaveLength(1);
  });
});
