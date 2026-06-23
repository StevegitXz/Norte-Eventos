const pool = require('../config/database');

async function criar(usuarioId, mensagem) {
  const query = 'INSERT INTO notificacoes (usuario_id, mensagem) VALUES (?, ?)';
  const [resultado] = await pool.execute(query, [usuarioId, mensagem]);
  return resultado.insertId;
}

async function listarPorUsuario(usuarioId) {
  const query = 'SELECT * FROM notificacoes WHERE usuario_id = ? ORDER BY criado_em DESC';
  const [linhas] = await pool.execute(query, [usuarioId]);
  return linhas;
}

async function marcarComoLida(id, usuarioId) {
  const query = 'UPDATE notificacoes SET lida = TRUE WHERE id = ? AND usuario_id = ?';
  const [resultado] = await pool.execute(query, [id, usuarioId]);
  return resultado.affectedRows > 0;
}

async function limparTodas(usuarioId) {
  const query = 'DELETE FROM notificacoes WHERE usuario_id = ?';
  const [resultado] = await pool.execute(query, [usuarioId]);
  return resultado.affectedRows > 0;
}

module.exports = {
  criar,
  listarPorUsuario,
  marcarComoLida,
  limparTodas
};
