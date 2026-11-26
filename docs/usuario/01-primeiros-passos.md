# Cadastro e Login

Para explorar a programação completa, se inscrever em eventos ou publicar seus próprios encontros, é necessário possuir uma conta gratuita no **Norte Eventos**.

---

## 1. Criando sua conta

1. Acesse a página inicial (`/`) e clique em **Criar Conta Gratuita** (ou acesse diretamente `/cadastro`).
2. Preencha os campos do formulário:
   - **Nome completo:** como você será identificado nos eventos e listas de presença.
   - **E-mail:** endereço válido e único no sistema (não é possível cadastrar dois usuários com o mesmo e-mail).
   - **Senha:** crie uma senha segura. Você pode clicar no ícone de olho ao lado do campo para visualizar o que está digitando.
3. Clique em **Criar minha conta**.

> [!NOTE]
> Por segurança, sua senha nunca é salva em texto puro no banco de dados. Ela é transformada em um hash irreversível usando `bcrypt`.

---

## 2. Fazendo login

1. Acesse `/login` (ou clique em **Entrar** no topo da página inicial).
2. Informe o **e-mail** e a **senha** cadastrados.
3. Clique em **Entrar na conta**.
4. Ao autenticar com sucesso, você será redirecionado automaticamente para o **Painel de Controle (`/dashboard`)**.

### Proteção contra tentativas excessivas

> [!WARNING]
> Para proteger sua conta contra ataques de força bruta, o sistema limita as rotas de login e cadastro a **15 tentativas a cada 15 minutos** por endereço IP. Se ultrapassar o limite, aguarde alguns minutos antes de tentar novamente.

---

## 3. Sessão e Segurança

- A sessão utiliza um token **JWT** armazenado em cookie seguro `HttpOnly`, com validade de **7 dias**.
- Caso tente acessar `/dashboard` sem estar autenticado (ou após a expiração do token), o sistema redireciona automaticamente para `/login`.

---

## 4. Saindo da conta (Logout)

Para encerrar sua sessão com segurança — especialmente em computadores compartilhados (como laboratórios do IFAC):

1. No menu lateral esquerdo do painel (`/dashboard`), clique no botão **Sair** na parte inferior.
2. O cookie de autenticação é limpo imediatamente no servidor e você retorna para a tela de login.
