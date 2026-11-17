# VINICIO FERREIRA — Catálogo online

Projeto React + Vite + Supabase. A vitrine é acessível por link, sem login. O painel fica em `/admin`. Os pedidos são encaminhados ao WhatsApp **(85) 98221-2446**.

## 1. O que está pronto

- Catálogo com busca e filtro por categoria.
- Cards com imagem, descrição e preço.
- Botão “Comprar pelo WhatsApp” com mensagem preenchida.
- Login administrativo pelo Supabase Auth.
- Cadastro, edição, ativação/desativação e exclusão de produtos.
- Upload de imagens no bucket `produtos`.
- Campo de link do fornecedor no painel; não aparece na vitrine.
- Layout responsivo para celular.

## 2. Antes de publicar

No Supabase, confirme:
- Tabelas `products`, `categories` e `store_admins` criadas.
- Função `public.is_store_admin()` e políticas administrativas já configuradas.
- Bucket `produtos` marcado como **Public**.
- Usuário administrador criado no Authentication e registrado em `store_admins`.

Depois, abra o **SQL Editor** e execute o conteúdo de `supabase-security.sql`. Ele adiciona a leitura administrativa de itens inativos e cria a view pública `catalog_products`, sem expor o link do fornecedor aos visitantes.

> Não publique a chave `service_role` nem a senha do administrador. O site usa apenas a chave publishable/anon do Supabase.

## 3. Configurar no computador

Instale Node.js LTS. Extraia o ZIP e, dentro da pasta do projeto, crie um arquivo chamado `.env` com:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLISHABLE
```

Use os valores do seu projeto Supabase. Em seguida, execute:

```bash
npm install
npm run dev
```

Para testar a versão de produção:

```bash
npm run build
npm run preview
```

A pasta pronta para hospedagem será `dist`.

## 4. Publicar com link compartilhável

Uma opção gratuita é Cloudflare Pages:
1. Crie um repositório no GitHub e envie os arquivos deste projeto.
2. No Cloudflare Pages, conecte o repositório.
3. Build command: `npm run build`
4. Build output directory: `dist`
5. Cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas variáveis de ambiente do projeto.
6. Publique. O endereço gerado poderá ser compartilhado com seus clientes.

O catálogo não depende de aparecer em mecanismos de busca; não há necessidade de divulgar ou cadastrar o endereço neles. Qualquer pessoa que receber o link poderá acessar.

## 5. Acesso administrativo

Acesse `SEU-LINK/admin` e entre com o e-mail e a senha do usuário criado no Supabase Authentication. Não compartilhe a senha. Se esquecer, redefina-a pelo painel do Supabase.

## 6. Observações

- O número de WhatsApp está configurado no arquivo `src/App.jsx`, no formato internacional `5585982212446`.
- Os links de fornecedor são guardados na coluna `shopee_url`, mas a vitrine pública usa uma view que não retorna essa coluna.
- Este ZIP contém o código-fonte; ele ainda precisa ser configurado e publicado na sua conta de hospedagem para gerar o link final.
