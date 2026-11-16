// RF-05 Gestión de proveedores (baja lógica).
const { AppError } = require('../utils/errors');
const { entero, texto } = require('../utils/validar');

function crearProveedoresService({ repos }) {
  const validar = (d) => ({
    nombre: texto(d.nombre, 'nombre', { max: 100 }),
    telefono: texto(d.telefono, 'telefono', { max: 20, requerido: false }),
  });

  async function crear(datos, actor) {
    const p = validar(datos);
    const id = await repos.proveedores.crear(p);
    await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'PROVEEDOR_CREADO', entidad: 'proveedor', idEntidad: id });
    return { id, ...p, activo: true };
  }

  async function actualizar(id, datos, actor) {
    const pid = entero(id, 'id');
    const actual = await repos.proveedores.obtener(pid);
    if (!actual) throw new AppError(404, 'Proveedor no encontrado', 'NO_ENCONTRADO');
    const p = validar({ ...actual, ...datos });
    await repos.proveedores.actualizar(pid, p);
    await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'PROVEEDOR_ACTUALIZADO', entidad: 'proveedor', idEntidad: pid });
    return { id: pid, ...p, activo: actual.activo };
  }

  async function desactivar(id, actor) {
    const pid = entero(id, 'id');
    const actual = await repos.proveedores.obtener(pid);
    if (!actual) throw new AppError(404, 'Proveedor no encontrado', 'NO_ENCONTRADO');
    await repos.proveedores.desactivar(pid);
    await repos.bitacora.registrar({ usuarioId: actor.id, accion: 'PROVEEDOR_DESACTIVADO', entidad: 'proveedor', idEntidad: pid });
    return { id: pid, activo: false };
  }

  async function listar() {
    return repos.proveedores.listar();
  }

  return { crear, actualizar, desactivar, listar };
}

module.exports = { crearProveedoresService };
