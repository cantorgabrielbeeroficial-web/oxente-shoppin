# Oxente — Identidade rústica, split de pagamento e Moeda da Oxente

O marketplace já existe (home, busca, categoria, produto, loja, carrinho, checkout, pedidos, "Vender no Oxente"). Este plano acrescenta as três frentes pedidas: nova identidade visual, split de pagamento no checkout e o sistema de gamificação com botão flutuante.

## 1. Identidade visual e layout

- Paleta atualizada nos tokens semânticos: laranja vibrante como cor principal, marrom rústico como cor de apoio (cabeçalhos de seção, rodapé, faixas) e dourado/amarelo sol para destaques (selos, badges, moeda).
- Textura/gradiente "sertão" para o banner da home, usando os novos tokens.
- Slogan aplicado no banner: "Várias lojas, um só lugar. Do sertão para todo o Brasil".
- Header: barra de pesquisa centralizada no topo, com "Vender no Oxente", carrinho e entrar à direita; logo atual (sacola + chapéu de couro) mantida.
- Barra secundária de categorias: Moda, Eletrônicos, Casa e Decoração, Artesanato, Beleza e Esporte — ajusto os nomes/registros de categoria para bater exatamente com essa lista.
- Home: seções "Destaques", "Novidades das lojas" e a faixa de selos de confiança ("Compra protegida", "Entrega em todo Brasil", "Lojas independentes") com visual dourado.

## 2. Split de pagamento (simulado, pronto para provedor real)

- Comissão configurável da plataforma (padrão sugerido: 12%) por pedido.
- No checkout, cada pedido (já separado por loja) passa a registrar: valor bruto, comissão da Oxente, valor líquido do vendedor e status do repasse (pendente/repassado).
- Resumo do checkout mostra o total; a página de pedido/painel mostra a divisão. O vendedor vê seus recebíveis por pedido.
- Nova tabela de repasses (`payouts`) representando a subconta do vendedor, com referência a um `provider_transfer_id` que ficará vazio nesta versão — é o ponto de encaixe para a API de pagamentos quando você quiser cobrança real.
- Nesta versão não há cobrança real de cartão/Pix; quando quiser ativar, integramos pagamentos de verdade e o mesmo cálculo passa a alimentar o split do provedor.

## 3. Moeda da Oxente (gamificação)

- Botão flutuante fixo no canto inferior direito (20px/20px) com animação sutil de pulso; ícone de moeda dourada com o chapéu do cangaço em relevo (imagem gerada).
- Painel deslizante ao clicar, mostrando:
  - Saldo de "Créditos Oxente".
  - Nível do chapéu atual e progresso para o próximo.
  - Missões rápidas: check-in diário e indicação de amigo (link de convite copiável).
  - Histórico curto de créditos ganhos/usados.
- Níveis por fidelidade (total gasto + engajamento):
  - Bronze (iniciante): cashback 1% + ofertas exclusivas.
  - Prata (intermediário): cashback 2–3% + desconto em frete parceiro.
  - Ouro (VIP): cashback 5% + acesso antecipado a lançamentos do sertão.
- Cashback creditado automaticamente ao finalizar o pedido, conforme o nível.
- Visitante (sem login) vê o painel com convite para entrar e explicação dos níveis.
- Créditos podem ser aplicados como desconto no checkout (limite de 50% do total do pedido).

## Detalhes técnicos

- Banco (migração única): colunas de split em `orders` (`platform_fee`, `seller_net`, `payout_status`); tabela `payouts`; tabela `loyalty_accounts` (saldo, total gasto, nível, último check-in, código de indicação); tabela `loyalty_transactions` (ganho/uso, motivo, pedido). RLS: cada usuário lê só a própria conta e transações; vendedor lê os próprios repasses; admin vê tudo. GRANTs para `authenticated`/`service_role`.
- Regras de cashback, comissão e níveis calculadas no servidor (dentro de `placeOrder` e de funções em `src/lib/loyalty.functions.ts`), nunca no cliente.
- Check-in e indicação com validação server-side (1 check-in por dia, indicação creditada uma vez por novo usuário).
- Componentes novos: `src/components/oxente-coin-button.tsx` (botão + painel), montado uma vez no layout raiz; ajustes em `site-header.tsx`, `index.tsx`, `checkout.tsx` e `_authenticated/pedidos.tsx`.
- Tokens de cor novos em `src/styles.css` (`--brand-brown`, `--brand-gold`, gradiente sertão) — sem cores fixas nos componentes.
- Ícone da moeda gerado como PNG transparente em `src/assets`.
