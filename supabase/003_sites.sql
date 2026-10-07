-- ════════════════════════════════════════════════════════════════════
--  003 — Компанийн нийтийн хуудас (slug.hhk.mn дээр зочдод харагдана)
--
--  Ажиллуулах: 002_billing.sql-ийн дараа SQL Editor дээр нэг удаа Run.
-- ════════════════════════════════════════════════════════════════════

begin;

create table public.tenant_sites (
  tenant_id   uuid primary key references public.tenants(id) on delete cascade,
  published   boolean not null default false,
  headline    text not null default '',
  about       text not null default '',
  -- [{"title": "...", "text": "..."}]
  services    jsonb not null default '[]' check (jsonb_typeof(services) = 'array'),
  phone       text not null default '',
  email       text not null default '',
  address     text not null default '',
  facebook    text not null default '',
  color       text not null default 'indigo' check (color in ('indigo', 'emerald', 'rose', 'amber', 'sky', 'slate')),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);

alter table public.tenant_sites enable row level security;

create policy tenant_sites_select on public.tenant_sites for select to authenticated
  using (public.is_member(tenant_id));
create policy tenant_sites_insert on public.tenant_sites for insert to authenticated
  with check (public.has_role(tenant_id, 'owner', 'admin'));
create policy tenant_sites_update on public.tenant_sites for update to authenticated
  using (public.has_role(tenant_id, 'owner', 'admin')) with check (public.has_role(tenant_id, 'owner', 'admin'));

create trigger tenant_sites_guard before update on public.tenant_sites
  for each row execute function public.guard_row();
create trigger tenant_sites_audit after insert or update or delete on public.tenant_sites
  for each row execute function public.audit_row();

revoke all on public.tenant_sites from anon;
revoke delete, truncate on public.tenant_sites from authenticated;

-- Зочдод: нийтэлсэн бол бүх агуулга, нийтлээгүй бол зөвхөн нэр. Компани байхгүй бол null.
create or replace function public.public_site(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when coalesce(s.published, false) then
           jsonb_build_object('name', t.name, 'slug', t.slug, 'published', true,
                              'headline', s.headline, 'about', s.about, 'services', s.services,
                              'phone', s.phone, 'email', s.email, 'address', s.address,
                              'facebook', s.facebook, 'color', s.color)
         else jsonb_build_object('name', t.name, 'slug', t.slug, 'published', false)
         end
  from public.tenants t
  left join public.tenant_sites s on s.tenant_id = t.id
  where t.slug = lower(trim(p_slug))
$$;

grant execute on function public.public_site(text) to anon, authenticated;

commit;
