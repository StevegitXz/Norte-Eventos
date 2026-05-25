const jwt = require('jsonwebtoken');

function verificarAutenticacao(req, res, next) {
    let token = null;

    const cookieHeader = req.headers.cookie;

    if (cookieHeader) {
        const cookieToken = cookieHeader
            .split('; ')
            .find(row => row.startsWith('norte_eventos_token='));
        
        if (cookieToken) {
            token = cookieToken.split('=')[1]; 
        }
    }


if (!token) {
    return res.redirect('/login');
}

try {
    const tokenDecodificado = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioLogado = tokenDecodificado; 
    next(); 
} catch (erro) {
    return res.redirect('/login'); 
}
}

module.exports = verificarAutenticacao;