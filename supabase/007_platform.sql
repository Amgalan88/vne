-- ════════════════════════════════════════════════════════════════════
--  007 — Нүүр хуудасны тохиргоо (баннер зураг)
--
--  Ажиллуулах: 006-ийн дараа SQL Editor дээр нэг удаа Run.
--  Баннерыг hhk.mn/admin/dashboard → «Нүүр хуудас» табаас оруулна.
-- ════════════════════════════════════════════════════════════════════

begin;

create table if not exists public.platform_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;
drop policy if exists platform_settings_read on public.platform_settings;
create policy platform_settings_read on public.platform_settings for select to anon, authenticated using (true);
drop policy if exists platform_settings_write on public.platform_settings;
create policy platform_settings_write on public.platform_settings for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

grant select on public.platform_settings to anon, authenticated;
grant insert, update, delete on public.platform_settings to authenticated;

-- Нийтэд нээлттэй зураг (баннер). Зөвхөн платформын админ оруулна.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('platform', 'platform', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists hhk_platform_insert on storage.objects;
create policy hhk_platform_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'platform' and public.is_platform_admin());
drop policy if exists hhk_platform_update on storage.objects;
create policy hhk_platform_update on storage.objects for update to authenticated
  using (bucket_id = 'platform' and public.is_platform_admin()) with check (bucket_id = 'platform' and public.is_platform_admin());
drop policy if exists hhk_platform_delete on storage.objects;
create policy hhk_platform_delete on storage.objects for delete to authenticated
  using (bucket_id = 'platform' and public.is_platform_admin());

commit;
