create type public.app_role as enum ('admin', 'seller', 'buyer');
create type public.application_status as enum ('pending', 'approved', 'rejected');
create type public.order_status as enum ('pendente', 'confirmado', 'enviado', 'entregue', 'cancelado');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Admins read all roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "Users read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins read all profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  label text not null default 'Casa',
  recipient_name text not null default '',
  street text not null,
  number text not null,
  complement text,
  district text not null,
  city text not null,
  state text not null,
  zip_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;
alter table public.addresses enable row level security;

create policy "Users manage own addresses" on public.addresses for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  store_name text not null,
  description text not null default '',
  status public.application_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
grant select, insert on public.seller_applications to authenticated;
grant all on public.seller_applications to service_role;
alter table public.seller_applications enable row level security;

create policy "Users create own application" on public.seller_applications for insert to authenticated with check (auth.uid() = user_id);
create policy "Users read own applications" on public.seller_applications for select to authenticated using (auth.uid() = user_id);
create policy "Admins read all applications" on public.seller_applications for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins review applications" on public.seller_applications for update to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  logo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.stores to anon;
grant select, insert, update, delete on public.stores to authenticated;
grant all on public.stores to service_role;
alter table public.stores enable row level security;

create or replace function public.owns_store(_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.stores
    where id = _store_id and owner_id = auth.uid()
  )
$$;

create policy "Public reads active stores" on public.stores for select to anon, authenticated using (active = true);
create policy "Owners read own store" on public.stores for select to authenticated using (owner_id = auth.uid());
create policy "Owners update own store" on public.stores for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Admins manage all stores" on public.stores for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0
);
grant select on public.categories to anon;
grant select on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;

create policy "Public reads categories" on public.categories for select to anon, authenticated using (true);
create policy "Admins manage categories" on public.categories for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  stock int not null default 0 check (stock >= 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;

create policy "Public reads active products" on public.products for select to anon, authenticated using (active = true and exists (select 1 from public.stores s where s.id = products.store_id and s.active = true));
create policy "Sellers manage own store products" on public.products for all to authenticated using (public.owns_store(store_id)) with check (public.owns_store(store_id));
create policy "Admins manage all products" on public.products for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create index products_store_id_idx on public.products (store_id);
create index products_category_id_idx on public.products (category_id);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity int not null default 1 check (quantity > 0),
  added_at timestamptz not null default now(),
  unique (user_id, product_id)
);
grant select, insert, update, delete on public.cart_items to authenticated;
grant all on public.cart_items to service_role;
alter table public.cart_items enable row level security;

create policy "Users manage own cart" on public.cart_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index cart_items_user_id_idx on public.cart_items (user_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references auth.users(id) on delete cascade not null,
  store_id uuid references public.stores(id) on delete cascade not null,
  status public.order_status not null default 'pendente',
  total numeric(10,2) not null default 0,
  shipping_recipient text not null default '',
  shipping_address text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;

create policy "Buyers read own orders" on public.orders for select to authenticated using (buyer_id = auth.uid());
create policy "Buyers create own orders" on public.orders for insert to authenticated with check (buyer_id = auth.uid());
create policy "Sellers read own store orders" on public.orders for select to authenticated using (public.owns_store(store_id));
create policy "Sellers update own store orders" on public.orders for update to authenticated using (public.owns_store(store_id));
create policy "Admins manage all orders" on public.orders for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create index orders_buyer_id_idx on public.orders (buyer_id);
create index orders_store_id_idx on public.orders (store_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0)
);
grant select, insert on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;

create policy "Buyers read own order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));
create policy "Buyers add items to own orders" on public.order_items for insert to authenticated with check (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));
create policy "Sellers read own store order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and public.owns_store(o.store_id)));
create policy "Admins manage all order items" on public.order_items for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create index order_items_order_id_idx on public.order_items (order_id);

create or replace function public.decrement_stock(_product_id uuid, _quantity int)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products set stock = greatest(stock - _quantity, 0) where id = _product_id;
$$;
grant execute on function public.decrement_stock(uuid, int) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.raw_user_meta_data ->> 'avatar_url');
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'buyer');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.categories (name, slug, sort_order) values
  ('Moda', 'moda', 1),
  ('Eletrônicos', 'eletronicos', 2),
  ('Casa e Decoração', 'casa-e-decoracao', 3),
  ('Artesanato', 'artesanato', 4),
  ('Beleza', 'beleza', 5),
  ('Esporte', 'esporte', 6);

insert into public.stores (owner_id, name, slug, description, active) values
  (null, 'Oxente Oficial', 'oxente-oficial', 'A loja oficial do Oxente: uma seleção de achadinhos do Nordeste e do Brasil inteiro, com aquele preço que é um oxente de tão bom.', true);