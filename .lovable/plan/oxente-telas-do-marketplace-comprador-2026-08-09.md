# Oxente — Telas do marketplace (comprador)

O backend está pronto: 6 categorias, 1 loja de demonstração e 8 produtos com fotos já no banco. Agora construo as telas da experiência de compra, com a mecânica da Shopee: várias lojas dentro da plataforma, vitrine única, carrinho que separa por loja e pedido gerado por loja.

## Antes de tudo: corrigir o build

O build está falhando no wrapper de login social (`src/integrations/lovable/index.ts`): ele repassa `redirect_uri` como opcional, mas a versão instalada do pacote exige um valor. Correção: tornar `redirect_uri` obrigatório na assinatura e sempre passar `window.location.origin` na tela de login.

## Depois: alinhar o código ao banco

`src/lib/types.ts` e `src/lib/format.ts` foram escritos com nomes que não existem no banco. Vou corrigi-los para o schema real:

- Status do pedido: `pendente, confirmado, enviado, entregue, cancelado` (não pending/paid/...).
- Endereço usa `district` (bairro), não `neighborhood`.
- Pedido tem `total`, `shipping_recipient` e `shipping_address`; não tem subtotal/frete separados.
- Loja não tem `is_official`; perfil não tem telefone.

## Telas desta etapa

- **Cabeçalho e rodapé** (no layout raiz): logo Oxente, busca central, atalhos de carrinho, entrar/minha conta, "Vender no Oxente". Menu de categorias abaixo.
- **Home (`/`)**: banner da marca, faixa de categorias com ícones, "Ofertas do dia" e grade de produtos de todas as lojas com preço, loja vendedora e estoque.
- **Busca (`/buscar`)**: campo de texto + filtro por categoria, ordenação (mais recentes, menor preço, maior preço), grade com estado vazio amigável.
- **Categoria (`/categoria/$slug`)**: mesma grade filtrada pela categoria.
- **Produto (`/produto/$id`)**: foto grande, nome, preço, estoque, descrição, cartão da loja vendedora com link, seletor de quantidade e "Adicionar ao carrinho" / "Comprar agora". Sugestões da mesma categoria.
- **Loja (`/loja/$slug`)**: capa com logo e descrição da loja + produtos dela.
- **Carrinho (`/carrinho`)**: itens agrupados por loja (como na Shopee), alterar quantidade, remover, subtotal por loja e total geral. Se não estiver logado, convite para entrar.
- **Checkout (`/checkout`)**: escolher endereço salvo ou cadastrar novo, revisão do pedido por loja, confirmar. Cria um pedido por loja, baixa o estoque, limpa o carrinho e leva para os pedidos. Sem cobrança real.
- **Entrar/cadastrar (`/entrar`)**: e-mail e senha + "Entrar com Google".
- **Meus pedidos (`/pedidos`)**: lista com status, itens, total e data.

Painel do vendedor e área do admin ficam para a etapa seguinte.

## Detalhes técnicos

- Leituras públicas (vitrine, produto, loja, busca) via server functions com a chave publicável, chamadas por loaders + TanStack Query, para SEO e SSR.
- Leituras e escritas do usuário (carrinho, endereços, pedidos, checkout) via server functions com `requireSupabaseAuth`; rotas que exigem login (`/checkout`, `/pedidos`, `/carrinho`) ficam sob o layout `_authenticated`.
- Checkout executa em uma server function: valida estoque, cria `orders` + `order_items` por loja, chama `decrement_stock` e apaga `cart_items`.
- Componentes reutilizáveis: `ProductCard`, `ProductGrid`, `CategoryStrip`, `SiteHeader`, `SiteFooter`, `StoreBadge`, `QuantityStepper`.
- `head()` próprio em cada rota, em português (título, descrição, og).
- Toasts com sonner (montar `<Toaster />` no layout raiz).
