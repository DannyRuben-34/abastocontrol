# AbastoControl: React + Express en un solo servicio (mismo dominio, /api).
# Etapa 1: generar archivos estaticos del frontend.
FROM node:22-bookworm-slim AS build-frontend
WORKDIR /app
COPY frontend/package*.json ./frontend/
# El repositorio todavia no versiona frontend/package-lock.json.
RUN npm install --prefix frontend --no-audit --no-fund
COPY frontend/ ./frontend/
RUN npm run build --prefix frontend

# Etapa 2: solo las dependencias de produccion del backend.
FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY backend/package*.json ./backend/
RUN npm ci --prefix backend --omit=dev --no-audit --no-fund
COPY backend/src/ ./backend/src/
COPY backend/scripts/ ./backend/scripts/
COPY --from=build-frontend /app/frontend/dist/ ./frontend/dist/
EXPOSE 3000
# backend/src/app.js sirve /app/frontend/dist y las rutas /api.
CMD ["node", "backend/src/server.js"]
