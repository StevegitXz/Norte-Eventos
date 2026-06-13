require('dotenv').config({ path: 'c:\\Users\\estev\\Desktop\\IFAC\\Projetos\\Norte-Eventos\\.env' });
const mysql = require('mysql2/promise');

async function migrate() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });
    console.log('✅ Conexão estabelecida.');
    
    const query = `
      CREATE TABLE IF NOT EXISTS eventos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          usuario_id INT NOT NULL,
          nome VARCHAR(150) NOT NULL,
          categoria VARCHAR(50) NOT NULL,
          capacidade INT NOT NULL,
          data DATE NOT NULL,
          hora TIME NOT NULL,
          local VARCHAR(255) NOT NULL,
          descricao TEXT,
          bannerClass VARCHAR(50),
          inscritos INT DEFAULT 0,
          criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `;
    
    await connection.query(query);
    console.log('✅ Tabela "eventos" criada ou já existente.');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error.message);
  }
}

migrate();
