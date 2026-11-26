# Segurança, Design System e Acessibilidade

Este guia documenta as camadas de proteção implementadas no servidor, o padrão visual adotado no frontend e as práticas de acessibilidade (**a11y**) do **Norte Eventos**.

---

## 1. Controles de Segurança

### Autenticação e Senhas
- **Hash de Senhas:** uso de `bcrypt` antes de persistir qualquer senha no MySQL.
- **JWT Obrigatório:** o servidor recusa iniciar (`process.exit(1)`) se `JWT_SECRET` estiver ausente ou tiver menos de **32 caracteres**.
- **Cookies Seguros:** o token JWT é gravado em cookie com `httpOnly: true` (invisível ao JavaScript contra XSS), `sameSite: 'lax'` (mitigação CSRF) e `secure: true` automaticamente quando `NODE_ENV=production`.

### Proteção de API e Uploads
- **CORS com Whitelist:** aceita apenas origens definidas em `CORS_ORIGIN` (padrão `http://localhost:3000` e `http://127.0.0.1:3000`).
- **Rate Limiting (`express-rate-limit`):**
  - Global `/api`: `150 req / 15 min`
  - Login e Cadastro: `15 req / 15 min`
  - Atualização de Perfil/Senha: `15 req / 15 min`
  - Adição Manual de Participantes: `20 req / 15 min`
  - Uploads de Capa: `20 req / 15 min`
- **Validação Rigorosa de Uploads (`multer`):** aceita somente extensão **e** MIME type de `image/jpeg`, `image/png` ou `image/webp`, gera nomes aleatórios sem confiar no nome original do arquivo e aplica `Content-Security-Policy: default-src 'none'; img-src 'self'` ao servir `/uploads`.
- **Cabeçalhos HTTP:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` e desativação de `X-Powered-By`.
- **SQL Seguro:** todas as consultas usam *Prepared Statements* (`pool.execute` com placeholders `?`), prevenindo SQL Injection.
- **Wiki Segura:** a API `/api/wiki/pagina` consulta uma whitelist fixa (`docs/manifest.json`) e valida o caminho resolvido, bloqueando tentativas de *Path Traversal* (`../../.env`).

---

## 2. Design System Editorial (Tailwind CSS v4)

Os tokens visuais são centralizados em `frontend/css/input.css` via diretiva `@theme`:

| Token | Valor | Uso principal |
|---|---|---|
| `--color-brand-green` | `#0F5338` | Cor primária (Verde-Floresta Amazônica) |
| `--color-brand-green-light` | `#167952` | Estados hover e destaque secundário |
| `--color-brand-emerald` | `#10B981` | Acentos em modo escuro e indicadores positivos |
| `--color-brand-amber` | `#D97706` | Badges de destaque, alertas e notificações |
| `--color-brand-dark` | `#0B1914` | Textos principais e superfícies escuras |
| `--color-brand-light` | `#F7F7F4` | Fundo editorial quente |

- **Tipografia:** `Outfit` para títulos (`h1`–`h6`) e `Plus Jakarta Sans` para textos de interface.
- **Cards Full-Bleed Progressive Blur:** utilitários `.card-progressive-blur` e `.card-scrim-gradient` aplicados nos cards da Landing Page e do Dashboard.

---

## 3. Acessibilidade (a11y)

Conforme documentado em `RESUMO_ACESSIBILIDADE.md`, o projeto inclui:

- **Skip Link na Home e na Wiki:** atalho acessível via `Tab` para saltar diretamente ao `<main>` sem percorrer toda a navegação.
- **Semântica HTML e ARIA:** uso de `<header>`, `<nav aria-label="...">`, `<main>`, `<aside>` e `<footer>`.
- **Foco Visível por Teclado:** classes `focus-visible:ring-2` nos campos de login, cadastro, botões e controles interativos.
- **Seletor de Banners Acessível:** opções de gradiente implementadas com `<button type="button" role="radio" aria-checked="...">`.
- **Modais e Notificações:** diálogos com `role="dialog"` e `aria-modal="true"`; lista de notificações com `role="region"` e `aria-live="polite"`, além de textos `.sr-only` para leitores de tela.
