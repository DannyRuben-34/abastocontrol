# AbastoControl

Sistema de información web para el control de inventario, ventas, pedidos y reportes de una bodega MYPE (caso verosímil «El Abasto Andino»).
Proyecto final de Ingeniería de Software (SIS021, 2026-II), Universidad Andina del Cusco.

Pila tecnológica: Node.js 20 + Express, MySQL 8, React (Vite), Jest + Supertest, ESLint y GitHub Actions.

## Estructura

```
backend/    API REST (src/), base de datos (database/), pruebas (tests/)
frontend/   Interfaz React (Vite)
docs/       Diagramas UML y ER (PNG y fuentes)
.github/    Flujo de integración continua
```

Arquitectura en capas: rutas → controladores → servicios (reglas de negocio) → repositorios (SQL parametrizado) → MySQL.
Patrones aplicados: Repository, Service Layer, Chain of Responsibility (middleware), State (`src/domain/estadoPedido.js`), Strategy (`src/strategies/pagos.js`) y Singleton (`src/config/db.js`).

## Puesta en marcha

1. Crear la base de datos: ejecutar `backend/database/schema.sql` y luego `backend/database/seed.sql` en MySQL 8.
2. Crear un usuario MySQL con permisos solo sobre `abastocontrol` (no use `root` en la aplicación).
3. En `backend/`: copiar `.env.example` a `.env`, completar los valores (clave JWT de 32 caracteres o más, contraseña de la base y `ADMIN_CONTRASENA` con letras y números) y ejecutar:

```
npm install
npm run crear-admin
npm run dev
```

4. En `frontend/`: `npm install` y `npm run dev` (abre en http://localhost:5173 y envía /api al backend).
5. Después del primer `npm install`, suba `package-lock.json` al repositorio (lo exige `npm ci` en el CI).

## Pruebas y calidad

```
cd backend
npm test        # Jest con cobertura (mínimo 70 %)
npm run lint    # ESLint con complejidad ciclomática máxima de 10
```

Las pruebas unitarias usan repositorios simulados (`tests/helpers/fakes.js`), por lo que no necesitan MySQL. Incluyen los casos CP-07-01 a CP-07-04 del informe.

## Trazabilidad de requerimientos y reparto del equipo

Ramas: `main` (estable), `develop` (integración) y una rama `feature/rf-XX-nombre` por requerimiento, con Pull Request y revisión de otro integrante. Mensajes de commit con prefijo `feat`, `fix`, `test` o `docs`.

| Requerimiento | Archivos principales | Responsable |
| --- | --- | --- |
| RF-01 Inicio de sesión | services/authService.js, routes/seguridad.routes.js | Luza Grajeda |
| RF-02 Usuarios y roles | services/usuariosService.js, middleware/index.js | Luza Grajeda |
| RF-12 Reporte de ventas | services/reportesService.js, repositories/reportes.js | Luza Grajeda |
| RF-15 Bitácora | services/bitacoraService.js, repositories/bitacora.js | Luza Grajeda |
| RF-07 Registrar venta | services/ventasService.js, strategies/pagos.js | Cardenas Del Castillo |
| RF-08 Pedidos con estados | services/pedidosService.js, domain/estadoPedido.js | Cardenas Del Castillo |
| RF-09 Clientes y fiado | services/clientesService.js, repositories/clientes.js | Cardenas Del Castillo |
| RF-03 Productos | services/productosService.js, repositories/productos.js | Velasquez Herrera |
| RF-04 Ingreso de mercadería | services/comprasService.js, repositories/compras.js | Velasquez Herrera |
| RF-11 Cierre de caja | services/cierreCajaService.js, repositories/cierres.js | Velasquez Herrera |
| RF-13 Inventario valorizado y más vendidos | services/reportesService.js | Velasquez Herrera |
| RF-05 Proveedores | services/proveedoresService.js, repositories/proveedores.js | Vargas Torres |
| RF-06 Alertas de stock mínimo | services/productosService.js (alertasStock), frontend Inventario | Vargas Torres |
| RF-10 Ticket de venta | services/ventasService.js (obtenerTicket), frontend Ventas | Vargas Torres |
| RF-14 Exportar reportes | routes/reportes.routes.js (exportar CSV) | Vargas Torres |
| Pruebas del sistema (tester) | tests/, .github/workflows/ci.yml | Vargas Torres |

## Pendiente

- RF-14: la exportación a hoja de cálculo se entrega en CSV (abre en Excel); falta la exportación a PDF.
- Pruebas contra MySQL real, de rendimiento y de seguridad (Unidad III).
- Integración con HTTPS en el despliegue final.
