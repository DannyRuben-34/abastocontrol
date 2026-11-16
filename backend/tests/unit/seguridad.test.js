const { entorno } = require('../helpers/fakes');
const { crearUsuariosService, validarContrasena } = require('../../src/services/usuariosService');
const { crearBitacoraService } = require('../../src/services/bitacoraService');

const admin = { id: 1, rol: 'admin' };
let e;
let s;

beforeEach(() => {
  e = entorno();
  s = crearUsuariosService({ repos: e.repos, hasher: e.hasher });
});

describe('RF-02 Usuarios y roles', () => {
  it('crea un usuario con la contraseña guardada como hash', async () => {
    const u = await s.crear({ nombre: 'Nueva Persona', usuario: 'Nueva.P', contrasena: 'Segura2026', rol: 'vendedor' }, admin);
    expect(u.usuario).toBe('nueva.p');
    expect(e.almacen.usuarios[2].hash).toBe('hash:Segura2026');
    expect(e.almacen.usuarios[2].hash).not.toBe('Segura2026');
  });

  it('rechaza contraseñas débiles, usuarios inválidos y roles desconocidos', async () => {
    await expect(s.crear({ nombre: 'A', usuario: 'abc', contrasena: 'corta1', rol: 'vendedor' }, admin)).rejects.toMatchObject({ status: 400 });
    await expect(s.crear({ nombre: 'A', usuario: 'abc', contrasena: 'solo letras largas', rol: 'vendedor' }, admin)).rejects.toMatchObject({ status: 400 });
    await expect(s.crear({ nombre: 'A', usuario: 'a b', contrasena: 'Segura2026', rol: 'vendedor' }, admin)).rejects.toMatchObject({ status: 400 });
    await expect(s.crear({ nombre: 'A', usuario: 'abc', contrasena: 'Segura2026', rol: 'dueño' }, admin)).rejects.toMatchObject({ status: 400 });
    expect(() => validarContrasena('Segura2026')).not.toThrow();
  });

  it('actualiza el rol, impide desactivarse a sí mismo y da 404 si no existe', async () => {
    expect((await s.actualizar(2, { rol: 'admin' }, admin)).rol).toBe('admin');
    await expect(s.actualizar(1, { activo: false }, admin)).rejects.toMatchObject({ status: 400 });
    await expect(s.actualizar(99, {}, admin)).rejects.toMatchObject({ status: 404 });
  });

  it('desbloquea una cuenta y lista usuarios sin exponer el hash', async () => {
    e.almacen.usuarios[1].intentosFallidos = 5;
    await s.desbloquear(2, admin);
    expect(e.almacen.usuarios[1].intentosFallidos).toBe(0);
    await expect(s.desbloquear(99, admin)).rejects.toMatchObject({ status: 404 });
    const lista = await s.listar();
    expect(lista[0].hash).toBe(undefined);
  });
});

describe('RF-15 Bitácora', () => {
  it('lista las acciones registradas con un límite acotado', async () => {
    await s.desbloquear(2, admin);
    const b = crearBitacoraService({ repos: e.repos });
    expect(await b.listar({ limite: 10 })).toHaveLength(1);
    await expect(b.listar({ limite: 0 })).rejects.toMatchObject({ status: 400 });
  });
});
