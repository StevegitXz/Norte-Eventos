# Instalação e Docker

Você pode executar o **Norte Eventos** de duas maneiras: via **Docker Compose** (recomendado — zero configuração manual de banco ou Node.js) ou **Localmente** diretamente na sua máquina.

---

## Opção 1: Rodando com Docker (Recomendado)

### Pré-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução.

### Passo a passo

1. Clone o repositório e entre na pasta do projeto:

```bash
git clone https://github.com/StevegitXz/Norte-Eventos.git
cd Norte-Eventos
```

2. Suba a aplicação e o banco MySQL com um único comando:

```bash
docker compose up -d --build
```

3. Aguarde a criação das imagens e do banco de dados. Em seguida acesse:
   - **Aplicação:** `http://localhost:3000`
   - **Wiki / Documentação:** `http://localhost:3000/wiki`
   - **MySQL (acesso externo opcional):** `localhost:3307` (usuário `norte_user` / senha `norte123` / banco `norte_eventos`)

> [!IMPORTANT]
> No `docker-compose.yml`, a porta externa do MySQL foi definida como `3307` (`3307:3306`) para evitar conflito caso você já tenha XAMPP ou MySQL local ocupando a porta `3306`. Dentro da rede interna do Docker, o container `app` conversa com o container `db` na porta `3306` usando `DB_HOST=db`.

### Comandos Docker úteis

| Ação | Comando |
|---|---|
| Subir / reconstruir após editar código | `docker compose up -d --build` |
| Ver status dos containers | `docker compose ps` |
| Acompanhar logs do servidor Node.js | `docker compose logs -f app` |
| Acompanhar logs do MySQL | `docker compose logs -f db` |
| Parar containers (mantendo dados) | `docker compose down` |
| Parar e apagar dados do banco (reset total) | `docker compose down -v` |

---

## Opção 2: Rodando Localmente (Sem Docker)

### Pré-requisitos
- **Node.js** (v20 ou v22 recomendado)
- Servidor **MySQL 8.0** ativo

### Passo a passo

1. Instale as dependências:

```bash
npm install
```

2. Copie o arquivo `.env.example` para `.env` na raiz do projeto e ajuste suas credenciais:

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000

# Mínimo de 32 caracteres obrigatório
JWT_SECRET=substitua_por_uma_chave_secreta_forte_com_mais_de_32_caracteres

DB_HOST=localhost
DB_PORT=3306
DB_NAME=norte_eventos
DB_USER=root
DB_PASSWORD=sua_senha_mysql
```

3. Crie o banco `norte_eventos` no MySQL e execute o script `docker/init.sql` para criar todas as 4 tabelas (`usuarios`, `eventos`, `inscricoes` e `notificacoes`).

4. Inicie o servidor:

```bash
# Modo desenvolvimento (Express com nodemon + Tailwind em modo watch)
npm run dev

# Ou compilar CSS e iniciar em modo padrão
npm run build:css
npm start
```

---

## Scripts disponíveis no `package.json`

| Script | O que faz |
|---|---|
| `npm start` | Inicia o servidor com `node backend/server.js` |
| `npm run dev:server` | Inicia o backend com recarregamento automático (`nodemon`) |
| `npm run dev:css` | Monitora `frontend/css/input.css` e recompila o Tailwind ao salvar |
| `npm run build:css` | Gera o arquivo minificado `frontend/css/tailwind.css` |
| `npm run dev` | Executa `dev:server` e `dev:css` simultaneamente com `concurrently` |
