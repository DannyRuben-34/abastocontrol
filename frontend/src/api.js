// Cliente de la API REST. El token se guarda en sessionStorage y se envía en cada solicitud.
const CLAVE = 'abasto_token';

export const obtenerToken = () => sessionStorage.getItem(CLAVE);
export const guardarToken = (t) => (t ? sessionStorage.setItem(CLAVE, t) : sessionStorage.removeItem(CLAVE));

export async function api(ruta, { metodo = 'GET', cuerpo } = {}) {
  const respuesta = await fetch(`/api${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(obtenerToken() ? { Authorization: `Bearer ${obtenerToken()}` } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || 'Ocurrió un error');
  return datos;
}
