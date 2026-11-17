-- Execute no SQL Editor do Supabase.
-- Protege o link do fornecedor: visitantes consultam apenas a view pública.
-- A coluna shopee_url continua disponível somente para usuários autenticados
-- (o painel administrativo usa a tabela products diretamente).

-- Permite que administradores vejam também produtos/categorias inativos.
drop policy if exists "Admins can view all products" on public.products;
create policy "Admins can view all products"
on public.products for select to authenticated
using (public.is_store_admin());

drop policy if exists "Admins can view all categories" on public.categories;
create policy "Admins can view all categories"
on public.categories for select to authenticated
using (public.is_store_admin());

-- Remove o SELECT geral de visitantes e libera somente as colunas públicas.
revoke select on public.products from anon;
grant select (id, name, description, price, image_url, category_id, active, featured, created_at, updated_at)
on public.products to anon;

drop view if exists public.catalog_products;
create view public.catalog_products
with (security_invoker = true)
as
select id, name, description, price, image_url, category_id, featured, created_at
from public.products
where active = true;

grant select on public.catalog_products to anon, authenticated;
