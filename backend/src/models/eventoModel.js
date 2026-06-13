const pool = require('../config/database');

async function listarPorUsuario(usuarioId) {
  const query = 'SELECT * FROM eventos WHERE usuario_id = ? ORDER BY data ASC, hora ASC';
  const [linhas] = await pool.execute(query, [usuarioId]);
  return linhas;
}

async function criar(dadosEvento, usuarioId) {
  const { nome, categoria, capacidade, data, hora, local, descricao, bannerClass, inscritos } = dadosEvento;
  
  const query = `
    INSERT INTO eventos 
    (usuario_id, nome, categoria, capacidade, data, hora, local, descricao, bannerClass, inscritos) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [resultado] = await pool.execute(query, [
    usuarioId, nome, categoria, capacidade, data, hora, local, descricao, bannerClass, inscritos || 0
  ]);
  
  return { id: resultado.insertId, ...dadosEvento, usuario_id: usuarioId };
}

async function atualizar(id, dadosEvento, usuarioId) {
  const { nome, categoria, capacidade, data, hora, local, descricao, bannerClass } = dadosEvento;
  
  const query = `
    UPDATE eventos SET 
      nome = ?, categoria = ?, capacidade = ?, data = ?, hora = ?, 
      local = ?, descricao = ?, bannerClass = ?
    WHERE id = ? AND usuario_id = ?
  `;
  
  const [resultado] = await pool.execute(query, [
    nome, categoria, capacidade, data, hora, local, descricao, bannerClass, id, usuarioId
  ]);
  
  return resultado.affectedRows > 0;
}

async function excluir(id, usuarioId) {
  const query = 'DELETE FROM eventos WHERE id = ? AND usuario_id = ?';
  const [resultado] = await pool.execute(query, [id, usuarioId]);
  return resultado.affectedRows > 0;
}

module.exports = {
  listarPorUsuario,
  criar,
  atualizar,
  excluir
};
