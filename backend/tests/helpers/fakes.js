// Repositorios y base de datos simulados en memoria para pruebas unitarias (patrón Repository).
const { AppError } = require('../../src/utils/errors');

function crearAlmacen() {
  return {
    seq: { venta: 0, compra: 0, cliente: 1, pedido: 0, cierre: 0, usuario: 2, producto: 3, proveedor: 1 },
    productos: [
      { id: 1, codigo: 'A-1', nombre: 'Arroz 1 kg', categoriaId: 1, precioVenta: 4.5, costo: 3.6, stock: 10, stockMinimo: 3, fechaVencimiento: null, activo: true },
      { id: 2, codigo: 'B-1', nombre: 'Gaseosa 500 ml', categoriaId: 2, precioVenta: 2.5, costo: 1.8, stock: 2, stockMinimo: 5, fechaVencimiento: null, activo: true },
      { id: 3, codigo: 'C-1', nombre: 'Producto inactivo', categoriaId: 1, precioVenta: 1, costo: 0.5, stock: 5, stockMinimo: 1, fechaVencimiento: null, activo: false },
    ],
    clientes: [{ id: 1, nombre: 'Cliente Demo', telefono: '000', consentimientoDatos: true, saldoFiado: 20 }],
    proveedores: [{ id: 1, nombre: 'Proveedor Demo', telefono: '111', activo: true }],
    usuarios: [
      { id: 1, nombre: 'Admin', usuario: 'admin', hash: 'hash:Clave1234', rol: 'admin', activo: true, intentosFallidos: 0 },
      { id: 2, nombre: 'Vendedora', usuario: 'vende', hash: 'hash:Clave1234', rol: 'vendedor', activo: true, intentosFallidos: 0 },
    ],
    ventas: [], detallesVenta: [], compras: [], detallesCompra: [], pedidos: [], cierres: [], bitacora: [], pagos: [],
    totalesDia: [], fallarEn: null,
  };
}

function crearDb(almacen) {
  const db = {
    commits: 0,
    rollbacks: 0,
    async transaction(fn) {
      const copia = JSON.parse(JSON.stringify(almacen));
      try {
        const r = await fn({});
        db.commits += 1;
        return r;
      } catch (e) {
        db.rollbacks += 1;
        Object.assign(almacen, copia); // deshace los cambios de la transacción fallida
        throw e;
      }
    },
  };
  return db;
}

function crearRepos(a) {
  const buscar = (lista, id) => lista.find((x) => x.id === Number(id));
  const fallar = (nombre) => { if (a.fallarEn === nombre) throw new Error(`falla simulada en ${nombre}`); };
  return {
    productos: {
      obtener: async (id) => buscar(a.productos, id),
      obtenerParaActualizar: async (id) => buscar(a.productos, id),
      listar: async () => a.productos.filter((p) => p.activo),
      crear: async (p) => { a.seq.producto += 1; a.productos.push({ id: a.seq.producto, activo: true, ...p }); return a.seq.producto; },
      actualizar: async (id, p) => Object.assign(buscar(a.productos, id), p),
      desactivar: async (id) => { buscar(a.productos, id).activo = false; },
      descontarStock: async (id, cantidad) => {
        const p = buscar(a.productos, id);
        if (p.stock < cantidad) throw new AppError(409, 'Stock insuficiente', 'STOCK_INSUFICIENTE');
        p.stock -= cantidad;
      },
      aumentarStock: async (id, cantidad, costo) => {
        const p = buscar(a.productos, id);
        p.stock += cantidad;
        if (costo !== null && costo !== undefined) p.costo = costo;
      },
      alertasStock: async () => a.productos.filter((p) => p.activo && p.stock <= p.stockMinimo),
    },
    ventas: {
      crear: async (v) => { a.seq.venta += 1; a.ventas.push({ id: a.seq.venta, fecha: '2026-11-16 10:00:00', vendedor: 'Vendedora', estado: 'confirmada', ...v }); return a.seq.venta; },
      agregarDetalles: async (id, lineas) => { fallar('agregarDetalles'); lineas.forEach((l) => a.detallesVenta.push({ ventaId: id, ...l })); },
      obtener: async (id) => buscar(a.ventas, id),
      obtenerParaActualizar: async (id) => buscar(a.ventas, id),
      detalles: async (id) => a.detallesVenta.filter((d) => d.ventaId === Number(id)),
      marcarAnulada: async (id) => { buscar(a.ventas, id).estado = 'anulada'; },
      listar: async () => a.ventas,
      totalesPorMedio: async () => a.totalesDia,
    },
    clientes: {
      obtener: async (id) => buscar(a.clientes, id),
      obtenerParaActualizar: async (id) => buscar(a.clientes, id),
      listar: async () => a.clientes,
      crear: async (c) => { a.seq.cliente += 1; a.clientes.push({ id: a.seq.cliente, saldoFiado: 0, ...c }); return a.seq.cliente; },
      sumarSaldo: async (id, m) => { buscar(a.clientes, id).saldoFiado += m; },
      restarSaldo: async (id, m) => { const c = buscar(a.clientes, id); c.saldoFiado = Math.max(c.saldoFiado - m, 0); },
      registrarPago: async (p) => { a.pagos.push(p); },
    },
    proveedores: {
      obtener: async (id) => buscar(a.proveedores, id),
      listar: async () => a.proveedores.filter((p) => p.activo),
      crear: async (p) => { a.seq.proveedor += 1; a.proveedores.push({ id: a.seq.proveedor, activo: true, ...p }); return a.seq.proveedor; },
      actualizar: async (id, p) => Object.assign(buscar(a.proveedores, id), p),
      desactivar: async (id) => { buscar(a.proveedores, id).activo = false; },
    },
    compras: {
      crear: async (c) => { a.seq.compra += 1; a.compras.push({ id: a.seq.compra, ...c }); return a.seq.compra; },
      agregarDetalles: async (id, lineas) => lineas.forEach((l) => a.detallesCompra.push({ compraId: id, ...l })),
      listar: async () => a.compras,
    },
    pedidos: {
      obtener: async (id) => buscar(a.pedidos, id),
      listar: async ({ estado }) => a.pedidos.filter((p) => !estado || p.estado === estado),
      crear: async (p) => { a.seq.pedido += 1; a.pedidos.push({ id: a.seq.pedido, ...p }); return a.seq.pedido; },
      actualizarEstado: async (id, estado) => { buscar(a.pedidos, id).estado = estado; },
      vincularVenta: async (id, ventaId) => { buscar(a.pedidos, id).ventaId = ventaId; },
    },
    cierres: {
      obtenerPorFecha: async (f) => a.cierres.find((c) => c.fecha === f),
      listar: async () => a.cierres,
      crear: async (c) => { a.seq.cierre += 1; a.cierres.push({ id: a.seq.cierre, ...c }); return a.seq.cierre; },
    },
    usuarios: {
      obtenerPorUsuario: async (u) => a.usuarios.find((x) => x.usuario === u),
      obtener: async (id) => buscar(a.usuarios, id),
      listar: async () => a.usuarios.map(({ hash: _h, ...resto }) => resto),
      crear: async (u) => { a.seq.usuario += 1; a.usuarios.push({ id: a.seq.usuario, activo: true, intentosFallidos: 0, ...u }); return a.seq.usuario; },
      actualizar: async (id, d) => Object.assign(buscar(a.usuarios, id), d),
      registrarFallo: async (id) => { buscar(a.usuarios, id).intentosFallidos += 1; },
      reiniciarIntentos: async (id) => { buscar(a.usuarios, id).intentosFallidos = 0; },
    },
    bitacora: {
      registrar: async (b) => { a.bitacora.push(b); },
      listar: async (limite) => a.bitacora.slice(-limite),
    },
    reportes: {
      ventasPorDia: async () => [{ fecha: '2026-11-15', cantidad: 2, total: 10.5 }, { fecha: '2026-11-16', cantidad: 1, total: 4.5 }],
      inventario: async () => a.productos.filter((p) => p.activo).map((p) => ({ codigo: p.codigo, nombre: p.nombre, stock: p.stock, costo: p.costo, valor: Math.round(p.stock * p.costo * 100) / 100 })),
      masVendidos: async ({ limite }) => [{ codigo: 'A-1', nombre: 'Arroz 1 kg', unidades: 9, monto: 40.5 }].slice(0, limite),
    },
  };
}

const hasher = { hashear: async (c) => `hash:${c}`, comparar: async (c, h) => h === `hash:${c}` };
const tokens = {
  firmar: (d) => `token:${JSON.stringify(d)}`,
  verificar: (t) => { if (!String(t).startsWith('token:')) throw new Error('inválido'); return JSON.parse(t.slice(6)); },
};

function entorno() {
  const almacen = crearAlmacen();
  return { almacen, db: crearDb(almacen), repos: crearRepos(almacen), hasher, tokens };
}

module.exports = { entorno };
