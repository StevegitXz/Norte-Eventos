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

module.exports = {
  buscarPorEmail,
  salvar
};