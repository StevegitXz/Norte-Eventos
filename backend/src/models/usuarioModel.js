// backend/src/models/usuarioModel.js
const pool = require('../config/database');

async function buscarPorEmail(email) {
  const query = 'SELECT * FROM usuarios WHERE email = ?';
  const [linhas] = await pool.execute(query, [email]);
  
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

async function atualizar(id, nome, email) {
  try {
    const query = 'UPDATE usuarios SET nome = ?, email = ? WHERE id = ?';
    const [resultado] = await pool.execute(query, [nome, email, id]);
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
  salvar,
  atualizar,
  excluir
};