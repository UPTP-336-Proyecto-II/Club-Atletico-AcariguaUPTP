const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cada_db',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  charset: 'utf8mb4'
};

const pool = mysql.createPool(dbConfig);

const testConnection = async () => {
  let connection;

  try {
    connection = await pool.getConnection();
    const [results] = await connection.execute('SELECT COUNT(*) as total FROM usuarios');

    console.log(`Base de datos conectada: ${dbConfig.database}`);
    console.log(`Usuarios disponibles: ${results[0].total}`);
    return true;
  } catch (error) {
    console.error(`Error conectando a MySQL (${dbConfig.database}): ${error.message}`);
    console.log('Verifica que MySQL este activo y que la base de datos exista.');
    return false;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = pool;
module.exports.dbConfig = dbConfig;
module.exports.testConnection = testConnection;
