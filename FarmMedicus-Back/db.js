
const { Pool } = require("pg");

// =====================================================
// VALIDAR VARIABLES DE BASE DE DATOS
// =====================================================

const requiredEnv = [
  "DB_HOST",
  "DB_NAME",
  "DB_PASSWORD",
  "DB_PORT",
  "DB_USER",
];

const missingEnv = requiredEnv.filter(
  (key) => !process.env[key]
);

if (missingEnv.length > 0) {
  console.error(
    "[DB] Faltan variables de entorno:",
    missingEnv.join(", ")
  );

  process.exit(1);
}

// =====================================================
// CONFIGURACIÓN POSTGRESQL
// =====================================================

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: Number(process.env.DB_PORT),
});

// =====================================================
// EJECUTAR CONSULTAS
// =====================================================

const query = async (text, params) => {
  try {
    const start = Date.now();

    const res = await pool.query(text, params);

    const duration = Date.now() - start;

    console.log("Query ejecutada", {
      text,
      duration,
      rows: res.rowCount,
    });

    return res;
  } catch (error) {
    console.error("Error en query:", {
      text,
      error,
    });

    throw error;
  }
};

// =====================================================
// CONEXIÓN A BASE DE DATOS
// =====================================================

const connectDB = async () => {
  try {
    const client = await pool.connect();

    client.release();

    console.log(
      "PostgreSQL conectado correctamente 🚀"
    );

    return pool;
  } catch (error) {
    console.error(
      "Error al conectar a PostgreSQL:",
      error
    );

    throw error;
  }
};

// =====================================================
// EXPORTAR
// =====================================================

module.exports = {
  connectDB,
  query,
  pool,
};
