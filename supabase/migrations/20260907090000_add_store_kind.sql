-- 1. Adiciona a coluna caso não exista
alter table public.stores add column if not exists store_kind text not null default 'interligada';

-- 2. Remove a restrição antiga (se existir) antes de recriar com segurança
alter table public.stores drop constraint if exists stores_store_kind_check;
alter table public.stores
  add constraint stores_store_kind_check
  check (store_kind in ('bodega', 'interligada'));

-- 3. Atualiza a loja oficial
update public.stores
set store_kind = 'bodega'
where slug = 'oxente-oficial';

-- 4. Cria o índice apenas se ainda não existir
create index if not exists stores_store_kind_active_idx
  on public.stores (store_kind, active);