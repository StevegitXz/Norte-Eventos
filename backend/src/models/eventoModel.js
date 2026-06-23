const pool = require('../config/database');

async function listarPorUsuario(usuarioId) {
  const query = 'SELECT * FROM eventos WHERE usuario_id = ? ORDER BY data ASC, hora ASC';
  const [linhas] = await pool.execute(query, [usuarioId]);
  return linhas;
}

async function listarExplorar(usuarioId) {
  const query = `
    SELECT e.*, 
           IF(i.evento_id IS NULL, 0, 1) as inscrito
    FROM eventos e
    LEFT JOIN inscricoes i ON e.id = i.evento_id AND i.usuario_id = ?
    WHERE e.usuario_id != ?
    ORDER BY e.data ASC, e.hora ASC
  `;
  const [linhas] = await pool.execute(query, [usuarioId, usuarioId]);
  return linhas;
}

async function inscrever(usuarioId, eventoId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('INSERT INTO inscricoes (usuario_id, evento_id) VALUES (?, ?)', [usuarioId, eventoId]);
    await connection.execute('UPDATE eventos SET inscritos = inscritos + 1 WHERE id = ?', [eventoId]);
    
    // Buscar o dono do evento para notificação
    const [eventos] = await connection.execute('SELECT usuario_id FROM eventos WHERE id = ?', [eventoId]);
    
    await connection.commit();
    return { sucesso: true, dono_evento_id: eventos[0]?.usuario_id };
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return true; // Já inscrito
    throw error;
  } finally {
    connection.release();
  }
}

async function cancelarInscricao(usuarioId, eventoId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [res] = await connection.execute('DELETE FROM inscricoes WHERE usuario_id = ? AND evento_id = ?', [usuarioId, eventoId]);
    if (res.affectedRows > 0) {
      await connection.execute('UPDATE eventos SET inscritos = inscritos - 1 WHERE id = ?', [eventoId]);
    }
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function criar(dadosEvento, usuarioId) {
  const { nome, categoria, capacidade, data, hora, local, descricao, bannerClass, imagem_url, inscritos } = dadosEvento;
  
  const query = `
    INSERT INTO eventos 
    (usuario_id, nome, categoria, capacidade, data, hora, local, descricao, bannerClass, imagem_url, inscritos) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [resultado] = await pool.execute(query, [
    usuarioId, nome, categoria, capacidade, data, hora, local, descricao, bannerClass, imagem_url || null, inscritos || 0
  ]);
  
  return { id: resultado.insertId, ...dadosEvento, usuario_id: usuarioId };
}

async function atualizar(id, dadosEvento, usuarioId) {
  const { nome, categoria, capacidade, data, hora, local, descricao, bannerClass, imagem_url } = dadosEvento;
  
  const query = `
    UPDATE eventos SET 
      nome = ?, categoria = ?, capacidade = ?, data = ?, hora = ?, 
      local = ?, descricao = ?, bannerClass = ?, imagem_url = ?
    WHERE id = ? AND usuario_id = ?
  `;
  
  const [resultado] = await pool.execute(query, [
    nome, categoria, capacidade, data, hora, local, descricao, bannerClass, imagem_url || null, id, usuarioId
  ]);
  
  return resultado.affectedRows > 0;
}

async function excluir(id, usuarioId) {
  const query = 'DELETE FROM eventos WHERE id = ? AND usuario_id = ?';
  const [resultado] = await pool.execute(query, [id, usuarioId]);
  return resultado.affectedRows > 0;
}

// -----------------------------------------------------
// GERENCIAMENTO DE PARTICIPANTES (ORGANIZADOR)
// -----------------------------------------------------

async function listarParticipantes(eventoId, usuarioId) {
  // Verifica se o usuário é o dono do evento
  const queryDono = 'SELECT id FROM eventos WHERE id = ? AND usuario_id = ?';
  const [evento] = await pool.execute(queryDono, [eventoId, usuarioId]);
  
  if (evento.length === 0) {
    throw new Error('UNAUTHORIZED'); // Não é dono ou evento não existe
  }

  const queryParticipantes = `
    SELECT u.id, u.nome, u.email, i.data_inscricao
    FROM inscricoes i
    JOIN usuarios u ON i.usuario_id = u.id
    WHERE i.evento_id = ?
    ORDER BY i.data_inscricao ASC
  `;
  const [participantes] = await pool.execute(queryParticipantes, [eventoId]);
  return participantes;
}

async function removerParticipante(eventoId, participanteId, usuarioId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verifica se é o dono
    const [evento] = await connection.execute('SELECT id FROM eventos WHERE id = ? AND usuario_id = ?', [eventoId, usuarioId]);
    if (evento.length === 0) throw new Error('UNAUTHORIZED');

    const [res] = await connection.execute('DELETE FROM inscricoes WHERE evento_id = ? AND usuario_id = ?', [eventoId, participanteId]);
    if (res.affectedRows > 0) {
      await connection.execute('UPDATE eventos SET inscritos = inscritos - 1 WHERE id = ?', [eventoId]);
    }

    await connection.commit();
    return res.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function adicionarParticipante(eventoId, emailParticipante, usuarioId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verifica se é o dono
    const [evento] = await connection.execute('SELECT id FROM eventos WHERE id = ? AND usuario_id = ?', [eventoId, usuarioId]);
    if (evento.length === 0) throw new Error('UNAUTHORIZED');

    // Busca o usuário pelo email
    const [usuarios] = await connection.execute('SELECT id FROM usuarios WHERE email = ?', [emailParticipante]);
    if (usuarios.length === 0) throw new Error('NOT_FOUND');
    const participanteId = usuarios[0].id;

    // Adiciona na tabela inscricoes e atualiza o contador
    await connection.execute('INSERT INTO inscricoes (usuario_id, evento_id) VALUES (?, ?)', [participanteId, eventoId]);
    await connection.execute('UPDATE eventos SET inscritos = inscritos + 1 WHERE id = ?', [eventoId]);

    await connection.commit();
    return { id: participanteId, email: emailParticipante };
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') throw new Error('ALREADY_SUBSCRIBED');
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  listarPorUsuario,
  listarExplorar,
  inscrever,
  cancelarInscricao,
  criar,
  atualizar,
  excluir,
  listarParticipantes,
  removerParticipante,
  adicionarParticipante
};
