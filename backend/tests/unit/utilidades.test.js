const v = require('../../src/utils/validar');
const pagos = require('../../src/strategies/pagos');

describe('Validaciones', () => {
  it('entero acepta enteros dentro del mínimo y rechaza el resto', () => {
    expect(v.entero('5', 'x')).toBe(5);
    expect(v.entero(0, 'x', { min: 0 })).toBe(0);
    expect(() => v.entero(0, 'x')).toThrow();
    expect(() => v.entero(1.5, 'x')).toThrow();
    expect(() => v.entero('', 'x')).toThrow();
    expect(() => v.entero(null, 'x')).toThrow();
  });

  it('decimal redondea a 2 decimales y respeta el mínimo', () => {
    expect(v.decimal('3.456', 'x')).toBe(3.46);
    expect(() => v.decimal(0, 'x', { exclusivo: true })).toThrow();
    expect(() => v.decimal(-1, 'x')).toThrow();
    expect(() => v.decimal('abc', 'x')).toThrow();
  });

  it('texto recorta espacios, exige valor y limita la longitud', () => {
    expect(v.texto('  hola ', 'x')).toBe('hola');
    expect(v.texto('', 'x', { requerido: false })).toBeNull();
    expect(() => v.texto('   ', 'x')).toThrow();
    expect(() => v.texto('abcdef', 'x', { max: 3 })).toThrow();
  });

  it('fecha y elegir validan formato y conjunto', () => {
    expect(v.fecha('2026-11-16', 'f')).toBe('2026-11-16');
    expect(() => v.fecha('2026-13-45', 'f')).toThrow();
    expect(() => v.elegir('z', 'x', ['a', 'b'])).toThrow();
    expect(v.elegir('a', 'x', ['a', 'b'])).toBe('a');
    expect(v.redondear(1.005)).toBe(1.01);
    expect(v.hoy(() => new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('Estrategias de pago', () => {
  it('conoce los medios válidos y rechaza los desconocidos', () => {
    expect(pagos.MEDIOS).toContain('yape');
    expect(() => pagos.obtener('cheque')).toThrow();
    expect(pagos.obtener('efectivo')).toBeTruthy();
  });
});
