# ⚡ Resumo do Sistema — Norte Eventos

Documento executivo e resumido contendo a visão completa da arquitetura, funcionalidades, frontend, backend, banco de dados e documentação.

---

## 📌 1. Visão Geral & Documentação
* **Objetivo:** Plataforma web para gerenciamento, publicação e inscrição em eventos locais.
* **Arquitetura:** MVC (Model-View-Controller) desacoplado com API RESTful em Express e Frontend estático dinâmico.
* **Documentação & Scripts Existentes:**
  * [`README.md`](file:///c:/Users/estev/Desktop/IFAC/Projetos/Norte-Eventos/README.md): Guia de instalação, configuração de ambiente e comandos de execução.
  * [`.env.example`](file:///c:/Users/estev/Desktop/IFAC/Projetos/Norte-Eventos/.env.example): Variáveis de ambiente necessárias (`PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `JWT_SECRET`).
  * [`migrate-db.js`](file:///c:/Users/estev/Desktop/IFAC/Projetos/Norte-Eventos/migrate-db.js): Script de criação/migração automática de tabelas e colunas no MySQL.
  * [`backend/create_notificacoes.js`](file:///c:/Users/estev/Desktop/IFAC/Projetos/Norte-Eventos/backend/create_notificacoes.js): Script de criação da tabela de notificações.
  * [`test-api.js`](file:///c:/Users/estev/Desktop/IFAC/Projetos/Norte-Eventos/test-api.js): Script de teste automatizado das rotas da API.

---

## 🎨 2. Frontend
* **Stack:** HTML5, CSS3 moderno, Tailwind CSS, JavaScript Puro (ES6+ Modular / Fetch API).
* **Páginas (`frontend/pages/`):**
  * `Home.html`: Vitrine inicial pública e apresentação do sistema.
  * `login.html`: Tela de autenticação com tratamento de credenciais e redirecionamento.
  * `cadastroUser.html`: Tela de criação de nova conta de usuário.
  * `dashboard.html`: Painel restrito e principal (gestão de eventos, exploração de eventos de terceiros, inscrições, perfil e notificações).
  * `pg-inicial.html`: Landing page alternativa.
* **UI/UX & Estilos (`frontend/css/`):**
  * Tailwind CSS compilado + estilos customizados.
  * Conceito visual de **Glassmorphism**, floating labels em formulários e total responsividade (mobile/desktop).
* **Módulos e Scripts JS (`frontend/js/`):**
  * `toast.js`: Sistema próprio de alertas visuais flutuantes (sucesso, erro, info).
  * `modules/api.js`: Camada centralizada de chamadas HTTP (Fetch API) com envio automático de credenciais/cookies.
  * `modules/auth.js`: Gerenciamento de sessão, login, logout e verificação de integridade do usuário.
  * `modules/events.js`: Regras de negócio de eventos no front (CRUD, filtros, renderização de cards e modais).
  * `modules/notifications.js`: Central de notificações do usuário com contador e marcação de lidas.
  * `modules/state.js`: Estado reativo e centralizado da aplicação em tempo de execução.
  * `modules/ui.js` & `modules/utils.js`: Manipulação de modais, formatação de datas, moedas e validações visuais.

---

## ⚙️ 3. Backend
* **Stack:** Node.js, Express, MySQL2 (`mysql2/promise`).
* **Segurança & Middlewares:**
  * **JWT (`jsonwebtoken`):** Autenticação stateless armazenada em cookies seguros `HttpOnly`.
  * **Criptografia:** `bcrypt` para hash seguro de senhas.
  * **Rate Limiting:** `express-rate-limit` contra ataques de força bruta em `/api/usuarios` (login e cadastro).
  * **Upload Seguro:** `multer` configurado para aceitar apenas formatos de imagem (`jpg`, `jpeg`, `png`, `webp`) com limite de 5MB.
  * **Controle de Acesso:** Middleware `verificarAutenticacao` validando token nas rotas privadas.
* **Endpoints da API:**
  * **Autenticação & Usuários (`/api/usuarios`):**
    * `POST /`: Cadastrar novo usuário.
    * `POST /login`: Autenticar e emitir cookie JWT.
    * `POST /logout`: Limpar cookie de sessão.
    * `GET /me`: Obter dados do usuário autenticado.
    * `PUT /me`: Atualizar perfil e foto (upload).
    * `DELETE /me`: Excluir conta e dados em cascata.
  * **Eventos (`/api/eventos` - Protegido):**
    * `GET /explorar`: Listar todos os eventos disponíveis no sistema para inscrição.
    * `GET /`: Listar eventos criados pelo usuário logado.
    * `POST /`: Criar novo evento.
    * `PUT /:id`: Atualizar dados do evento existente.
    * `DELETE /:id`: Excluir evento.
    * `POST /:id/inscrever`: Inscrever usuário em um evento.
    * `DELETE /:id/inscrever`: Cancelar inscrição.
    * `GET /:id/participantes`: Obter participantes de um evento.
    * `POST /:id/participantes`: Adicionar participante manual.
    * `DELETE /:id/participantes/:participanteId`: Remover participante.
  * **Notificações (`/api/notificacoes` - Protegido):**
    * `GET /`: Listar notificações do usuário.
    * `PUT /:id/lida`: Marcar notificação como lida.
    * `DELETE /`: Limpar histórico de notificações.
  * **Uploads (`/api/upload` - Protegido):**
    * `POST /`: Upload de banner/imagem do evento.

---

## 🗄️ 4. Banco de Dados (MySQL)
Relacionamentos relacionais com integridade referencial (`ON DELETE CASCADE`):

1. **`usuarios`**:
   * `id` (PK, INT, AUTO_INCREMENT)
   * `nome` (VARCHAR 100, NOT NULL)
   * `email` (VARCHAR 100, NOT NULL, UNIQUE)
   * `senha` (VARCHAR 255, NOT NULL - Hash Bcrypt)
   * `foto_perfil` (VARCHAR 255)
   * `criado_em` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

2. **`eventos`**:
   * `id` (PK, INT, AUTO_INCREMENT)
   * `usuario_id` (FK -> `usuarios.id`, ON DELETE CASCADE)
   * `nome` (VARCHAR 150, NOT NULL)
   * `categoria` (VARCHAR 50, NOT NULL)
   * `capacidade` (INT, NOT NULL)
   * `data` (DATE, NOT NULL)
   * `hora` (TIME, NOT NULL)
   * `local` (VARCHAR 255, NOT NULL)
   * `descricao` (TEXT)
   * `bannerClass` (VARCHAR 50)
   * `imagem_url` (VARCHAR 255)
   * `inscritos` (INT DEFAULT 0)
   * `criado_em` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

3. **`inscricoes`**:
   * `usuario_id` (PK/FK -> `usuarios.id`, ON DELETE CASCADE)
   * `evento_id` (PK/FK -> `eventos.id`, ON DELETE CASCADE)
   * `data_inscricao` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

4. **`notificacoes`**:
   * `id` (PK, INT, AUTO_INCREMENT)
   * `usuario_id` (FK -> `usuarios.id`, ON DELETE CASCADE)
   * `mensagem` (VARCHAR 255, NOT NULL)
   * `lida` (BOOLEAN DEFAULT FALSE)
   * `criado_em` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
