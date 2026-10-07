-- ════════════════════════════════════════════════════════════════════
--  009 — Компанийн нийтийн хуудас: лого, «Бидний тухай» зураг
--  (Үйлчилгээ бүрийн зураг, үнэ services jsonb дотор хадгалагдана — багана нэмэх шаардлагагүй)
--
--  Ажиллуулах: 008-ийн дараа SQL Editor дээр нэг удаа Run.
-- ════════════════════════════════════════════════════════════════════

begin;

alter table public.tenant_sites add column if not exists logo_path text;
alter table public.tenant_sites add column if not exists about_image_path text;

create or replace function public.public_site(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when coalesce(s.published, false) then
           jsonb_build_object('name', t.name, 'slug', t.slug, 'published', true,
                              'headline', s.headline, 'about', s.about, 'services', s.services,
                              'phone', s.phone, 'email', s.email, 'address', s.address,
                              'facebook', s.facebook, 'color', s.color,
                              'template', s.template, 'cover_path', s.cover_path,
                              'logo_path', s.logo_path, 'about_image_path', s.about_image_path)
         else jsonb_build_object('name', t.name, 'slug', t.slug, 'published', false, 'logo_path', s.logo_path)
         end
  from public.tenants t
  left join public.tenant_sites s on s.tenant_id = t.id
  where t.slug = lower(trim(p_slug))
$$;

commit;
