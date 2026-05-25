// backend/src/config/database.js
const mysql = require('mysql2/promise');

// O pool agora consome as variáveis de ambiente seguras
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306, // Usa a porta do .env ou a 3306 como padrão
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;