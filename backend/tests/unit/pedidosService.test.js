const { entorno } = require('../helpers/fakes');
const { crearPedidosService } = require('../../src/services/pedidosService');
const estadoPedido = require('../../src/domain/estadoPedido');

const actor = { id: 2, rol: 'vendedor' };
let e;
let servicio;

beforeEach(() => {
  e = entorno();
  servicio = crearPedidosService({ repos: e.repos });
});

describe('Estados del pedido (patrón State)', () => {
  it('sigue el orden registrado, en preparación, listo, entregado', () => {
    expect(estadoPedido.siguiente('registrado')).toBe('en_preparacion');
    expect(estadoPedido.siguiente('en_preparacion')).toBe('listo');
    expect(estadoPedido.siguiente('listo')).toBe('entregado');
  });

  it('los estados finales no avanzan ni se cancelan', () => {
    expect(() => estadoPedido.siguiente('entregado')).toThrow();
    expect(() => estadoPedido.siguiente('cancelado')).toThrow();
    expect(() => estadoPedido.validarCancelacion('entregado')).toThrow();
    expect(() => estadoPedido.siguiente('desconocido')).toThrow();
    expect(estadoPedido.validarCancelacion('listo')).toBe('cancelado');
  });
});

describe('RF-08 Pedidos', () => {
  it('crea un pedido registrado con responsable y modalidad', async () => {
    const p = await servicio.crear({ clienteId: 1, modalidad: 'reparto', notas: 'Dos cajas' }, actor);
    expect(p.estado).toBe('registrado');
    expect(p.responsableId).toBe(2);
    expect(p.modalidad).toBe('reparto');
  });

  it('valida cliente y modalidad', async () => {
    await expect(servicio.crear({ clienteId: 99, modalidad: 'recojo' }, actor)).rejects.toMatchObject({ status: 404 });
    await expect(servicio.crear({ clienteId: 1, modalidad: 'volando' }, actor)).rejects.toMatchObject({ status: 400 });
  });

  it('avanza por los estados y luego queda finalizado', async () => {
    const p = await servicio.crear({ clienteId: 1, modalidad: 'recojo' }, actor);
    expect((await servicio.avanzar(p.id, actor)).estado).toBe('en_preparacion');
    expect((await servicio.avanzar(p.id, actor)).estado).toBe('listo');
    expect((await servicio.avanzar(p.id, actor)).estado).toBe('entregado');
    await expect(servicio.avanzar(p.id, actor)).rejects.toMatchObject({ status: 409 });
  });

  it('cancela un pedido antes de la entrega', async () => {
    const p = await servicio.crear({ clienteId: 1, modalidad: 'recojo' }, actor);
    expect((await servicio.cancelar(p.id, actor)).estado).toBe('cancelado');
    await expect(servicio.cancelar(p.id, actor)).rejects.toMatchObject({ status: 409 });
  });

  it('pedido inexistente da 404', async () => {
    await expect(servicio.avanzar(99, actor)).rejects.toMatchObject({ status: 404 });
  });

  it('filtra por estado y valida el filtro', async () => {
    const p = await servicio.crear({ clienteId: 1, modalidad: 'recojo' }, actor);
    await servicio.crear({ clienteId: 1, modalidad: 'recojo' }, actor);
    await servicio.avanzar(p.id, actor);
    expect(await servicio.listar({ estado: 'registrado' })).toHaveLength(1);
    expect(await servicio.listar({})).toHaveLength(2);
    await expect(servicio.listar({ estado: 'otro' })).rejects.toMatchObject({ status: 400 });
  });

  it('vincula una venta existente', async () => {
    const p = await servicio.crear({ clienteId: 1, modalidad: 'recojo' }, actor);
    await expect(servicio.vincularVenta(p.id, 5, actor)).rejects.toMatchObject({ status: 404 });
    e.almacen.ventas.push({ id: 5 });
    expect((await servicio.vincularVenta(p.id, 5, actor)).ventaId).toBe(5);
  });
});
