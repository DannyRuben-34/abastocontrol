// Crea el primer usuario administrador usando ADMIN_USUARIO y ADMIN_CONTRASENA del archivo .env.
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../src/config/db');
const usuarios = require('../src/repositories/usuarios');
const { validarContrasena } = require('../src/services/usuariosService');

async function main() {
  const usuario = (process.env.ADMIN_USUARIO || 'admin').toLowerCase();
  const contrasena = validarContrasena(process.env.ADMIN_CONTRASENA || '');
  const hash = await bcrypt.hash(contrasena, 12);
  const id = await usuarios.crear({ nombre: 'Administrador', usuario, hash, rol: 'admin' });
  console.log(`Administrador "${usuario}" creado con id ${id}`);
  await db.cerrar();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
