const { ejecutar } = require('../config/db');

const aCierre = (r) => r && ({
  id: r.id, fecha: r.fecha, usuarioId: r.usuario_id, totalEfectivo: r.total_efectivo,
  totalDigital: r.total_digital, totalFiado: r.total_fiado, diferencia: r.diferencia,
});

exports.obtenerPorFecha = async (fecha, conn) => aCierre((await ejecutar('SELECT * FROM cierre_caja WHERE fecha = ?', [fecha], conn))[0]);
exports.listar = async () => (await ejecutar('SELECT * FROM cierre_caja ORDER BY fecha DESC LIMIT 100')).map(aCierre);
exports.crear = async (c, conn) =>
  (await ejecutar(
    `INSERT INTO cierre_caja (fecha, usuario_id, total_efectivo, total_digital, total_fiado, diferencia)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [c.fecha, c.usuarioId, c.totalEfectivo, c.totalDigital, c.totalFiado, c.diferencia], conn,
  )).insertId;
