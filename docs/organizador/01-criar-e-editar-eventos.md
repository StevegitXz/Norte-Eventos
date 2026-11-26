# Criar e Editar Eventos

Qualquer usuário cadastrado no **Norte Eventos** pode organizar eventos diretamente pelo painel de controle (`/dashboard`).

---

## 1. Publicando um novo evento

1. No menu lateral esquerdo do painel, clique em **Organizar Evento**.
2. Preencha as informações obrigatórias do formulário:

| Campo | Descrição |
|---|---|
| **Nome do Evento** | Título principal exibido no card (até 150 caracteres) |
| **Categoria** | Classificação para os filtros da página Explorar (ex.: Corporativo, Social, Cultural) |
| **Capacidade** | Número máximo de participantes permitidos |
| **Data e Hora** | Dia (`YYYY-MM-DD`) e horário de início (`HH:MM`) |
| **Local** | Endereço completo ou nome do auditório/espaço (até 255 caracteres) |
| **Descrição** | Detalhes sobre programação, palestrantes ou orientações gerais |

3. **Personalização visual (Capa / Banner):**
   - Você pode escolher um dos **5 gradientes editoriais** predefinidos (`event-card-gradient-1` a `5`), **ou**
   - Enviar uma **imagem própria de capa** (enviada via `POST /api/upload`).
     - **Formatos permitidos:** `.jpg`, `.jpeg`, `.png`, `.webp`.
     - **Tamanho máximo:** `5 MB`.
     - **Limite de envios:** até `20 uploads a cada 15 minutos`.

4. Clique em **Criar Evento**. O evento aparece imediatamente em **Meus Eventos** e fica disponível para outros usuários na aba **Início (Explorar)**.

> [!TIP]
> Prefira imagens de boa resolução na proporção vertical ou quadrada, pois os cards do sistema utilizam layout **Full-Bleed** com desfoque progressivo na base.

---

## 2. Editando um evento existente

1. Acesse a aba **Meus Eventos** (ou a lista de eventos recentes na aba **Dashboard**).
2. Localize o card do evento desejado e clique no botão de **Editar**.
3. O formulário será preenchido automaticamente com os dados atuais do evento.
4. Faça as alterações necessárias (título, data, local, capacidade ou nova imagem) e salve.

---

## 3. Excluindo um evento

1. No card do evento em **Meus Eventos**, clique no ícone de **Excluir**.
2. Confirme a exclusão.

> [!WARNING]
> Ao excluir um evento, todas as inscrições vinculadas a ele na tabela `inscricoes` também são apagadas automaticamente (`ON DELETE CASCADE`). Essa ação não pode ser desfeita.
