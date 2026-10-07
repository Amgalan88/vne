-- ════════════════════════════════════════════════════════════════════
--  008 — Компанийн нийтийн хуудасны загвар (template) + нүүр зураг
--
--  Ажиллуулах: 007-ийн дараа SQL Editor дээр нэг удаа Run.
-- ════════════════════════════════════════════════════════════════════

begin;

alter table public.tenant_sites add column if not exists template text not null default 'modern';
alter table public.tenant_sites drop constraint if exists tenant_sites_template_check;
alter table public.tenant_sites add constraint tenant_sites_template_check
  check (template in ('modern', 'clean', 'bold', 'dark'));
alter table public.tenant_sites add column if not exists cover_path text;

create or replace function public.public_site(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when coalesce(s.published, false) then
           jsonb_build_object('name', t.name, 'slug', t.slug, 'published', true,
                              'headline', s.headline, 'about', s.about, 'services', s.services,
                              'phone', s.phone, 'email', s.email, 'address', s.address,
                              'facebook', s.facebook, 'color', s.color,
                              'template', s.template, 'cover_path', s.cover_path)
         else jsonb_build_object('name', t.name, 'slug', t.slug, 'published', false)
         end
  from public.tenants t
  left join public.tenant_sites s on s.tenant_id = t.id
  where t.slug = lower(trim(p_slug))
$$;

-- Нийтийн хуудасны зураг — хэн ч харна, компанийн эзэмшигч/админ л оруулна. Зам: "{tenant_id}/cover-...jpg"
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('sites', 'sites', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists hhk_sites_insert on storage.objects;
create policy hhk_sites_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'sites' and public.has_role(public.path_uuid(name, 1), 'owner', 'admin'));
drop policy if exists hhk_sites_update on storage.objects;
create policy hhk_sites_update on storage.objects for update to authenticated
  using (bucket_id = 'sites' and public.has_role(public.path_uuid(name, 1), 'owner', 'admin'))
  with check (bucket_id = 'sites' and public.has_role(public.path_uuid(name, 1), 'owner', 'admin'));
drop policy if exists hhk_sites_delete on storage.objects;
create policy hhk_sites_delete on storage.objects for delete to authenticated
  using (bucket_id = 'sites' and public.has_role(public.path_uuid(name, 1), 'owner', 'admin'));

commit;
