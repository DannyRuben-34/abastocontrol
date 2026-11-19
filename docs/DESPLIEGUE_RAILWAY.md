# Despliegue AbastoControl (VS Code + GitHub + Railway)

> Guia de prueba, no publicada todavia. No subas `.env`, contrasenas, tokens, ni datos reales.
> El despliegue puede consumir creditos o generar cargos segun el plan. Revisa los limites y alertas de gasto de Railway antes de activar servicios.

## 1. Preparar desde Visual Studio Code

Abre la carpeta `E:\abastocontrol` en VS Code. En Terminal:

```powershell
git fetch origin
git switch develop
git pull origin develop
git switch chore/despliegue-railway
git pull origin chore/despliegue-railway
```

Verifica que existan el `Dockerfile` y `.dockerignore` en la raiz. El Dockerfile compila React con Vite y ejecuta Express, que sirve tanto los archivos `frontend/dist` como `/api`.

Si tienes Docker Desktop instalado, puedes probar la construccion sin publicar:

```powershell
docker build -t abastocontrol:prueba .
```

No es obligatorio instalar Docker Desktop: Railway puede construir directamente desde GitHub.

## 2. Crear el proyecto en Railway

1. En [Railway](https://railway.com/), entra con tu cuenta; comprueba plan, creditos, facturacion y limites.
2. Crea un proyecto nuevo con **MySQL** (Add Service > Database > MySQL). Espera a que figure activo.
3. Agrega otro servicio con **GitHub Repo**: `DannyRuben-34/abastocontrol`.
4. En el servicio web, configura la rama **chore/despliegue-railway** para validar este cambio, antes de integrar a `main`.
5. Configura la ruta raiz del servicio web en **/**, Builder **Dockerfile** (el archivo esta en la raiz). No apuntes a /backend.

## 3. Variables del servicio web

En la seccion Variables del servicio web, crea estas variables. Para los cinco campos MySQL usa referencias privadas del servicio MySQL (los nombres pueden variar, consulta su pestaña Variables):

```dotenv
NODE_ENV=production
PORT=3000
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
JWT_SECRET=GENERAR_ALEATORIO_Y_GUARDAR_SOLO_EN_VARIABLES
JWT_EXPIRA=2h
CORS_ORIGIN=
```

**Cambia `MySQL` en las referencias por el nombre real que tenga tu servicio de base de datos.**
**JWT_SECRET** debe tener 32 caracteres como minimo; genera una clave nueva sin reutilizar la local:
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

No copies `ADMIN_CONTRASENA` del entorno local. Usa credenciales de demostracion diferentes y seguras para la nube, creadas de modo privado.

## 4. Crear tablas y datos en el MySQL de Railway

El `backend/database/schema.sql` original intenta crear la base `abastocontrol`. Railway normalmente aprovisiona una base ya creada (el nombre viene de `MYSQLDATABASE`, frecuentemente `railway`).

En **copias temporales locales** de los SQL:
- `schema.sql`: elimina la linea `CREATE DATABASE IF NOT EXISTS abastocontrol ...;` y cambia `USE abastocontrol;` por `USE nombre_de_la_base_de_railway;`.
- `seed.sql`: cambia `USE abastocontrol;` por `USE nombre_de_la_base_de_railway;`.
- Ejecuta primero el esquema y luego, UNA SOLA VEZ, el seed.

Puedes conectarte desde MySQL Workbench con el **TCP Proxy** de Railway (utiliza host/puerto publicos de la base y credenciales de Railway, no las de tu localhost). Alternativamente, Railway CLI `railway connect` puede crear un tunel sin exponer un puerto publico. No publiques una URL de conexion ni captures la clave en pantalla.

No vuelvas a importar el seed tras registrar ventas: duplicaria datos o causaria errores.

## 5. Crear administrador de la base en la nube

El proyecto tiene el script `backend/scripts/crear-admin.js`, pero el contenedor requiere configurar variables del entorno. Tras importar el esquema, define temporalmente **ADMIN_USUARIO** y **ADMIN_CONTRASENA** seguras en las variables del servicio.

Ejecuta una sola vez en el contenedor del servicio web (usando el shell/SSH de Railway si esta disponible):
`cd /app/backend && node scripts/crear-admin.js`.

El usuario se crea en la base de Railway. Quita `ADMIN_CONTRASENA` de las variables del servicio despues de utilizarla y redepliega. **No uses una cuenta de prueba con contraseña conocida**.

Si el sistema ya tiene administrador, no ejecutes el script otra vez.

## 6. Publicar y comprobar

- En Railway, aplica las variables y despliega el servicio web desde GitHub.
- En el servicio web > Settings > Networking, genera un dominio publico HTTPS. La app y su API deben compartir el mismo dominio.
- Visita `https://tu-dominio.up.railway.app/api/salud` y verifica `{"estado":"ok"}`.
- Visita `https://tu-dominio.up.railway.app/` y prueba login, inventario, una venta de demostracion y reportes.
- Si la API funciona pero la lista de productos falla, revisa variables MySQL, importacion del esquema y permisos. El endpoint de salud por si solo NO prueba la conexion a MySQL.

## Seguridad y calidad pendientes

- No des por terminado el despliegue hasta revisar `npm audit` de frontend y backend (en una captura anterior, el frontend tenia 2 vulnerabilidades).
- La rama `develop` tuvo un PR de documentacion y las auditorias de CI deben revisarse de nuevo; no ignores fallos de seguridad ni deshabilites checks.
- Mantener HTTPS, claves privadas, datos ficticios, permisos minimos y backups de MySQL.
- No es obligatorio publicar el sitio antes de comprobar estas medidas.

## Alternativa: solo demo local desde VS Code

Terminal 1: `cd E:\abastocontrol\backend; npm run dev`.
Terminal 2: `cd E:\abastocontrol\frontend; npm run dev`.
Abrir `http://localhost:5173`. Este modo **no es despliegue publico**.
