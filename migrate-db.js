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
    
    const queryEventos = `
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
          imagem_url VARCHAR(255),
          inscritos INT DEFAULT 0,
          criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `;
    
    await connection.query(queryEventos);
    console.log('✅ Tabela "eventos" garantida.');

    // Add imagem_url column if it doesn't exist (for existing tables)
    try {
      await connection.query('ALTER TABLE eventos ADD COLUMN imagem_url VARCHAR(255)');
      console.log('✅ Coluna "imagem_url" adicionada à tabela eventos.');
    } catch (e) {
      // Ignorar se a coluna já existir (código de erro 1060)
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }

    // Add foto_perfil column to usuarios if it doesn't exist
    try {
      await connection.query('ALTER TABLE usuarios ADD COLUMN foto_perfil VARCHAR(255)');
      console.log('✅ Coluna "foto_perfil" adicionada à tabela usuarios.');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }

    const queryInscricoes = `
      CREATE TABLE IF NOT EXISTS inscricoes (
          usuario_id INT NOT NULL,
          evento_id INT NOT NULL,
          data_inscricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (usuario_id, evento_id),
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
          FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
      );
    `;
    await connection.query(queryInscricoes);
    console.log('✅ Tabela "inscricoes" garantida.');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error.message);
  }
}

migrate();
