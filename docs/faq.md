# Perguntas Frequentes (FAQ)

Reunimos abaixo as dúvidas mais comuns tanto para **usuários da plataforma** quanto para **desenvolvedores e professores** ao executar o sistema.

---

## Dúvidas de Usuários

### Não consigo me inscrever em um evento. O que pode ser?
Verifique três regras do sistema:
1. **Você é o organizador:** o criador do evento não pode se inscrever como participante no próprio evento.
2. **Você já está inscrito:** cada conta pode reservar apenas uma vaga por evento.
3. **Evento lotado:** quando o total de inscritos atinge a capacidade máxima, novas inscrições são bloqueadas até alguém cancelar.

### Por que minha foto de perfil ou capa do evento foi recusada?
Por segurança, o servidor aceita apenas imagens nos formatos **JPG, JPEG, PNG ou WEBP**, respeitando o limite de tamanho:
- **Foto de perfil:** máximo `2 MB`.
- **Capa de evento:** máximo `5 MB`.

### Apareceu a mensagem "Muitas tentativas de acesso". O que fazer?
O sistema possui proteção contra força bruta (`express-rate-limit`), permitindo até **15 tentativas a cada 15 minutos** no login/cadastro. Basta aguardar alguns minutos e tentar novamente com as credenciais corretas.

---

## Dúvidas de Desenvolvedores (Docker e Local)

### O servidor fechou com erro `JWT_SECRET ausente ou muito curto`
O `backend/server.js` exige que a variável `JWT_SECRET` tenha **pelo menos 32 caracteres**. Verifique seu `.env` ou o `docker-compose.yml` e defina uma chave longa.

### A porta `3000` ou `3306` já está em uso
- Se houver outro servidor na porta `3000`, altere `PORT=3001` no `.env` antes de rodar `docker compose up -d`.
- O MySQL do Docker já usa a porta externa **`3307`** por padrão para não conflitar com XAMPP ou MySQL local na `3306`.

### Fiz uma alteração no código, mas o Docker não atualizou
Ao alterar arquivos de `backend/`, `frontend/` ou `docs/`, reconstrua a imagem com:

```bash
docker compose up -d --build
```

### Quero apagar todos os dados de teste e começar o banco do zero
Remova os containers junto com o volume `mysql_data` e suba novamente — o MySQL executará o `docker/init.sql` do zero automaticamente:

```bash
docker compose down -v
docker compose up -d --build
```

### Como verifico se o banco de dados dentro do Docker está funcionando?
Execute:

```bash
docker compose ps
docker compose exec -T db mysql -u norte_user -pnorte123 -e "SHOW TABLES;" norte_eventos
```

O status do serviço `norte-eventos-db` deve estar `Up (healthy)` e o comando deve listar as 4 tabelas: `eventos`, `inscricoes`, `notificacoes` e `usuarios`.
