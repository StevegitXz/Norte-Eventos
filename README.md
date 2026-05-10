# Norte Eventos

Sistema web para cadastro e gerenciamento de eventos.

## Sobre o projeto

O **Norte Eventos** é um projeto acadêmico desenvolvido para a disciplina de **Programação para Web**, ministrada pelo professor **Álvaro**.

O objetivo do sistema é permitir o cadastro, gerenciamento e organização de eventos, oferecendo funcionalidades como:

- Cadastro de usuários
- Criação de eventos
- Gerenciamento de inscrições
- Organização por categorias
- Controle de participantes

Atualmente, o projeto está sendo desenvolvido com foco em aprendizado prático de desenvolvimento web full stack.

---

## Tecnologias utilizadas

### Backend
- Node.js
- Express
- MySQL

### Frontend
- HTML5
- JavaScript
- Tailwind CSS

### Controle de versão
- Git
- GitHub

### Outras ferramentas
- dotenv
- nodemon

---

## Estrutura de pastas

```bash
NORTE_EVENTOS/
│
├── backend/
│   ├── node_modules/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   └── routers/
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── frontend/
│   ├── css/
│   ├── pages/
│   └── src/
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## Explicação das pastas

### `/backend`
Contém toda a lógica do servidor e comunicação com banco de dados.

### `/backend/src/controllers`
Responsável pela lógica das rotas.

Exemplo:
- cadastrar evento
- listar usuários
- realizar inscrição

Controllers recebem requisições e processam regras de negócio.

---

### `/backend/src/middlewares`
Funções intermediárias executadas antes da rota final.

Exemplos:
- autenticação
- validação de dados
- tratamento de erros

---

### `/backend/src/models`
Responsável pela comunicação com o banco de dados.

Aqui ficam:
- queries SQL
- funções de acesso ao MySQL
- abstração das tabelas

Exemplo:
- criar usuário
- buscar evento por ID

---

### `/backend/src/routers`
Define as rotas da API.

Exemplo:

- `/usuarios`
- `/eventos`
- `/inscricoes`

As rotas conectam URL → controller.

---

### `/backend/server.js`
Arquivo principal do servidor.

Responsável por:
- iniciar Express
- configurar middlewares globais
- registrar rotas
- iniciar servidor

---

## Frontend

### `/frontend/css`
Arquivos de estilização.

Contém:
- CSS customizado
- configurações complementares ao Tailwind

---

### `/frontend/pages`
Páginas HTML do sistema.

Exemplos:
- login
- cadastro
- home
- eventos

---

### `/frontend/src`
Scripts JavaScript do frontend.

Responsável por:
- manipulação de DOM
- requisições para API
- validações frontend

---

## Arquivos principais

### `.env`
Armazena variáveis sensíveis.

Exemplo:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=norte_eventos
```

Esse arquivo **não deve ser enviado ao GitHub**.

---

### `.gitignore`
Ignora arquivos e pastas desnecessários.

Exemplo:
- node_modules
- .env

---

## Como rodar o projeto

### Clonar repositório

```bash
git clone <url-do-repositorio>
```

---

### Instalar dependências backend

```bash
cd backend
npm install
```

---

### Rodar servidor

```bash
npm run dev
```

---

## Banco de dados

O projeto utiliza MySQL.

Criar banco:

```sql
CREATE DATABASE norte_eventos;
```

As tabelas incluem:

- usuarios
- categorias
- eventos
- inscricoes
- pagamentos
- feedbacks

---

## Objetivo acadêmico

Este projeto foi criado para fins educacionais, visando praticar:

- arquitetura MVC
- integração frontend + backend
- APIs REST
- banco de dados relacional
- versionamento com Git/GitHub

---

## Equipe

Projeto desenvolvido pelos integrantes responsáveis pela disciplina de Programação Web.