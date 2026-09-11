alter table public.stores
  add column store_kind text not null default 'interligada';

alter table public.stores
  add constraint stores_store_kind_check
  check (store_kind in ('bodega', 'interligada'));

update public.stores
set store_kind = 'bodega'
where slug = 'oxente-oficial';

create index stores_store_kind_active_idx
  on public.stores (store_kind, active);
