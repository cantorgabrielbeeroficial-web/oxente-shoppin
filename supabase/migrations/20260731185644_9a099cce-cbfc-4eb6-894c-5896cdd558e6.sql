insert into public.products (store_id, category_id, name, description, price, stock, image_url, active)
select s.id, c.id, p.name, p.description, p.price, p.stock, p.image_url, true
from public.stores s
cross join (values
  ('artesanato', 'Chapéu de Couro Cangaceiro Autêntico', 'Chapéu de couro legítimo feito à mão por artesãos do sertão, com costura reforçada e enfeites tradicionais. Resistente ao sol e cheio de história.', 189.90, 25, '/__l5e/assets-v1/1c5ae8b5-efff-4ae7-b32b-dceed7272d39/oxente-chapeu-couro.jpg'),
  ('casa-e-decoracao', 'Rede de Descanso Nordestina Colorida', 'Rede de descanso em algodão com listras vibrantes e franjas artesanais. Perfeita para a varanda, suporta até 120kg.', 129.90, 40, '/__l5e/assets-v1/087d13b1-dd1d-4340-8ec7-d95cdc07bcbd/oxente-rede-descanso.jpg'),
  ('eletronicos', 'Fone de Ouvido Bluetooth Sem Fio', 'Fones sem fio com estojo de recarga, cancelamento de ruído e bateria para o dia inteiro. Graves potentes para ouvir de tudo.', 89.90, 120, '/__l5e/assets-v1/993be3e6-79bd-409f-b2d1-bf0317277e65/oxente-fone-bluetooth.jpg'),
  ('eletronicos', 'Caixa de Som Portátil Laranja', 'Caixa de som bluetooth compacta com acabamento em tecido, à prova de respingos e 12h de bateria. O forró não vai parar.', 149.90, 60, '/__l5e/assets-v1/17abdb59-49a8-4c7f-9b01-361882ef4331/oxente-caixa-som.jpg'),
  ('moda', 'Vestido Floral de Verão', 'Vestido leve e fresquinho com estampa floral, caimento solto e amarração na cintura. Ideal para o calor nordestino.', 119.90, 35, '/__l5e/assets-v1/e417f0fa-eff7-467b-b94e-f48b6128ce1e/oxente-vestido-floral.jpg'),
  ('moda', 'Bolsa de Palha Artesanal com Pompoms', 'Bolsa de palha trançada à mão com pompoms coloridos. Espaçosa, charmosa e a cara do verão.', 99.90, 45, '/__l5e/assets-v1/2f636030-8d5c-4553-8cb7-22b2217e545f/oxente-bolsa-palha.jpg'),
  ('beleza', 'Kit Skincare Completo (3 peças)', 'Kit com sérum, hidratante e óleo facial em vidro âmbar. Rotina completa de cuidados para uma pele radiante.', 159.90, 50, '/__l5e/assets-v1/f50e18c9-eb06-41f2-8b6d-3153bd9dfaa0/oxente-kit-skincare.jpg'),
  ('casa-e-decoracao', 'Luminária de Cerâmica Artesanal', 'Luminária de mesa com base de cerâmica terracota decorada à mão e cúpula de tecido cru. Aconchego garantido.', 139.90, 20, '/__l5e/assets-v1/ef336c36-b39a-42f5-be07-aed565855181/oxente-luminaria.jpg')
) as p(category_slug, name, description, price, stock, image_url)
join public.categories c on c.slug = p.category_slug
where s.slug = 'oxente-oficial';

create policy "Public reads product images" on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
create policy "Authenticated users upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images');
create policy "Users update own uploads" on storage.objects for update to authenticated using (bucket_id = 'product-images' and owner = auth.uid());
create policy "Users delete own uploads" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and owner = auth.uid());