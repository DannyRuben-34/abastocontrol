// RF-15 Bitácora de acciones sobre datos sensibles (OWASP A09).
const { entero } = require('../utils/validar');

function crearBitacoraService({ repos }) {
  async function listar({ limite = 100 } = {}) {
    const n = Math.min(entero(limite, 'limite'), 500);
    return repos.bitacora.listar(n);
  }
  return { listar };
}

module.exports = { crearBitacoraService };
