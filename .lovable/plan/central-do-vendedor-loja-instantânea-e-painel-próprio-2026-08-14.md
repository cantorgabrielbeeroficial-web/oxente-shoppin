# Central do Vendedor: loja instantânea e painel próprio

## 1. Cadastro sem aprovação

- A tela "Vender no Oxente" passa a criar a loja na hora: ao enviar "Nome da loja" + "O que você vende", o sistema cria a loja ativa, dá o papel de vendedor ao usuário e redireciona direto para o painel.
- Texto "Após a aprovação, você poderá cadastrar produtos" removido; nada de fila de análise nem lista de solicitações.
- Se o usuário já tiver loja, a tela redireciona automaticamente para o painel.

## 2. Painel da loja (nova tela `/painel`)

- **Identidade**: editar nome, descrição, enviar/trocar **logo** (foto de perfil) e **capa** (banner superior), com pré-visualização de como a vitrine aparece.
- **Produtos**: listar, criar, editar (nome, descrição, preço, estoque, categoria, foto) e ativar/desativar — liberado imediatamente após criar a loja.
- **Pedidos da loja**: lista dos pedidos recebidos com status e valor líquido do repasse (já existente no banco).
- A página pública da loja (`/loja/{slug}`) passa a exibir a capa enviada pelo lojista.

## 3. Sem travas de e-mail

- Confirmação de e-mail desativada nesta fase: quem se cadastra entra e acessa o painel na hora.

## Detalhes técnicos

- **Migração**: adicionar `banner_url` em `stores`; criar bucket público `store-assets` com políticas de upload/edição restritas ao dono da loja; permitir que o próprio usuário crie sua loja (política de INSERT em `stores` com `owner_id = auth.uid()`) e que ganhe o papel `seller` via função `security definer` (`create_my_store`), mantendo `user_roles` sem INSERT direto do cliente. `seller_applications` fica intocada (sem uso na UI).
- **Server functions** em `src/lib/seller.functions.ts` com `requireSupabaseAuth`: `createMyStore`, `getMyStore`, `updateMyStore`, `listMyProducts`, `upsertProduct`, `toggleProduct`, `listMyStoreOrders`.
- **Rotas**: `src/routes/_authenticated/painel.tsx` (abas Loja / Produtos / Pedidos); `vender.tsx` simplificado para o formulário de criação + redirecionamento.
- **Auth**: habilitar auto-confirmação de e-mail nas configurações do backend.
- Uploads via bucket `store-assets` usando o cliente do navegador; caminhos por `store_id`.
