const { ejecutar } = require('../config/db');

exports.registrar = ({ usuarioId, accion, entidad, idEntidad }, conn) =>
  ejecutar('INSERT INTO bitacora (usuario_id, accion, entidad, id_entidad) VALUES (?, ?, ?, ?)', [usuarioId, accion, entidad, idEntidad], conn);

exports.listar = async (limite) => {
  const n = Number(limite) | 0; // entero validado por el servicio; LIMIT no admite parámetros preparados
  const filas = await ejecutar(
    `SELECT b.id, b.fecha, b.accion, b.entidad, b.id_entidad, u.usuario
       FROM bitacora b JOIN usuario u ON u.id = b.usuario_id
      ORDER BY b.id DESC LIMIT ${n}`,
  );
  return filas.map((f) => ({ id: f.id, fecha: f.fecha, accion: f.accion, entidad: f.entidad, idEntidad: f.id_entidad, usuario: f.usuario }));
};
