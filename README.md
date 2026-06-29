# Norte Eventos

Sistema web para cadastro, organização e gerenciamento de eventos locais.

## 📋 Sobre o projeto

O **Norte Eventos** é um projeto acadêmico desenvolvido para a disciplina de **Práticas de Programação**, sob a orientação do professor **Álvaro**.

O sistema utiliza a arquitetura **MVC (Model-View-Controller)** e contempla as seguintes funcionalidades:
- Cadastro e autenticação de usuários com criptografia de senha (bcrypt).
- Controle de sessões altamente seguro via JWT armazenados em cookies `HttpOnly` e política rigorosa de CORS.
- Proteção avançada do servidor com `express-rate-limit` contra ataques de força bruta (Brute Force).
- Validação e restrição de Uploads via `multer`.
- Interface reativa com sistema de notificações (Toasts) personalizadas.
- Proteção e restrição de rotas privadas (Dashboard e API de Eventos).
- Sistema de inscrição e gerenciamento de eventos.
- **Design System Unificado** com TailwindCSS, interfaces responsivas, Glassmorphism e UX aprimorada em formulários (Floating Labels).

---

## 🛠️ Tecnologias Utilizadas

- **Ambiente:** Node.js
- **Framework Web:** Express
- **Banco de Dados:** MySQL (Driver `mysql2`)
- **Segurança e Proteção:** `jsonwebtoken` (JWT), `bcrypt`, `cookie-parser`, `express-rate-limit`, Validação Rigorosa de Uploads.
- **Frontend:** HTML5, CSS3, JavaScript (ES6+ / Fetch API), Tailwind CSS
- **Notificações UI:** Sistema de Toasts dinâmico em JavaScript puro.
- **Ferramentas e Middlewares:** `dotenv`, `nodemon`, `cors`, `multer`

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

CREATE TABLE eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    capacidade INT NOT NULL,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    local VARCHAR(255) NOT NULL,
    descricao TEXT,
    bannerClass VARCHAR(50),
    imagem_url VARCHAR(255),
    inscritos INT DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE inscricoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    evento_id INT NOT NULL,
    data_inscricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    UNIQUE(usuario_id, evento_id)
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
