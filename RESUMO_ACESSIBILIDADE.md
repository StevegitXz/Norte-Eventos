# Resumo das Alterações de Acessibilidade e Limpeza

Este documento resume as melhorias mínimas de acessibilidade (**a11y**) e a remoção dos arquivos da skill instalada no projeto **Norte Eventos**.

---

## 1. Limpeza de Arquivos
- **Remoção de dependências de skills:**
  - Excluída a pasta `.agents/`.
  - Excluído o arquivo `skills-lock.json`.
  - O projeto voltou ao estado limpo sem rastros de ferramentas externas.

---

## 2. Melhorias Básicas de Acessibilidade (a11y)

### A. Página Inicial (`frontend/pages/Home.html`)
- **Skip Link (Atalho de navegação):** Adicionado um link acessível via teclado (`Tab`) que permite aos usuários de leitores de tela saltar diretamente para `#conteudo-principal`, evitando ter que passar por todos os links da barra de navegação.
- **Marcação Semântica:** 
  - Adicionado atributo `aria-label="Navegação principal"` na tag `<nav>`.
  - Envolvido o conteúdo central na tag semântica `<main id="conteudo-principal">`.
- **Textos Alternativos de Imagens (`alt`):**
  - Ajustado o logotipo com descrição clara: `alt="Logotipo Norte Eventos"`.
  - Imagens decorativas de fundo receberam `alt="" aria-hidden="true"`, evitando leitura redundante em leitores de tela.
  - Imagens de conteúdo receberam descrições mais precisas.

---

### B. Telas de Autenticação (`frontend/pages/login.html` e `frontend/pages/cadastroUser.html`)
- **Contraste de Texto:**
  - Aumentada a opacidade dos rótulos dos campos (de `text-white/75` para `text-white/90`), melhorando a legibilidade e contraste sobre o fundo verde.
- **Foco Visível por Teclado:**
  - Adicionado anel de foco evidente (`focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2`) nos inputs de e-mail, senha e nome, permitindo que usuários que navegam via `Tab` identifiquem claramente o campo ativo.
- **Acessibilidade dos Rótulos:**
  - Ajustada a identificação do logotipo (`Logotipo Norte Eventos`).

---

### C. Painel de Controle (`frontend/pages/dashboard.html`)
- **Seletor de Cores de Banner:**
  - Substituídas as `<div>` não focáveis por `<button type="button" role="radio">` com atributos `aria-checked` e `aria-label`, permitindo seleção e foco via teclado.
- **Acessibilidade de Diálogos e Modais:**
  - Modal de criação de evento configurado com `role="dialog"`, `aria-modal="true"` e `aria-labelledby="modal-title"`.
  - Botão de fechar recebeu o atributo `aria-label="Fechar modal"`.
- **Notificações em Tempo Real:**
  - Lista de notificações recebeu `role="region"` e `aria-live="polite"` para anúncio automático quando novas mensagens chegarem.
  - O indicador de notificação (badge vermelho) recebeu texto para leitores de tela (`<span class="sr-only">Novas notificações pendentes</span>`).
