const jwt = require('jsonwebtoken');
const usuarioModel = require('../models/usuarioModel');

async function verificarAutenticacao(req, res, next) {
    const token = req.cookies && req.cookies.norte_eventos_token;

    if (!token) {
        if (req.originalUrl && req.originalUrl.startsWith('/api')) {
            return res.status(401).json({ erro: 'Não autorizado. Faça login.' });
        }
        return res.redirect('/login');
    }

    try {
        const tokenDecodificado = jwt.verify(token, process.env.JWT_SECRET);
        const usuarioAtivo = await usuarioModel.buscarPorId(tokenDecodificado.id);

        if (!usuarioAtivo) {
            res.clearCookie('norte_eventos_token', {
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production'
            });
            if (req.originalUrl && req.originalUrl.startsWith('/api')) {
                return res.status(401).json({ erro: 'Sessão inválida. Faça login novamente.' });
            }
            return res.redirect('/login');
        }

        req.usuarioLogado = {
            id: usuarioAtivo.id,
            email: usuarioAtivo.email,
            nome: usuarioAtivo.nome
        };
        next();
    } catch (erro) {
        res.clearCookie('norte_eventos_token', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        });
        if (req.originalUrl && req.originalUrl.startsWith('/api')) {
            return res.status(401).json({ erro: 'Token inválido ou expirado. Faça login.' });
        }
        return res.redirect('/login');
    }
}

module.exports = verificarAutenticacao;
