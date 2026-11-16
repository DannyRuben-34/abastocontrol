// Pequeño sustituto de Jest para ejecutar las pruebas unitarias donde Jest no está instalado.
// Uso local: node --test --import ./tests/_shim.js tests/unit/*.test.js
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

global.describe = describe;
global.it = it;
global.beforeEach = beforeEach;

function comparador(valor, negado = false) {
  const chk = (ok, msg) => assert.ok(negado ? !ok : ok, msg);
  const api = {
    toBe: (e) => chk(Object.is(valor, e), `esperaba ${JSON.stringify(valor)} ${negado ? 'distinto de' : 'igual a'} ${JSON.stringify(e)}`),
    toEqual: (e) => { try { assert.deepStrictEqual(valor, e); chk(true); } catch (err) { if (!negado) throw err; } },
    toBeTruthy: () => chk(Boolean(valor), 'esperaba un valor verdadero'),
    toBeFalsy: () => chk(!valor, 'esperaba un valor falso'),
    toBeNull: () => chk(valor === null, 'esperaba null'),
    toBeGreaterThan: (e) => chk(valor > e, `esperaba ${valor} > ${e}`),
    toHaveLength: (e) => chk(valor.length === e, `esperaba longitud ${e} y fue ${valor.length}`),
    toContain: (e) => chk(valor.includes(e), `esperaba que contuviera ${e}`),
    toMatchObject: (e) => { for (const k of Object.keys(e)) assert.deepStrictEqual(valor[k], e[k]); },
    toThrow: () => { let lanzo = false; try { valor(); } catch (_e) { lanzo = true; } chk(lanzo, 'esperaba una excepción'); },
  };
  return api;
}

global.expect = (valor) => {
  const api = comparador(valor);
  api.not = comparador(valor, true);
  api.rejects = {
    toMatchObject: async (e) => {
      let error = null;
      try { await valor; } catch (err) { error = err; }
      assert.ok(error, 'esperaba que la promesa fuera rechazada');
      for (const k of Object.keys(e)) assert.deepStrictEqual(error[k], e[k]);
    },
  };
  return api;
};
