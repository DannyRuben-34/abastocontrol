class AppError extends Error {
  constructor(status, mensaje, codigo = 'ERROR', detalle = undefined) {
    super(mensaje);
    this.name = 'AppError';
    this.status = status;
    this.codigo = codigo;
    this.detalle = detalle;
  }
}

module.exports = { AppError };
