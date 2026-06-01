
# Norte Eventos

Sistema web para cadastro, organização e gerenciamento de eventos locais.

## 📋 Sobre o projeto

O **Norte Eventos** é um projeto acadêmico desenvolvido para a disciplina de **Práticas de Programação**, sob a orientação do professor **Álvaro**.

O sistema utiliza a arquitetura **MVC (Model-View-Controller)** e contempla as seguintes funcionalidades:
- Cadastro e autenticação de usuários com criptografia de senha.
- Controle de sessões via tokens JWT armazenados em cookies.
- Proteção e restrição de rotas privadas (Dashboard).
- Sistema de inscrição e gerenciamento de eventos.

---

## 🛠️ Tecnologias Utilizadas

- **Ambiente:** Node.js
- **Framework Web:** Express
- **Banco de Dados:** MySQL (Driver `mysql2`)
- **Segurança:** `jsonwebtoken` (JWT), `bcrypt`, `cookie-parser`
- **Frontend:** HTML5, JavaScript (ES6+ / Fetch API), Tailwind CSS
- **Ferramentas:** `dotenv`, `nodemon`, `cors`

---

## 📂 Estrutura de Pastas

```bash
NORTE_EVENTOS/
│
├── backend/
│   ├── src/
│   │   ├── config/       # Conexão com o Banco de Dados
│   │   ├── controllers/  # Regras de negócio e lógica de rotas
│   │   ├── middlewares/  # Interceptadores de segurança (Validação JWT)
│   │   ├── models/       # Consultas e manipulação do MySQL
│   │   └── routers/      # Definição dos endpoints da API
│   └── server.js         # Inicialização do servidor Express
│
├── frontend/
│   ├── assets/           # Imagens e mídias
│   ├── css/              # Estilização (Tailwind / CSS global)
│   ├── js/               # Scripts de interação com a API
│   └── pages/            # Telas do sistema (Index, Login, Cadastro, Dashboard)
│
├── .env.example          # Modelo das variáveis de ambiente
├── .gitignore            # Arquivos ignorados pelo Git
├── package.json          # Dependências e scripts da raiz
└── README.md             # Documentação do projeto

```

---

## 🚀 Como Rodar o Projeto

### 1. Pré-requisitos

* Node.js instalado.
* Servidor MySQL ativo.

### 2. Instalação e Configuração

Clone o repositório e acesse a pasta raiz:

```bash
git clone [https://github.com/StevegitXz/Norte-Eventos.git](https://github.com/StevegitXz/Norte-Eventos.git)
cd Norte-Eventos

```

Instale as dependências a partir do diretório raiz:

```bash
npm install

```

### 3. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes chaves:

```env
PORT=3000

DB_HOST=localhost
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql
DB_NAME=norte_eventos
DB_PORT=3306

JWT_SECRET=sua_chave_secreta_jwt

```

### 4. Banco de Dados

Execute o script abaixo no seu terminal ou gerenciador MySQL:

```sql
CREATE DATABASE norte_eventos;
USE norte_eventos;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

```

### 5. Execução

Para iniciar em ambiente de desenvolvimento (com recarregamento automático):

```bash
npm run dev

```

Para iniciar em modo de produção:

```bash
npm start

```

O servidor estará disponível em: `http://localhost:3000`

---

## 👥 Equipe do Projeto

* Ana Culqui
* Estevão Emanuel
* Izabel Lima
* Mariana Melo
* Williane Gadelha

```

```