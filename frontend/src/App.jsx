import { useEffect, useState } from 'react';
import { api, guardarToken, obtenerToken } from './api.js';

const soles = (n) => `S/ ${Number(n).toFixed(2)}`;

function Login({ alEntrar }) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');

  async function enviar() {
    try {
      const r = await api('/auth/login', { metodo: 'POST', cuerpo: { usuario, contrasena } });
      guardarToken(r.token);
      alEntrar(r.usuario);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="tarjeta login">
      <h1>AbastoControl</h1>
      <label>Usuario<input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" /></label>
      <label>Contraseña<input type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} autoComplete="current-password" /></label>
      {error && <p className="error">{error}</p>}
      <button onClick={enviar}>Ingresar</button>
    </div>
  );
}

function Ventas() {
  const [productos, setProductos] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [medioPago, setMedioPago] = useState('efectivo');
  const [clienteId, setClienteId] = useState('');
  const [ticket, setTicket] = useState(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => { api(`/productos?buscar=${encodeURIComponent(buscar)}`).then(setProductos).catch((e) => setMensaje(e.message)); }, [buscar]);

  const agregar = (p) => setCarrito((c) => {
    const existe = c.find((l) => l.productoId === p.id);
    return existe
      ? c.map((l) => (l.productoId === p.id ? { ...l, cantidad: l.cantidad + 1 } : l))
      : [...c, { productoId: p.id, nombre: p.nombre, precio: p.precioVenta, cantidad: 1 }];
  });
  const total = carrito.reduce((s, l) => s + l.precio * l.cantidad, 0);

  async function confirmar() {
    setMensaje('');
    try {
      const cuerpo = { medioPago, lineas: carrito.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad })), clienteId: clienteId || undefined };
      const venta = await api('/ventas', { metodo: 'POST', cuerpo });
      setTicket(await api(`/ventas/${venta.id}/ticket`));
      setCarrito([]);
    } catch (e) {
      setMensaje(e.message);
    }
  }

  if (ticket) {
    return (
      <div className="tarjeta ticket">
        <h2>Ticket N.º {ticket.numero}</h2>
        <p>{ticket.fecha} · {ticket.vendedor} · {ticket.medioPago}</p>
        <ul>{ticket.lineas.map((l) => <li key={l.productoId}>{l.cantidad} × {l.nombre} — {soles(l.subtotal)}</li>)}</ul>
        <strong>Total: {soles(ticket.total)}</strong>
        <button onClick={() => setTicket(null)}>Nueva venta</button>
      </div>
    );
  }

  return (
    <div className="dos-columnas">
      <div className="tarjeta">
        <h2>Productos</h2>
        <input placeholder="Buscar por nombre o código" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <ul className="lista">{productos.map((p) => (
          <li key={p.id}><span>{p.nombre} · {soles(p.precioVenta)} · stock {p.stock}</span><button disabled={p.stock < 1} onClick={() => agregar(p)}>Agregar</button></li>
        ))}</ul>
      </div>
      <div className="tarjeta">
        <h2>Venta actual</h2>
        <ul className="lista">{carrito.map((l) => <li key={l.productoId}>{l.cantidad} × {l.nombre} — {soles(l.precio * l.cantidad)}</li>)}</ul>
        <label>Medio de pago
          <select value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
            <option value="efectivo">Efectivo</option><option value="yape">Yape</option><option value="plin">Plin</option><option value="fiado">Fiado</option>
          </select>
        </label>
        {medioPago === 'fiado' && <label>Id de cliente<input value={clienteId} onChange={(e) => setClienteId(e.target.value)} /></label>}
        <strong>Total: {soles(total)}</strong>
        {mensaje && <p className="error">{mensaje}</p>}
        <button disabled={!carrito.length} onClick={confirmar}>Confirmar venta</button>
      </div>
    </div>
  );
}

function Inventario() {
  const [alertas, setAlertas] = useState([]);
  const [productos, setProductos] = useState([]);
  useEffect(() => {
    api('/productos/alertas').then(setAlertas).catch(() => {});
    api('/productos').then(setProductos).catch(() => {});
  }, []);
  return (
    <div className="dos-columnas">
      <div className="tarjeta">
        <h2>Alertas de stock mínimo</h2>
        {alertas.length === 0 ? <p>No hay productos bajo el mínimo.</p> : (
          <ul className="lista">{alertas.map((p) => <li key={p.id}>{p.nombre}: {p.stock} (mínimo {p.stockMinimo})</li>)}</ul>
        )}
      </div>
      <div className="tarjeta">
        <h2>Productos</h2>
        <ul className="lista">{productos.map((p) => <li key={p.id}>{p.codigo} · {p.nombre} · stock {p.stock}</li>)}</ul>
      </div>
    </div>
  );
}

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const cargar = () => api('/pedidos').then(setPedidos).catch(() => {});
  useEffect(() => { cargar(); }, []);
  const avanzar = async (id) => { await api(`/pedidos/${id}/avanzar`, { metodo: 'PATCH' }).catch(() => {}); cargar(); };
  return (
    <div className="tarjeta">
      <h2>Pedidos</h2>
      <ul className="lista">{pedidos.map((p) => (
        <li key={p.id}><span>#{p.id} · {p.cliente} · {p.modalidad} · <b>{p.estado}</b></span>
          {p.estado !== 'entregado' && p.estado !== 'cancelado' && <button onClick={() => avanzar(p.id)}>Avanzar</button>}
        </li>
      ))}</ul>
    </div>
  );
}

function Reportes() {
  const hoy = new Date().toLocaleDateString('en-CA');
  const [desde, setDesde] = useState(hoy.slice(0, 8) + '01');
  const [hasta, setHasta] = useState(hoy);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  async function consultar() {
    setError('');
    try { setDatos(await api(`/reportes/ventas?desde=${desde}&hasta=${hasta}`)); } catch (e) { setError(e.message); }
  }
  return (
    <div className="tarjeta">
      <h2>Reporte de ventas</h2>
      <div className="fila">
        <label>Desde<input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
        <label>Hasta<input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
        <button onClick={consultar}>Consultar</button>
      </div>
      {error && <p className="error">{error}</p>}
      {datos && (
        <>
          <ul className="lista">{datos.filas.map((f) => <li key={f.fecha}>{f.fecha}: {f.cantidad} ventas · {soles(f.total)}</li>)}</ul>
          <strong>Total del periodo: {soles(datos.totalGeneral)}</strong>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [vista, setVista] = useState('ventas');

  useEffect(() => {
    if (obtenerToken()) api('/auth/yo').then((u) => setUsuario({ id: u.id, nombre: u.nombre, rol: u.rol })).catch(() => guardarToken(null));
  }, []);

  if (!usuario) return <Login alEntrar={setUsuario} />;
  const salir = () => { guardarToken(null); setUsuario(null); };
  const vistas = { ventas: <Ventas />, inventario: <Inventario />, pedidos: <Pedidos />, reportes: <Reportes /> };
  return (
    <div className="app">
      <header>
        <strong>AbastoControl</strong>
        <nav>
          {Object.keys(vistas).map((v) => <button key={v} className={v === vista ? 'activo' : ''} onClick={() => setVista(v)}>{v}</button>)}
        </nav>
        <span>{usuario.nombre} ({usuario.rol}) <button onClick={salir}>Salir</button></span>
      </header>
      <main>{vistas[vista]}</main>
    </div>
  );
}
