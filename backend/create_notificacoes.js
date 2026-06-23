require('dotenv').config();
const pool = require('./src/config/database');

async function createTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notificacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        mensagem VARCHAR(255) NOT NULL,
        lida BOOLEAN DEFAULT FALSE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabela de notificações criada com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao criar tabela:', err);
    process.exit(1);
  }
}

createTable();
