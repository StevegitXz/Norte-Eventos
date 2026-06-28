// backend/src/models/usuarioModel.js
const pool = require('../config/database');

async function buscarPorEmail(email) {
  const query = 'SELECT * FROM usuarios WHERE email = ?';
  const [linhas] = await pool.execute(query, [email]);
  
  return linhas[0] || null;
}

async function buscarPorId(id) {
  const query = 'SELECT * FROM usuarios WHERE id = ?';
  const [linhas] = await pool.execute(query, [id]);
  
  return linhas[0] || null;
}

async function salvar(dadosUsuario) {
  const { nome, email, senha } = dadosUsuario;
  
  const query = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';
  const [resultado] = await pool.execute(query, [nome, email, senha]);
  
  return {
    id: resultado.insertId,
    nome,
    email
  };
}

async function atualizar(id, nome, email, foto_perfil, senhaHash) {
  try {
    let query = 'UPDATE usuarios SET nome = ?, email = ?';
    let params = [nome, email];
    
    if (foto_perfil !== undefined) {
      query += ', foto_perfil = ?';
      params.push(foto_perfil);
    }
    
    if (senhaHash) {
      query += ', senha = ?';
      params.push(senhaHash);
    }
    
    query += ' WHERE id = ?';
    params.push(id);

    const [resultado] = await pool.execute(query, params);
    return resultado.affectedRows > 0;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return false; // Email em uso
    throw error;
  }
}

async function excluir(id) {
  const query = 'DELETE FROM usuarios WHERE id = ?';
  const [resultado] = await pool.execute(query, [id]);
  return resultado.affectedRows > 0;
}

module.exports = {
  buscarPorEmail,
  buscarPorId,
  salvar,
  atualizar,
  excluir
};