const fs = require('fs');
const path = require('path');
const eventoModel = require('../models/eventoModel');
const notificacaoModel = require('../models/notificacaoModel');

const ALLOWED_BANNERS = new Set([
  'event-card-gradient-1',
  'event-card-gradient-2',
  'event-card-gradient-3',
  'event-card-gradient-4',
  'event-card-gradient-5'
]);

const SAFE_UPLOAD_URL_REGEX = /^\/uploads\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i;

function removerImagemEventoSegura(relPath) {
  if (!relPath || !SAFE_UPLOAD_URL_REGEX.test(relPath)) return;
  const fullPath = path.join(__dirname, '../../../frontend', relPath);
  fs.unlink(fullPath, () => {});
}

function validarDadosEvento(body) {
  const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
  const categoria = typeof body.categoria === 'string' ? body.categoria.trim() : '';
  const local = typeof body.local === 'string' ? body.local.trim() : '';
  const data = typeof body.data === 'string' ? body.data.trim() : '';
  const hora = typeof body.hora === 'string' ? body.hora.trim() : '';
  const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : '';
  const capacidade = Number(body.capacidade);

  if (!nome || !categoria || !body.capacidade || !data || !hora || !local) {
    return { erro: 'Preencha todos os campos obrigatórios.' };
  }

  if (nome.length > 150 || categoria.length > 50 || local.length > 255 || descricao.length > 5000) {
    return { erro: 'Um ou mais campos excedem o tamanho máximo permitido.' };
  }

  if (!Number.isInteger(capacidade) || capacidade < 1 || capacidade > 100000) {
    return { erro: 'A capacidade deve ser um número inteiro entre 1 e 100.000.' };
  }

  let imagem_url = undefined;
  if (body.imagem_url !== undefined && body.imagem_url !== null && body.imagem_url !== '') {
    if (typeof body.imagem_url !== 'string' || !SAFE_UPLOAD_URL_REGEX.test(body.imagem_url)) {
      return { erro: 'URL de imagem inválida.' };
    }
    imagem_url = body.imagem_url;
  } else if (body.imagem_url === null) {
    imagem_url = null;
  }

  const bannerClass = ALLOWED_BANNERS.has(body.bannerClass)
    ? body.bannerClass
    : 'event-card-gradient-1';

  return {
    dados: {
      nome,
      categoria,
      capacidade,
      data,
      hora,
      local,
      descricao,
      bannerClass,
      imagem_url
    }
  };
}

async function listar(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const eventos = await eventoModel.listarPorUsuario(usuarioId);
    return res.status(200).json(eventos);
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao listar eventos.' });
  }
}

async function listarExplorar(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const eventos = await eventoModel.listarExplorar(usuarioId);
    return res.status(200).json(eventos);
  } catch (error) {
    console.error('Erro ao explorar eventos:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao explorar eventos.' });
  }
}

async function inscrever(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const nomeInscrito = req.usuarioLogado.nome;
    const { id } = req.params;

    const resultado = await eventoModel.inscrever(usuarioId, id);

    if (resultado.sucesso && resultado.dono_evento_id && resultado.dono_evento_id !== usuarioId) {
      await notificacaoModel.criar(
        resultado.dono_evento_id,
        `${nomeInscrito} acabou de se inscrever no seu evento!`
      );
    }

    return res.status(200).json({ mensagem: 'Inscrição realizada com sucesso!' });
  } catch (error) {
    if (error.message === 'EVENT_NOT_FOUND') {
      return res.status(404).json({ erro: 'Evento não encontrado.' });
    }
    if (error.message === 'OWNER_CANNOT_SUBSCRIBE') {
      return res.status(400).json({ erro: 'O organizador não pode se inscrever no próprio evento.' });
    }
    if (error.message === 'EVENT_FULL') {
      return res.status(400).json({ erro: 'Este evento já atingiu a capacidade máxima de inscritos.' });
    }
    if (error.message === 'ALREADY_SUBSCRIBED') {
      return res.status(400).json({ erro: 'Você já está inscrito neste evento.' });
    }
    console.error('Erro ao inscrever-se:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao realizar inscrição.' });
  }
}

async function cancelarInscricao(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const { id } = req.params;
    await eventoModel.cancelarInscricao(usuarioId, id);
    return res.status(200).json({ mensagem: 'Inscrição cancelada com sucesso!' });
  } catch (error) {
    console.error('Erro ao cancelar inscrição:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao cancelar inscrição.' });
  }
}

async function criar(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const validacao = validarDadosEvento(req.body);

    if (validacao.erro) {
      return res.status(400).json({ erro: validacao.erro });
    }

    const novoEvento = await eventoModel.criar(validacao.dados, usuarioId);

    return res.status(201).json({
      mensagem: 'Evento criado com sucesso!',
      evento: novoEvento
    });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao criar evento.' });
  }
}

async function atualizar(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const { id } = req.params;
    const validacao = validarDadosEvento(req.body);

    if (validacao.erro) {
      return res.status(400).json({ erro: validacao.erro });
    }

    const { atualizado, imagemAnterior } = await eventoModel.atualizar(id, validacao.dados, usuarioId);

    if (atualizado) {
      if (imagemAnterior) {
        removerImagemEventoSegura(imagemAnterior);
      }
      return res.status(200).json({ mensagem: 'Evento atualizado com sucesso!' });
    } else {
      return res.status(404).json({ erro: 'Evento não encontrado ou você não tem permissão para editá-lo.' });
    }
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao atualizar evento.' });
  }
}

async function excluir(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const { id } = req.params;

    const { excluido, imagemAnterior } = await eventoModel.excluir(id, usuarioId);

    if (excluido) {
      if (imagemAnterior) {
        removerImagemEventoSegura(imagemAnterior);
      }
      return res.status(200).json({ mensagem: 'Evento excluído com sucesso!' });
    } else {
      return res.status(404).json({ erro: 'Evento não encontrado ou você não tem permissão para excluí-lo.' });
    }
  } catch (error) {
    console.error('Erro ao excluir evento:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao excluir evento.' });
  }
}

// -----------------------------------------------------
// GERENCIAMENTO DE PARTICIPANTES (ORGANIZADOR)
// -----------------------------------------------------

async function listarParticipantes(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const { id } = req.params;
    const participantes = await eventoModel.listarParticipantes(id, usuarioId);
    return res.status(200).json(participantes);
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(403).json({ erro: 'Você não tem permissão para ver os participantes deste evento.' });
    }
    console.error('Erro ao listar participantes:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao listar participantes.' });
  }
}

async function removerParticipante(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const { id, participanteId } = req.params;

    await eventoModel.removerParticipante(id, participanteId, usuarioId);
    return res.status(200).json({ mensagem: 'Participante removido com sucesso.' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(403).json({ erro: 'Você não tem permissão para remover participantes deste evento.' });
    }
    console.error('Erro ao remover participante:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao remover participante.' });
  }
}

async function adicionarParticipante(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const { id } = req.params;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!email) {
      return res.status(400).json({ erro: 'O e-mail do participante é obrigatório.' });
    }

    await eventoModel.adicionarParticipante(id, email, usuarioId);
    return res.status(201).json({ mensagem: 'Participante adicionado com sucesso!' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(403).json({ erro: 'Você não tem permissão para adicionar participantes neste evento.' });
    }
    if (error.message === 'EVENT_FULL') {
      return res.status(400).json({ erro: 'O evento já atingiu a capacidade máxima de participantes.' });
    }
    if (error.message === 'OWNER_CANNOT_SUBSCRIBE') {
      return res.status(400).json({ erro: 'O organizador não pode ser adicionado como participante do próprio evento.' });
    }
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ erro: 'Não foi possível adicionar o participante com o e-mail informado.' });
    }
    if (error.message === 'ALREADY_SUBSCRIBED') {
      return res.status(400).json({ erro: 'Este usuário já está inscrito no evento.' });
    }
    console.error('Erro ao adicionar participante:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao adicionar participante.' });
  }
}

module.exports = {
  listar,
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
