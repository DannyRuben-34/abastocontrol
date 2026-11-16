// Patrón Singleton: el pool de conexiones se crea una sola vez y se reutiliza (consultas parametrizadas, OWASP A03).
const mysql = require('mysql2/promise');

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'abastocontrol',
      waitForConnections: true,
      connectionLimit: 10,
      decimalNumbers: true,
      dateStrings: true,
    });
  }
  return pool;
}

// Ejecuta una consulta parametrizada; usa la conexión de la transacción si se entrega.
async function ejecutar(sql, params = [], conn = null) {
  const [filas] = await (conn || getPool()).execute(sql, params);
  return filas;
}

async function transaction(fn) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function cerrar() {
  if (pool) await pool.end();
  pool = null;
}

module.exports = { getPool, ejecutar, transaction, cerrar };
