const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAdminTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306
  });

  try {
    // Obtener la estructura de la tabla administrador
    const [rows] = await connection.execute('SHOW COLUMNS FROM administrador');
    console.log('Estructura de la tabla administrador:');
    console.table(rows);
    
    // Obtener datos de ejemplo
    const [data] = await connection.execute('SELECT * FROM administrador LIMIT 1');
    console.log('\nDatos de ejemplo de la tabla administrador:');
    console.table(data);
    
  } catch (error) {
    console.error('Error al consultar la base de datos:', error);
  } finally {
    await connection.end();
  }
}

checkAdminTable();
