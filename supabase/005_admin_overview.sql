-- ════════════════════════════════════════════════════════════════════
--  005 — Платформын админы хяналт: бүх компанийн жагсаалт
--
--  Ажиллуулах: 004_payments.sql-ийн дараа SQL Editor дээр нэг удаа Run.
-- ════════════════════════════════════════════════════════════════════

begin;

create or replace function public.admin_tenants()
returns table (
  slug text, name text, plan text, paid_until timestamptz, created_at timestamptz,
  members bigint, documents bigint, owner_email text
) language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Эрх хүрэлцэхгүй' using errcode = '42501';
  end if;
  return query
    select t.slug, t.name, t.plan, t.paid_until, t.created_at,
           (select count(*) from public.memberships m where m.tenant_id = t.id),
           (select count(*) from public.documents d where d.tenant_id = t.id and d.deleted_at is null),
           (select u.email::text from public.memberships m join auth.users u on u.id = m.user_id
             where m.tenant_id = t.id and m.role = 'owner' limit 1)
      from public.tenants t
     order by (t.plan = 'pro' and t.paid_until > now()) desc, t.paid_until nulls last, t.created_at desc
     limit 500;
end $$;

revoke execute on function public.admin_tenants() from public, anon;
grant execute on function public.admin_tenants() to authenticated;

commit;
