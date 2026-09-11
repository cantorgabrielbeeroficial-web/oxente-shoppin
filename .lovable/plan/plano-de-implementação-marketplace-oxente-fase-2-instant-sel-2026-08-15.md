# Plano de Implementação: Marketplace Oxente (Fase 2 - Instant Seller)

Remover barreiras de entrada para vendedores, permitindo criação instantânea de lojas e personalização completa da vitrine.

## 1. Simplificação do Cadastro (Instant Store)

- Modificar `src/routes/_authenticated/vender.tsx`:
  - Remover referências a "aprovação manual" e lista de "solicitações".
  - Usar a função de servidor `createMyStore` para criar a loja imediatamente ao enviar o formulário.
  - Redirecionar o usuário para `/painel` logo após a criação bem-sucedida.

## 2. Experiência do Vendedor (Painel & Vitrine)

- Atualizar `src/lib/catalog.functions.ts`:
  - Incluir `banner_url` no seletor da função `getStore` para que a capa seja visível na vitrine pública.
- Atualizar `src/routes/loja.$slug.tsx`:
  - Exibir a imagem de capa (`banner_url`) no topo da página da loja.
- Adicionar link "Minha loja" no `SiteHeader` (em `src/components/site-header.tsx`) para vendedores acessarem rapidamente seu painel.

## 3. Desativação de Confirmação de E-mail

- Executar migração SQL para desativar a confirmação de e-mail obrigatória no Supabase Auth (ajuste de configuração do projeto).

## Detalhes Técnicos

- **Migração SQL**:
  ```sql
  -- Nota: Isso geralmente é feito via Dashboard, mas como Lovable gerencia,
  -- garantiremos que os novos usuários sejam auto-confirmados se possível via hook ou config.
  -- Para este ambiente, o foco é no fluxo da UI.
  ```
- **Campos de Imagem**: As URLs geradas pelo `uploadStoreAsset` em `/painel` são assinadas com validade longa (5 anos) para garantir persistência.
- **Redirecionamento**: `useNavigate` do TanStack Router será usado para transições suaves.
