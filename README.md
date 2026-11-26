# Norte Eventos

Sistema web para cadastro, divulgação, organização e gerenciamento de eventos locais na Região Norte do Brasil.

---

## 📋 Sobre o Projeto

O **Norte Eventos** é um projeto acadêmico desenvolvido para a disciplina de **Práticas de Programação (IFAC)**, sob a orientação do professor **Álvaro**.

O sistema utiliza a arquitetura **MVC (Model-View-Controller)**, é empacotado com **Docker Compose** e conta com uma **Wiki Integrada (`/wiki`)** para usuários finais, organizadores e desenvolvedores.

### Principais Funcionalidades
- **Autenticação segura:** cadastro e login com hash de senha via `bcrypt` e sessões em tokens **JWT** armazenados em cookies `HttpOnly` (`SameSite=lax`).
- **Gestão completa de eventos:** criação, edição, exclusão, upload de capas personalizadas (`multer`) ou escolha de gradientes editoriais.
- **Exploração e inscrições:** busca em tempo real, filtros por categoria, controle transacional de vagas no MySQL (`SELECT ... FOR UPDATE`), cancelamento de inscrição e gestão de participantes por evento.
- **Notificações e perfil:** central de avisos com leitura/limpeza, edição de dados pessoais, foto de perfil, troca de senha, alternância de tema claro/escuro e exclusão de conta.
- **Wiki Integrada (`/wiki`):** central de documentação inspirada na Wiki IFAC com **12 guias em Markdown**, busca instantânea (`Ctrl + K`), filtro por perfil, sumário lateral, diagramas Mermaid e proteção contra *Path Traversal*.
- **Design System Editorial & Acessibilidade:** interface responsiva em **Tailwind CSS v4** (*Outfit* + *Plus Jakarta Sans*), cards *Full-Bleed Progressive Blur*, navegação por teclado e atributos ARIA (detalhados em [RESUMO_ACESSIBILIDADE.md](RESUMO_ACESSIBILIDADE.md)).
- **Segurança:** política restritiva de CORS, `express-rate-limit` por IP, cabeçalhos HTTP de segurança, validação de extensão/MIME type em uploads e queries parametrizadas (`mysql2`).

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js 22, Express 5 (`express`), `mysql2`
- **Banco de Dados:** MySQL 8.0
- **Segurança:** `jsonwebtoken`, `bcrypt`, `cookie-parser`, `cors`, `express-rate-limit`, `multer`
- **Frontend:** HTML5, CSS3, JavaScript (ES Modules / Fetch API), Tailwind CSS v4 (`@tailwindcss/cli`)
- **Infraestrutura:** Docker (`node:22-slim`, `mysql:8.0`) e Docker Compose

---

## 📂 Estrutura de Pastas

```text
Norte-Eventos/
├── backend/
│   ├── server.js                        # Inicialização do Express 5, middlewares, uploads e rotas HTML
│   └── src/
│       ├── config/database.js           # Pool de conexões MySQL (mysql2/promise)
│       ├── controllers/                 # Regras de negócio (usuários, eventos, notificações, wiki)
│       ├── middlewares/                 # Autenticação JWT (authMiddleware.js)
│       ├── models/                      # Consultas SQL parametrizadas
│       └── routers/                     # Endpoints REST (/api/usuarios, /api/eventos, /api/notificacoes, /api/wiki)
│
├── frontend/
│   ├── assets/                          # Logotipos, ícones e imagens estáticas
│   ├── css/                             # input.css (tokens @theme) e tailwind.css (minificado)
│   ├── js/                              # Scripts das páginas, wiki.js e módulos ES do Dashboard
│   ├── pages/                           # Home.html, login.html, cadastroUser.html, dashboard.html, wiki.html
│   └── uploads/                         # Capas de eventos e fotos de perfil (persistidas via volume Docker)
│
├── docs/                                # Artigos Markdown da Wiki + manifest.json
├── docker/
│   └── init.sql                         # Criação automática das 4 tabelas MySQL no Docker
│
├── Dockerfile                           # Build da imagem Node.js + compilação Tailwind CSS
├── docker-compose.yml                   # Orquestração dos containers app e db
├── .dockerignore                        # Exclusões do contexto de build Docker
├── .env.example                         # Modelo de variáveis de ambiente
├── RESUMO_ACESSIBILIDADE.md             # Resumo das melhorias de acessibilidade (a11y)
├── Apresentacao_Norte_Eventos_Docker_Wiki.pdf
├── Apresentacao_Norte_Eventos_Docker_Wiki.pptx
└── package.json                         # Dependências e scripts npm
```

---

## 🚀 Como Rodar o Projeto

### Opção 1: Com Docker Compose (Recomendado)

**Pré-requisito:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução.

1. Clone o repositório e acesse a pasta do projeto:

```bash
git clone https://github.com/StevegitXz/Norte-Eventos.git
cd Norte-Eventos
```

2. Suba a aplicação e o banco MySQL com um único comando:

```bash
docker compose up -d --build
```

O Docker irá:
- Subir o banco **MySQL 8.0** (`norte-eventos-db`) na porta externa `3307` e executar automaticamente o [docker/init.sql](docker/init.sql) criando as tabelas `usuarios`, `eventos`, `inscricoes` e `notificacoes`.
- Aguardar o `healthcheck` do banco e iniciar o servidor **Node.js** (`norte-eventos-app`) na porta `3000`.

3. Acesse no navegador:
- **Aplicação:** `http://localhost:3000`
- **Wiki / Documentação:** `http://localhost:3000/wiki`

#### Comandos Docker úteis
```bash
docker compose ps                # Ver status dos containers
docker compose logs -f app       # Acompanhar logs do servidor
docker compose down              # Parar containers mantendo os dados do banco
docker compose down -v           # Parar e apagar volumes (resetar banco do zero)
```

---

### Opção 2: Rodando Localmente (Sem Docker)

**Pré-requisitos:** Node.js (v20 ou v22) e servidor MySQL 8.0 ativo.

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo `.env` na raiz tomando como base o [.env.example](.env.example):

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000

# Obrigatório: mínimo de 32 caracteres
JWT_SECRET=substitua_por_uma_chave_secreta_forte_com_mais_de_32_caracteres

DB_HOST=localhost
DB_PORT=3306
DB_NAME=norte_eventos
DB_USER=root
DB_PASSWORD=sua_senha_mysql
```

3. Crie o banco `norte_eventos` no MySQL e execute o script SQL em [docker/init.sql](docker/init.sql).

4. Inicie o projeto:

```bash
# Desenvolvimento (Express com nodemon + Tailwind em watch)
npm run dev

# Ou compilar CSS e iniciar normalmente
npm run build:css
npm start
```

---

## 📚 Documentação (Wiki Integrada)

Toda a documentação detalhada para **Usuários**, **Organizadores** e **Desenvolvedores** (incluindo modelagem DER e referência completa da API REST) está disponível diretamente no sistema em **`http://localhost:3000/wiki`** ou nos arquivos Markdown da pasta [`docs/`](docs/manifest.json).

---

## 👥 Equipe do Projeto

- **Ana Culqui**
- **Estevão Emanuel**
- **Izabel Lima**
- **Mariana Melo**
- **Williane Gadelha**
