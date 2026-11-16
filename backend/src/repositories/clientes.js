const { ejecutar } = require('../config/db');

const aCliente = (r) => r && ({
  id: r.id, nombre: r.nombre, telefono: r.telefono,
  consentimientoDatos: !!r.consentimiento_datos, saldoFiado: r.saldo_fiado,
});

exports.obtener = async (id, conn) => aCliente((await ejecutar('SELECT * FROM cliente WHERE id = ?', [id], conn))[0]);
exports.obtenerParaActualizar = async (id, conn) =>
  aCliente((await ejecutar('SELECT * FROM cliente WHERE id = ? FOR UPDATE', [id], conn))[0]);
exports.listar = async () => (await ejecutar('SELECT * FROM cliente ORDER BY nombre')).map(aCliente);
exports.crear = async ({ nombre, telefono, consentimientoDatos }, conn) =>
  (await ejecutar('INSERT INTO cliente (nombre, telefono, consentimiento_datos) VALUES (?, ?, ?)', [nombre, telefono, consentimientoDatos ? 1 : 0], conn)).insertId;
exports.sumarSaldo = (id, monto, conn) => ejecutar('UPDATE cliente SET saldo_fiado = saldo_fiado + ? WHERE id = ?', [monto, id], conn);
exports.restarSaldo = (id, monto, conn) => ejecutar('UPDATE cliente SET saldo_fiado = GREATEST(saldo_fiado - ?, 0) WHERE id = ?', [monto, id], conn);
exports.registrarPago = ({ clienteId, usuarioId, monto }, conn) =>
  ejecutar('INSERT INTO pago_fiado (cliente_id, usuario_id, monto) VALUES (?, ?, ?)', [clienteId, usuarioId, monto], conn);
