# Oxente — Marketplace estilo Shopee

Um marketplace multi-vendedores em português: compradores navegam, montam carrinho e fazem pedidos; vendedores aprovados por você criam lojas e anunciam produtos; você administra as aprovações. Checkout sem cobrança real nesta versão.

## Etapa 1 — Fundação (Lovable Cloud)

- Ativar o Lovable Cloud (banco de dados + autenticação, tudo integrado).
- Identidade visual a partir da sua logo:
  - Usar a logo laranja como principal e a azul como variação.
  - Gerar uma versão aprimorada da logo (mesma ideia: sacola + chapéu de cangaceiro).
  - Paleta: laranja vibrante como cor principal (estilo Shopee), azul-marinho como apoio, fundo claro.
  - Favicon derivado da logo.
  - Todo o app em português brasileiro.

## Etapa 2 — Banco de dados

Tabelas (todas com segurança por linha — RLS — e permissões corretas):

- `profiles` — nome, foto, criado automaticamente no cadastro.
- `addresses` — endereços de entrega do usuário.
- `user_roles` — papéis separados: `admin` (você), `seller`, `buyer`.
- `seller_applications` — solicitação para virar vendedor (pendente/aprovado/rejeitado).
- `stores` — loja do vendedor (nome, descrição, logo, ativa).
- `categories` — categorias iniciais (ex.: Moda, Eletrônicos, Casa, Artesanato, Beleza).
- `products` — nome, descrição, preço, estoque, fotos, categoria, loja.
- `cart_items` — carrinho do comprador.
- `orders` + `order_items` — pedidos simulados (status: pendente, confirmado, enviado, entregue, cancelado).
- Dados iniciais na migração: categorias + loja de demonstração "Oxente Oficial" com produtos de exemplo (gerenciáveis por você como admin), para a vitrine nunca abrir vazia.

## Etapa 3 — Autenticação e perfis

- Cadastro/login com e-mail e senha + botão "Entrar com Google".
- Perfil completo: nome, foto e endereços de entrega salvos.
- Após o primeiro cadastro, concedo a você o papel de `admin`.

## Etapa 4 — Experiência do comprador

- **Home (/)**: cabeçalho com logo, busca e carrinho; banner; categorias; grade de produtos de todas as lojas.
- **Busca e categoria**: filtrar produtos por texto e categoria.
- **Produto (/produto/$id)**: fotos, preço, estoque, loja vendedora, botão "Adicionar ao carrinho".
- **Carrinho (/carrinho)**: alterar quantidades, remover itens, subtotal por loja.
- **Checkout (/checkout)**: escolher endereço e confirmar pedido (sem cobrança real).
- **Meus pedidos (/pedidos)**: histórico com status de cada pedido.

## Etapa 5 — Área do vendedor

- **Quero vender (/vender)**: formulário de solicitação (nome da loja, descrição) que fica pendente até sua aprovação.
- **Painel do vendedor (/painel)**: dados da loja, cadastro/edição de produtos com fotos, controle de estoque e pedidos recebidos (mudar status: confirmar, enviar, entregar).

## Etapa 6 — Área do administrador (você)

- **Admin (/admin)**: lista de solicitações de vendedores com aprovar/rejeitar; ao aprovar, a loja é criada automaticamente e o usuário ganha o papel de vendedor.
- Visão geral: lojas ativas, produtos e pedidos da plataforma.

## Detalhes técnicos

- Lovable Cloud (Supabase por baixo, sem configuração manual).
- Frontend em TanStack Start + Tailwind, com tokens de cor semânticos baseados na identidade Oxente.
- Regras de segurança (RLS): comprador só vê/edita o próprio carrinho, pedidos e perfil; vendedor só gerencia a própria loja e produtos; admin gerencia tudo; vitrine pública somente leitura.
- Imagens de produtos geradas por IA para os itens de demonstração.
- SEO: título/descrição em português em cada página.
- Futuro (fora desta versão): pagamentos reais, repasse aos vendedores, frete calculado.
