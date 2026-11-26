# Notificações e Perfil

O **Norte Eventos** oferece uma central de avisos no topo do painel e uma área dedicada de configurações para manter seus dados sempre atualizados.

---

## 1. Central de Notificações

No canto superior direito do painel (`/dashboard`), clique no ícone de **sino** para abrir suas notificações:

- Um ponto âmbar piscando sobre o sino indica que existem **notificações não lidas**.
- Clique em uma notificação para marcá-la como **lida**.
- Use o botão **Limpar todas** para remover todas as notificações da sua caixa.

> [!NOTE]
> Organizadores recebem notificações quando novos participantes se inscrevem ou cancelam presença em seus eventos. Participantes também são avisados quando adicionados manualmente ou removidos de um evento.

---

## 2. Modo Claro e Modo Escuro

No topo do painel, ao lado do sino de notificações, clique no botão de **Tema (Sol/Lua)** para alternar entre o modo claro editorial e o modo escuro. Sua preferência fica salva automaticamente no navegador (`localStorage`) e também é respeitada nesta Wiki.

---

## 3. Editando seu Perfil

Para abrir as **Configurações**, clique no seu **cartão de perfil** no topo da barra lateral esquerda do dashboard:

### Dados pessoais e foto de perfil
- Altere seu **Nome** ou **E-mail**.
- Para trocar sua **Foto de Perfil**, clique na área de upload de avatar e selecione uma imagem do computador.
  - **Formatos aceitos:** `.jpg`, `.jpeg`, `.png` e `.webp`.
  - **Tamanho máximo:** `2 MB`.

### Alterando a senha
- Para trocar sua senha, informe a **Senha atual** e defina a **Nova senha**.
- Por segurança, a rota de atualização de perfil limita tentativas para `15 requisições a cada 15 minutos`.

---

## 4. Exclusão de Conta

> [!WARNING]
> A exclusão de conta é **permanente e irreversível**. Ao excluir sua conta:
> - Seu cadastro na tabela `usuarios` é apagado.
> - Todos os eventos organizados por você e suas inscrições/notificações são removidos automaticamente em cascata (`ON DELETE CASCADE`).
> - Sua sessão é encerrada imediatamente.
