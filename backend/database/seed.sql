-- Datos de demostración anonimizados (Ley N.º 29733). No contienen personas reales.
USE abastocontrol;

INSERT INTO categoria (nombre) VALUES ('Abarrotes'), ('Bebidas'), ('Lácteos'), ('Limpieza'), ('Golosinas');

INSERT INTO proveedor (nombre, telefono) VALUES
  ('Distribuidora Andina SAC', '000000001'),
  ('Lácteos del Valle EIRL', '000000002');

INSERT INTO producto (codigo, nombre, categoria_id, precio_venta, costo, stock, stock_minimo) VALUES
  ('ABA-001', 'Arroz extra 1 kg', 1, 4.50, 3.60, 40, 10),
  ('ABA-002', 'Azúcar rubia 1 kg', 1, 4.20, 3.40, 30, 10),
  ('ABA-003', 'Aceite vegetal 1 L', 1, 9.50, 8.00, 24, 8),
  ('BEB-001', 'Gaseosa 500 ml', 2, 2.50, 1.80, 48, 12),
  ('BEB-002', 'Agua mineral 625 ml', 2, 1.50, 0.90, 60, 12),
  ('LAC-001', 'Leche evaporada 400 g', 3, 4.80, 3.90, 36, 12),
  ('LIM-001', 'Detergente 500 g', 4, 6.50, 5.00, 5, 6),
  ('GOL-001', 'Galletas surtidas', 5, 1.20, 0.80, 80, 20);

INSERT INTO cliente (nombre, telefono, consentimiento_datos) VALUES ('Cliente Demo 1', '000000010', 1);
-- El usuario administrador se crea con: npm run crear-admin
