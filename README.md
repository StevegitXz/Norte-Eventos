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
- bcrypt
- cors

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
│   ├── js/
│   ├── pages/
│   └── src/
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## Como rodar o projeto

### Clonar repositório

```bash
git clone https://github.com/StevegitXz/Norte-Eventos.git
```

---

### Instalar dependências backend

```bash

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
- Ana Culqui
- Mariana Melo
- Izabel Lima
- Estevão emanuel
- Williane Gadelha