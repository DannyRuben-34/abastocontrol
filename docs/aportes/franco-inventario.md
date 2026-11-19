# Revisión técnica — Franco Velasquez Herrera

**Rama:** `docs/franco-inventario`
**RF asignados:** RF-03 (productos), RF-04 (ingreso de mercadería), RF-11 (cierre de caja) y RF-13 (inventario valorizado).

## Archivos revisados

- `backend/src/services/productosService.js`
- `backend/src/services/comprasService.js`
- `backend/src/services/cierreCajaService.js`
- `backend/src/services/reportesService.js`
- Apoyo: `backend/src/repositories/productos.js`, `ventas.js` y `reportes.js` (consultas SQL que usan estos servicios).

## Observación comprobada

**RF-03 Productos.** `validarProducto` valida todos los datos antes de guardar: `precioVenta` debe ser mayor que 0, `stock` y `stockMinimo` no pueden ser negativos y el código admite máximo 30 caracteres. `desactivar` es una baja lógica (`activo = false`), no borra el producto. Crear, actualizar y desactivar registran una acción en la bitácora.

**RF-04 Ingreso de mercadería.** `registrar` ejecuta todo dentro de `db.transaction`: verifica que el proveedor exista y esté activo, rechaza compras sin líneas o con el mismo producto repetido, y exige `costoUnitario` mayor que 0. Después guarda la compra, sus detalles y aumenta el stock de cada producto. Si algo falla, la transacción evita que quede una compra a medias.

**RF-11 Cierre de caja.** `cerrar` agrupa las ventas confirmadas del día en efectivo, digital (Yape y Plin se suman en `digital`) y fiado. Calcula `diferencia = efectivoContado - totalEfectivo`. Si la caja de esa fecha ya fue cerrada, responde error 409 `CAJA_CERRADA`.

**RF-13 Inventario valorizado.** `inventarioValorizado` suma el valor de cada producto activo (`stock * costo`, redondeado a 2 decimales) y devuelve `valorTotal`. Los productos desactivados no entran en el cálculo. El mismo dato se puede exportar a CSV con `exportarCsv('inventario')`.

## Pendiente o mejora

- **Costo del producto:** en `repositories/productos.js`, `aumentarStock` reemplaza el costo por el último `costoUnitario` de la compra. Esto no es un costo promedio, así que el inventario valorizado (RF-13) puede variar si cambia el precio del proveedor. Mejora posible: costo promedio ponderado.
- **Cierre de caja:** `agruparTotales` toma el medio de pago como clave del acumulador; si apareciera un medio distinto de efectivo, yape, plin o fiado, el resultado no sería válido. Conviene validar los medios permitidos.
- **Cierre duplicado:** la verificación `obtenerPorFecha` y la creación del cierre son dos pasos separados. Falta confirmar si la base de datos tiene una restricción única por fecha para evitar cierres duplicados simultáneos.
