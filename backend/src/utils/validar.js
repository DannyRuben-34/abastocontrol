const { AppError } = require('./errors');

const invalido = (mensaje) => new AppError(400, mensaje, 'DATO_INVALIDO');

function redondear(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function entero(valor, campo, { min = 1 } = {}) {
  const n = Number(valor);
  if (valor === null || valor === undefined || valor === '' || !Number.isInteger(n) || n < min) {
    throw invalido(`${campo} debe ser un entero mayor o igual a ${min}`);
  }
  return n;
}

function decimal(valor, campo, { min = 0, exclusivo = false } = {}) {
  const n = Number(valor);
  const fuera = exclusivo ? n <= min : n < min;
  if (valor === null || valor === undefined || valor === '' || !Number.isFinite(n) || fuera) {
    throw invalido(`${campo} debe ser un número ${exclusivo ? 'mayor' : 'mayor o igual'} a ${min}`);
  }
  return redondear(n);
}

function texto(valor, campo, { max = 120, requerido = true } = {}) {
  const t = typeof valor === 'string' ? valor.trim() : '';
  if (!t && requerido) throw invalido(`${campo} es obligatorio`);
  if (t.length > max) throw invalido(`${campo} no puede superar ${max} caracteres`);
  return t || null;
}

function fecha(valor, campo) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number.isNaN(Date.parse(valor))) {
    throw invalido(`${campo} debe tener el formato AAAA-MM-DD`);
  }
  return valor;
}

function elegir(valor, campo, permitidos) {
  if (!permitidos.includes(valor)) throw invalido(`${campo} debe ser uno de: ${permitidos.join(', ')}`);
  return valor;
}

function hoy(ahora = () => new Date()) {
  return ahora().toLocaleDateString('en-CA');
}

module.exports = { entero, decimal, texto, fecha, elegir, redondear, hoy };
