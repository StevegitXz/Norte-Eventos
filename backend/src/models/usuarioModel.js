// Simulador de banco de dados em memória
const usuariosDB = [];

async function buscarPorEmail(email) {
  // Simula um "SELECT * FROM usuarios WHERE email = ?"
  return usuariosDB.find(user => user.email === email) || null;
}

async function salvar(dadosUsuario) {
  // Simula um "INSERT INTO usuarios ..."
  const novoUsuario = {
    id: usuariosDB.length + 1,
    ...dadosUsuario
  };
  usuariosDB.push(novoUsuario);
  return novoUsuario;
}

module.exports = {
  buscarPorEmail,
  salvar
};