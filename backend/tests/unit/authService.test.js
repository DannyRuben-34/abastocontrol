const { entorno } = require('../helpers/fakes');
const { crearAuthService } = require('../../src/services/authService');

let e;
let auth;

beforeEach(() => {
  e = entorno();
  auth = crearAuthService({ repos: e.repos, hasher: e.hasher, tokens: e.tokens });
});

describe('RF-01 Autenticación', () => {
  it('permite el acceso con credenciales válidas y devuelve un token', async () => {
    const r = await auth.login('admin', 'Clave1234');
    expect(r.usuario.rol).toBe('admin');
    expect(r.token).toContain('token:');
  });

  it('rechaza contraseña incorrecta, cuenta el intento y registra en la bitácora', async () => {
    await expect(auth.login('admin', 'mala')).rejects.toMatchObject({ status: 401 });
    expect(e.almacen.usuarios[0].intentosFallidos).toBe(1);
    expect(e.almacen.bitacora[0].accion).toBe('LOGIN_FALLIDO');
  });

  it('bloquea la cuenta tras 5 intentos fallidos', async () => {
    for (let i = 0; i < 5; i += 1) {
      await expect(auth.login('admin', 'mala')).rejects.toMatchObject({ status: 401 });
    }
    await expect(auth.login('admin', 'Clave1234')).rejects.toMatchObject({ status: 423, codigo: 'CUENTA_BLOQUEADA' });
  });

  it('un acceso correcto reinicia el contador de intentos', async () => {
    await expect(auth.login('admin', 'mala')).rejects.toMatchObject({ status: 401 });
    await auth.login('admin', 'Clave1234');
    expect(e.almacen.usuarios[0].intentosFallidos).toBe(0);
  });

  it('rechaza usuarios inexistentes, inactivos o datos vacíos', async () => {
    await expect(auth.login('nadie', 'x')).rejects.toMatchObject({ status: 401 });
    e.almacen.usuarios[1].activo = false;
    await expect(auth.login('vende', 'Clave1234')).rejects.toMatchObject({ status: 401 });
    await expect(auth.login('', '')).rejects.toMatchObject({ status: 400 });
  });

  it('verifica tokens válidos y rechaza los inválidos', async () => {
    const { token } = await auth.login('vende', 'Clave1234');
    expect(auth.verificar(token).rol).toBe('vendedor');
    expect(() => auth.verificar('basura')).toThrow();
  });
});
