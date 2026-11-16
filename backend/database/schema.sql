-- AbastoControl: esquema de base de datos (MySQL 8). Modelo normalizado hasta 3FN.
CREATE DATABASE IF NOT EXISTS abastocontrol CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE abastocontrol;

CREATE TABLE IF NOT EXISTS usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  hash_contrasena VARCHAR(100) NOT NULL,
  rol ENUM('admin','vendedor') NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  intentos_fallidos INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS producto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  categoria_id INT NOT NULL,
  precio_venta DECIMAL(10,2) NOT NULL CHECK (precio_venta > 0),
  costo DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (costo >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo INT NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  fecha_vencimiento DATE NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categoria(id),
  INDEX idx_producto_nombre (nombre)
);

CREATE TABLE IF NOT EXISTS proveedor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS compra (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proveedor_id INT NOT NULL,
  usuario_id INT NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_compra_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedor(id),
  CONSTRAINT fk_compra_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

CREATE TABLE IF NOT EXISTS detalle_compra (
  compra_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  costo_unitario DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (compra_id, producto_id),
  CONSTRAINT fk_dc_compra FOREIGN KEY (compra_id) REFERENCES compra(id),
  CONSTRAINT fk_dc_producto FOREIGN KEY (producto_id) REFERENCES producto(id)
);

CREATE TABLE IF NOT EXISTS cliente (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NULL,
  consentimiento_datos TINYINT(1) NOT NULL DEFAULT 0,  -- Ley N.º 29733
  saldo_fiado DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (saldo_fiado >= 0)
);

CREATE TABLE IF NOT EXISTS venta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  cliente_id INT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  medio_pago ENUM('efectivo','yape','plin','fiado') NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  estado ENUM('confirmada','anulada') NOT NULL DEFAULT 'confirmada',
  CONSTRAINT fk_venta_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
  CONSTRAINT fk_venta_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id),
  INDEX idx_venta_fecha (fecha)
);

CREATE TABLE IF NOT EXISTS detalle_venta (
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (venta_id, producto_id),
  CONSTRAINT fk_dv_venta FOREIGN KEY (venta_id) REFERENCES venta(id),
  CONSTRAINT fk_dv_producto FOREIGN KEY (producto_id) REFERENCES producto(id)
);

CREATE TABLE IF NOT EXISTS pedido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  responsable_id INT NOT NULL,
  venta_id INT NULL,
  modalidad ENUM('recojo','reparto') NOT NULL,
  estado ENUM('registrado','en_preparacion','listo','entregado','cancelado') NOT NULL DEFAULT 'registrado',
  notas VARCHAR(255) NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id),
  CONSTRAINT fk_pedido_usuario FOREIGN KEY (responsable_id) REFERENCES usuario(id),
  CONSTRAINT fk_pedido_venta FOREIGN KEY (venta_id) REFERENCES venta(id),
  INDEX idx_pedido_estado (estado)
);

CREATE TABLE IF NOT EXISTS pago_fiado (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  usuario_id INT NOT NULL,
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pf_cliente FOREIGN KEY (cliente_id) REFERENCES cliente(id),
  CONSTRAINT fk_pf_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

CREATE TABLE IF NOT EXISTS cierre_caja (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  usuario_id INT NOT NULL,
  total_efectivo DECIMAL(10,2) NOT NULL,
  total_digital DECIMAL(10,2) NOT NULL,
  total_fiado DECIMAL(10,2) NOT NULL,
  diferencia DECIMAL(10,2) NULL,
  CONSTRAINT fk_cierre_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

CREATE TABLE IF NOT EXISTS bitacora (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accion VARCHAR(50) NOT NULL,
  entidad VARCHAR(40) NOT NULL,
  id_entidad INT NOT NULL,
  CONSTRAINT fk_bitacora_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);
