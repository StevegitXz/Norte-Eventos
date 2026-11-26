# Referência da API REST

Todos os endpoints da API ficam sob o prefixo `/api` e utilizam JSON (limite de payload `10kb`, exceto rotas de upload `multipart/form-data`).

- **Rate Limit Global (`/api`):** `150 requisições` a cada `15 minutos` por IP.
- **Autenticação:** cookie `HttpOnly` contendo token JWT assinado com `JWT_SECRET` (enviado automaticamente pelo navegador com `credentials: 'include'`).

---

## 1. Usuários (`/api/usuarios`)

| Método | Rota | Autenticação | Rate Limit | Descrição |
|---|---|---|---|---|
| `POST` | `/api/usuarios` | Pública | 15 / 15min | Cadastra novo usuário (`nome`, `email`, `senha`) |
| `POST` | `/api/usuarios/login` | Pública | 15 / 15min | Autentica e grava cookie JWT `HttpOnly` |
| `GET` | `/api/usuarios/me` | Privada | Global | Retorna dados do usuário autenticado |
| `PUT` | `/api/usuarios/me` | Privada | 15 / 15min | Atualiza perfil, senha e/ou `foto_perfil` (`multipart/form-data`, máx. 2MB) |
| `DELETE` | `/api/usuarios/me` | Privada | Global | Exclui permanentemente a conta e encerra sessão |
| `POST` | `/api/usuarios/logout` | Pública | Global | Remove o cookie de autenticação |

### Exemplo de Login (`POST /api/usuarios/login`)

```json
{
  "email": "usuario@exemplo.com",
  "senha": "MinhaSenhaForte123"
}
```

---

## 2. Eventos (`/api/eventos`)

Todas as rotas abaixo exigem autenticação via `verificarAutenticacao`.

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/eventos/explorar` | Lista eventos públicos de outros organizadores (inclui flag `inscrito` e `criador_nome`) |
| `GET` | `/api/eventos` | Lista eventos criados pelo usuário logado |
| `POST` | `/api/eventos` | Cria um novo evento |
| `PUT` | `/api/eventos/:id` | Atualiza um evento pertencente ao usuário logado |
| `DELETE` | `/api/eventos/:id` | Exclui um evento pertencente ao usuário logado |
| `POST` | `/api/eventos/:id/inscrever` | Realiza inscrição do usuário logado no evento |
| `DELETE` | `/api/eventos/:id/inscrever` | Cancela a inscrição do usuário logado |
| `GET` | `/api/eventos/:id/participantes` | Lista participantes inscritos (somente organizador do evento) |
| `POST` | `/api/eventos/:id/participantes` | Adiciona participante por e-mail (limite: `20 req / 15min`) |
| `DELETE` | `/api/eventos/:id/participantes/:participanteId` | Remove participante da lista do evento |

### Exemplo de Criação de Evento (`POST /api/eventos`)

```json
{
  "nome": "Semana de Tecnologia do IFAC",
  "categoria": "Corporativo",
  "capacidade": 120,
  "data": "2026-12-10",
  "hora": "14:00",
  "local": "Auditório Central — Rio Branco, AC",
  "descricao": "Palestras, oficinas práticas e projetos integradores.",
  "bannerClass": "event-card-gradient-1",
  "imagem_url": "/uploads/1732567890-123456.jpg"
}
```

---

## 3. Uploads (`/api/upload`)

| Método | Rota | Autenticação | Rate Limit | Descrição |
|---|---|---|---|---|
| `POST` | `/api/upload` | Privada | 20 / 15min | Envia imagem de capa do evento no campo `imagem` (`jpeg`, `jpg`, `png`, `webp`; máx. `5MB`) |

**Resposta `200 OK`:**

```json
{
  "url": "/uploads/1732567890123-456789123.webp"
}
```

---

## 4. Notificações (`/api/notificacoes`)

Todas as rotas exigem autenticação.

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/notificacoes` | Lista notificações do usuário logado ordenadas por data |
| `PUT` | `/api/notificacoes/:id/lida` | Marca uma notificação específica como lida |
| `DELETE` | `/api/notificacoes` | Remove todas as notificações do usuário logado |

---

## 5. Documentação / Wiki (`/api/wiki`)

Endpoints públicos utilizados por esta própria Wiki (`/wiki`):

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/wiki/indice` | Retorna a árvore de categorias, páginas e resumos indexáveis para busca |
| `GET` | `/api/wiki/pagina?slug=...` | Retorna o conteúdo Markdown e metadados da página solicitada (validada por whitelist) |
