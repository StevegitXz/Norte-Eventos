const pool = require('../config/database');

async function listarPorUsuario(usuarioId) {
  const query = 'SELECT * FROM eventos WHERE usuario_id = ? ORDER BY data ASC, hora ASC';
  const [linhas] = await pool.execute(query, [usuarioId]);
  return linhas;
}

async function listarExplorar(usuarioId) {
  const query = `
    SELECT e.*, 
           u.nome as criador_nome,
           IF(i.evento_id IS NULL, 0, 1) as inscrito
    FROM eventos e
    JOIN usuarios u ON e.usuario_id = u.id
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

    // Bloqueia a linha do evento para validar capacidade e propriedade com segurança contra race conditions
    const [eventos] = await connection.execute(
      'SELECT id, usuario_id, capacidade, inscritos FROM eventos WHERE id = ? FOR UPDATE',
      [eventoId]
    );

    if (eventos.length === 0) {
      throw new Error('EVENT_NOT_FOUND');
    }

    const evento = eventos[0];

    if (evento.usuario_id === usuarioId) {
      throw new Error('OWNER_CANNOT_SUBSCRIBE');
    }

    if (evento.inscritos >= evento.capacidade) {
      throw new Error('EVENT_FULL');
    }

    await connection.execute(
      'INSERT INTO inscricoes (usuario_id, evento_id) VALUES (?, ?)',
      [usuarioId, eventoId]
    );
    await connection.execute(
      'UPDATE eventos SET inscritos = inscritos + 1 WHERE id = ?',
      [eventoId]
    );

    await connection.commit();
    return { sucesso: true, dono_evento_id: evento.usuario_id };
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('ALREADY_SUBSCRIBED');
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function cancelarInscricao(usuarioId, eventoId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [res] = await connection.execute(
      'DELETE FROM inscricoes WHERE usuario_id = ? AND evento_id = ?',
      [usuarioId, eventoId]
    );
    if (res.affectedRows > 0) {
      await connection.execute(
        'UPDATE eventos SET inscritos = GREATEST(inscritos - 1, 0) WHERE id = ?',
        [eventoId]
      );
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
  const { nome, categoria, capacidade, data, hora, local, descricao, bannerClass, imagem_url } = dadosEvento;

  const query = `
    INSERT INTO eventos 
    (usuario_id, nome, categoria, capacidade, data, hora, local, descricao, bannerClass, imagem_url, inscritos) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `;

  const [resultado] = await pool.execute(query, [
    usuarioId,
    nome,
    categoria,
    capacidade,
    data,
    hora,
    local,
    descricao || null,
    bannerClass,
    imagem_url || null
  ]);

  return {
    id: resultado.insertId,
    nome,
    categoria,
    capacidade,
    data,
    hora,
    local,
    descricao: descricao || null,
    bannerClass,
    imagem_url: imagem_url || null,
    inscritos: 0,
    usuario_id: usuarioId
  };
}

async function atualizar(id, dadosEvento, usuarioId) {
  const { nome, categoria, capacidade, data, hora, local, descricao, bannerClass, imagem_url } = dadosEvento;

  const [atuais] = await pool.execute(
    'SELECT imagem_url FROM eventos WHERE id = ? AND usuario_id = ?',
    [id, usuarioId]
  );

  if (atuais.length === 0) {
    return { atualizado: false, imagemAnterior: null };
  }

  const imagemAnterior = atuais[0].imagem_url;
  const novaImagem = imagem_url !== undefined ? imagem_url : imagemAnterior;

  const query = `
    UPDATE eventos SET 
      nome = ?, categoria = ?, capacidade = ?, data = ?, hora = ?, 
      local = ?, descricao = ?, bannerClass = ?, imagem_url = ?
    WHERE id = ? AND usuario_id = ?
  `;

  const [resultado] = await pool.execute(query, [
    nome,
    categoria,
    capacidade,
    data,
    hora,
    local,
    descricao || null,
    bannerClass,
    novaImagem || null,
    id,
    usuarioId
  ]);

  return {
    atualizado: resultado.affectedRows > 0,
    imagemAnterior: imagem_url !== undefined && imagemAnterior !== novaImagem ? imagemAnterior : null
  };
}

async function excluir(id, usuarioId) {
  const [atuais] = await pool.execute(
    'SELECT imagem_url FROM eventos WHERE id = ? AND usuario_id = ?',
    [id, usuarioId]
  );

  if (atuais.length === 0) {
    return { excluido: false, imagemAnterior: null };
  }

  const query = 'DELETE FROM eventos WHERE id = ? AND usuario_id = ?';
  const [resultado] = await pool.execute(query, [id, usuarioId]);
  return {
    excluido: resultado.affectedRows > 0,
    imagemAnterior: atuais[0].imagem_url
  };
}

// -----------------------------------------------------
// GERENCIAMENTO DE PARTICIPANTES (ORGANIZADOR)
// -----------------------------------------------------

async function listarParticipantes(eventoId, usuarioId) {
  const queryDono = 'SELECT id FROM eventos WHERE id = ? AND usuario_id = ?';
  const [evento] = await pool.execute(queryDono, [eventoId, usuarioId]);

  if (evento.length === 0) {
    throw new Error('UNAUTHORIZED');
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

    const [evento] = await connection.execute(
      'SELECT id FROM eventos WHERE id = ? AND usuario_id = ? FOR UPDATE',
      [eventoId, usuarioId]
    );
    if (evento.length === 0) throw new Error('UNAUTHORIZED');

    const [res] = await connection.execute(
      'DELETE FROM inscricoes WHERE evento_id = ? AND usuario_id = ?',
      [eventoId, participanteId]
    );
    if (res.affectedRows > 0) {
      await connection.execute(
        'UPDATE eventos SET inscritos = GREATEST(inscritos - 1, 0) WHERE id = ?',
        [eventoId]
      );
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

    const [eventos] = await connection.execute(
      'SELECT id, usuario_id, capacidade, inscritos FROM eventos WHERE id = ? AND usuario_id = ? FOR UPDATE',
      [eventoId, usuarioId]
    );
    if (eventos.length === 0) throw new Error('UNAUTHORIZED');

    const evento = eventos[0];
    if (evento.inscritos >= evento.capacidade) {
      throw new Error('EVENT_FULL');
    }

    const [usuarios] = await connection.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [emailParticipante]
    );
    if (usuarios.length === 0) throw new Error('NOT_FOUND');
    const participanteId = usuarios[0].id;

    if (participanteId === usuarioId) {
      throw new Error('OWNER_CANNOT_SUBSCRIBE');
    }

    await connection.execute(
      'INSERT INTO inscricoes (usuario_id, evento_id) VALUES (?, ?)',
      [participanteId, eventoId]
    );
    await connection.execute(
      'UPDATE eventos SET inscritos = inscritos + 1 WHERE id = ?',
      [eventoId]
    );

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
