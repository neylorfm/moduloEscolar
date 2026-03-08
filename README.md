This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Guia de Deploy (Para o Público do GitHub)

Este projeto foi construído com Next.js e é projetado para ser hospedado no **Cloudflare Pages**, utilizando o **Supabase** como banco de dados e provedor de autenticação.

Siga os passos abaixo para fazer o deploy da sua própria versão deste sistema:

### 1. Configurando o Banco de Dados (Supabase)
O Supabase cuidará da autenticação (GoTrue) e do banco de dados PostgreSQL.

1. Crie uma conta e um novo projeto no [Supabase](https://supabase.com/).
2. No painel do seu novo projeto, vá até o **SQL Editor**.
3. Copie o conteúdo completo do arquivo `supabase/schema.sql` (encontrado na raiz deste repositório) e execute-o. Isso irá criar as tabelas necessárias e ativar a segurança RLS (Row Level Security).
4. Vá em **Project Settings -> API** e copie os valores de:
   - `Project URL`
   - `anon` `public` key 
   - `service_role` `secret` key (mantenha isso sāo salvo!)

### 2. Configurando o Cloudflare Pages
1. Crie uma conta no [Cloudflare](https://dash.cloudflare.com/) e vá para **Workers & Pages**.
2. Clique em **Create application** -> **Pages** -> **Connect to Git** e selecione o seu *fork* deste repositório no GitHub.
3. Nas configurações de *Build e Deploy*:
   - **Framework preset:** Next.js
   - **Build command:** `npx @cloudflare/next-on-pages`
   - **Build output directory:** `.vercel/output/static`
4. Na seção **Environment Variables** (Variáveis de Ambiente), adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`: (Sua URL do Supabase)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Sua chave anon pública do Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY`: (Sua chave service_role do Supabase)
5. Clique em **Save and Deploy**. O Cloudflare fará o build do Next.js e hospedará o seu site!

### 3. Criando o Administrador Inicial
Para que você possa acessar o sistema como administrador pela primeira vez, o processo é feito em duas etapas no **Supabase**:

**Passo A: Convidar o usuário**
1. No painel do seu projeto Supabase, acesse **Authentication** (ícone de usuários na barra lateral esquerda).
2. Vá na aba **Users** e clique no botão **Add user** -> **Send invite**.
3. Digite o email do novo administrador e confirme. O usuário receberá um email com um link de confirmação para definir a senha.

**Passo B: Conceder o acesso de Administrador no banco**
1. Volte para a aba **SQL Editor** no painel do Supabase.
2. Você precisará executar o script abaixo. Antes de rodar, substitua cuidadosamente os valores entre colchetes pelos seus dados reais:
   - Troque `[NOME_COMPLETO_AQUI]` pelo seu nome completo (ex: `'João da Silva'`).
   - Troque `[APELIDO_AQUI]` pelo nome pelo qual deseja ser chamado no sistema (ex: `'João'`).
   - Troque `[EMAIL_CONVIDADO_NO_PASSO_A]` **exatamente** pelo mesmo e-mail que você enviou o convite no Passo A.

```sql
INSERT INTO public.usuarios (id, nome, email, alias, tipo)
SELECT 
    id, 
    '[NOME_COMPLETO_AQUI]', 
    email, 
    '[APELIDO_AQUI]', 
    'administrador'
FROM auth.users 
WHERE email = '[EMAIL_CONVIDADO_NO_PASSO_A]';
```
*Pronto! Assim que a pessoa clicar no link do e-mail recebido e escolher uma senha, ela terá nível de administrador no sistema.*

### 4. Como Alterar o E-mail de um Usuário (Para Administradores)

Por motivos de segurança e integridade de dados, a alteração de e-mail de acesso não é feita diretamente pela interface do sistema. Caso um usuário precise alterar o seu e-mail de login, um administrador com acesso ao painel do Supabase deve realizar o seguinte procedimento manual:

1. Acesse o painel do seu projeto no **Supabase**.
2. Vá no menu lateral na opção **Authentication** -> **Users**.
3. Encontre o usuário na lista. Clique no e-mail antigo dele e altere para o novo e-mail. Confirme a alteração. *(Se a verificação de e-mail segura estiver ativada, o usuário receberá um link no novo e-mail para confirmar).*
4. Em seguida, vá no menu lateral esquerdo em **Table Editor** e abra a tabela `usuarios`.
5. Localize a linha pertencente ao usuário que você acabou de alterar.
6. Atualize o campo `email` dessa linha para ser **exatamente** igual ao novo e-mail inserido no passo 3.

Isso garantirá que o usuário consiga fazer login com o novo e-mail e que suas permissões no banco de dados continuem funcionando perfeitamente.
