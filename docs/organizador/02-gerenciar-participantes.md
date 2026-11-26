# Gestão de Participantes

Cada evento criado por você possui uma tela dedicada para acompanhar a lotação e administrar os inscritos em tempo real.

---

## 1. Visualizando a lista de inscritos

1. Acesse **Meus Eventos** no menu lateral do `/dashboard`.
2. No card do evento desejado, clique em **Gerenciar Inscrições**.
3. A área de gestão exibe:
   - Resumo do evento (título, data, local e total de vagas ocupadas vs. capacidade).
   - Lista de participantes confirmados com nome, e-mail e data da inscrição.

---

## 2. Adicionando um participante manualmente

Organizadores podem inscrever usuários cadastrados diretamente pelo e-mail:

1. Dentro da tela **Gerenciar Inscrições**, informe o **e-mail do usuário** no campo de adição manual.
2. Clique em **Adicionar Participante**.
3. O sistema valida automaticamente:
   - Se o e-mail pertence a uma conta existente na plataforma.
   - Se o usuário já não está inscrito no evento.
   - Se ainda existem vagas disponíveis dentro da capacidade definida.
4. O participante é adicionado à lista e recebe uma notificação no sistema.

> [!NOTE]
> Para evitar enumeração massiva de e-mails, a adição manual de participantes possui limite de **20 requisições a cada 15 minutos** por IP (`addParticipantLimiter`).

---

## 3. Removendo um participante

1. Na lista de inscritos do evento, localize o participante desejado.
2. Clique no botão **Remover** ao lado do nome.
3. Confirme a ação:
   - O vínculo em `inscricoes` é removido.
   - O contador `inscritos` do evento é decrementado com segurança (`GREATEST(inscritos - 1, 0)`), liberando imediatamente a vaga.
   - O usuário removido recebe uma notificação sobre a alteração.
