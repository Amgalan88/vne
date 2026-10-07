-- ════════════════════════════════════════════════════════════════════
--  004 — Төлбөрийн хүсэлт + платформын админ
--
--  Ажиллуулах: 002_billing.sql-ийн дараа SQL Editor дээр нэг удаа Run.
--
--  Урсгал: компанийн эзэмшигч данс руу шилжүүлээд "Төлбөр шилжүүллээ" хүсэлт илгээнэ
--  → hhk.mn/admin/dashboard дээр платформын админ харж баталгаажуулна → багц идэвхжинэ.
--
--  Багц: 1 сар = 49,900₮, 1 жил (12 сар) = 400,000₮
--  Платформын админ: erdenebilegamgalan@gmail.com (имэйлээ баталгаажуулсан байх ёстой)
-- ════════════════════════════════════════════════════════════════════

begin;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users
     where id = auth.uid()
       and email_confirmed_at is not null
       and lower(email) = 'erdenebilegamgalan@gmail.com'
  )
$$;

create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  requested_by uuid not null references auth.users(id),
  months       int  not null check (months in (1, 12)),
  amount       int  not null check (amount > 0),
  status       text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at   timestamptz not null default now(),
  decided_at   timestamptz
);
create unique index if not exists payments_one_pending on public.payments(tenant_id) where status = 'pending';
create index if not exists payments_status_idx on public.payments(status, created_at desc);

alter table public.payments enable row level security;
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select to authenticated
  using (public.has_role(tenant_id, 'owner', 'admin'));
-- insert / update / delete-д policy байхгүй: зөвхөн доорх функцүүдээр

create or replace function public.plan_price(p_months int)
returns int language sql immutable set search_path = '' as $$
  select case p_months when 1 then 49900 when 12 then 400000 end
$$;

-- Компанийн эзэмшигч/админ төлбөрийн хүсэлт илгээнэ (хүлээгдэж буй хүсэлт байвал шинэчилнэ)
create or replace function public.request_payment(p_tenant uuid, p_months int)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  if not public.has_role(p_tenant, 'owner', 'admin') then
    raise exception 'Эрх хүрэлцэхгүй' using errcode = '42501';
  end if;
  if public.plan_price(p_months) is null then
    raise exception 'Буруу багц' using errcode = '22023';
  end if;
  insert into public.payments(tenant_id, requested_by, months, amount)
  values (p_tenant, auth.uid(), p_months, public.plan_price(p_months))
  on conflict (tenant_id) where status = 'pending' do update
    set months = excluded.months, amount = excluded.amount, requested_by = excluded.requested_by, created_at = now()
  returning id into v_id;
  perform public.log_event(p_tenant, 'payment_requested', 'payments', v_id::text,
                           jsonb_build_object('months', p_months, 'amount', public.plan_price(p_months)));
  return v_id;
end $$;

create or replace function public.admin_payments()
returns table (
  id uuid, created_at timestamptz, decided_at timestamptz, status text, months int, amount int,
  tenant_slug text, tenant_name text, tenant_plan text, paid_until timestamptz, requester_email text
) language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Эрх хүрэлцэхгүй' using errcode = '42501';
  end if;
  return query
    select p.id, p.created_at, p.decided_at, p.status, p.months, p.amount,
           t.slug, t.name, t.plan, t.paid_until, u.email::text
      from public.payments p
      join public.tenants t on t.id = p.tenant_id
      left join auth.users u on u.id = p.requested_by
     order by (p.status = 'pending') desc, coalesce(p.decided_at, p.created_at) desc
     limit 300;
end $$;

create or replace function public.admin_decide_payment(p_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  p public.payments;
  v_slug text;
begin
  if not public.is_platform_admin() then
    raise exception 'Эрх хүрэлцэхгүй' using errcode = '42501';
  end if;
  select * into p from public.payments where id = p_id for update;
  if p.id is null or p.status <> 'pending' then
    raise exception 'Хүсэлт олдсонгүй эсвэл аль хэдийн шийдвэрлэгдсэн' using errcode = 'P0002';
  end if;
  if p_approve then
    select slug into v_slug from public.tenants where id = p.tenant_id;
    perform public.activate_pro(v_slug, p.months);
  end if;
  update public.payments
     set status = case when p_approve then 'confirmed' else 'rejected' end, decided_at = now()
   where id = p_id;
end $$;

revoke execute on function public.is_platform_admin(), public.request_payment(uuid, int),
  public.admin_payments(), public.admin_decide_payment(uuid, boolean) from public, anon;
grant execute on function public.is_platform_admin(), public.request_payment(uuid, int),
  public.admin_payments(), public.admin_decide_payment(uuid, boolean) to authenticated;

commit;
