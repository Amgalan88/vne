-- ════════════════════════════════════════════════════════════════════
--  hhk.mn — олон компанийн өгөгдлийн сан (Supabase / Postgres)
--
--  Ажиллуулах: Supabase → SQL Editor → энэ файлыг бүтнээр нь хуулж → Run.
--  Шинэ (хоосон) төсөл дээр нэг удаа ажиллуулна. Дараа нь 002_billing.sql-ийг ажиллуулна.
--
--  Бүтэц:
--    tenants        компани бүр = нэг дэд домэйн (slug.hhk.mn)
--    memberships    хэн аль компанид ямар эрхтэй (owner/admin/staff/viewer)
--    invitations    имэйлээр урисан, хүлээгдэж буй гишүүд
--    profiles       хэрэглэгчийн нэр (аудит логт "хэн" гэдгийг харуулна)
--    issuers        баримт гаргагч байгууллага (нэг компанид хэд хэдэн ХХК байж болно)
--    customers      харилцагчид
--    documents      үнийн санал, нэхэмжлэх, зарлагын баримт, албан бичиг
--    templates      загварууд
--    audit_log      хэн, хэзээ, юу хийсэн — trigger бичнэ, засах/устгах боломжгүй
--  Клиент хандахгүй (зөвхөн функцээр):
--    issuer_secrets тамганы PIN-ийн hash, буруу оролдлого
--    stamp_unlocks  хэн аль тамгыг хэдэн цаг хүртэл нээсэн
--    doc_counters   баримтын дугаарлалт
--
--  Хамгаалалт: бүх хүснэгтэд Row Level Security — хэрэглэгч зөвхөн өөрийн
--  гишүүн компанийн мөрийг харна. Тамга/гарын үсэг "stamps" хаалттай bucket-д,
--  PIN-ийг сервер шалгаж, нээгээгүй бол файлыг уншуулахгүй.
-- ════════════════════════════════════════════════════════════════════

begin;

create extension if not exists pgcrypto with schema extensions;


-- ════════════════ Хүснэгтүүд ════════════════

create table public.tenants (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'),
  name        text not null check (length(trim(name)) > 0),
  plan        text not null default 'free' check (plan in ('free', 'standard', 'business')),
  created_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);

create table public.memberships (
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('owner', 'admin', 'staff', 'viewer')),
  created_at  timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index memberships_user_idx on public.memberships(user_id);

create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  email       text not null check (email = lower(email)),
  role        text not null check (role in ('admin', 'staff', 'viewer')),
  invited_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  unique (tenant_id, email)
);

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text not null default '',
  created_at  timestamptz not null default now()
);

create table public.issuers (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  name            text not null,
  address         text not null default '',
  rd              text not null default '',
  phone           text not null default '',
  email           text not null default '',
  bank            text not null default '',
  account         text not null default '',
  director        text not null default '',
  -- Storage доторх зам: "{tenant_id}/{issuer_id}/logo.png" гэх мэт
  logo_path       text,
  stamp_path      text,
  signature_path  text,
  -- on = үргэлж гарна, pin = PIN-ээр нээнэ, off = гарахгүй
  stamp_mode      text not null default 'on' check (stamp_mode in ('on', 'pin', 'off')),
  sig_mode        text not null default 'on' check (sig_mode in ('on', 'pin', 'off')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  updated_by      uuid default auth.uid(),
  deleted_at      timestamptz,
  unique (id, tenant_id)
);
create index issuers_tenant_idx on public.issuers(tenant_id);

create table public.issuer_secrets (
  issuer_id     uuid primary key references public.issuers(id) on delete cascade,
  pin_hash      text,
  pin_fails     int not null default 0,
  locked_until  timestamptz
);

create table public.stamp_unlocks (
  issuer_id   uuid not null references public.issuers(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  until       timestamptz not null,
  primary key (issuer_id, user_id)
);

create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  rd          text not null default '',
  address     text not null default '',
  phone       text not null default '',
  email       text not null default '',
  note        text not null default '',
  created_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid(),
  deleted_at  timestamptz,
  unique (id, tenant_id)
);
create index customers_tenant_idx on public.customers(tenant_id);

create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  issuer_id     uuid not null,
  customer_id   uuid,
  -- quote = ҮНИЙН САНАЛ, invoice = НЭХЭМЖЛЭХ, dispatch = ЗАРЛАГЫН БАРИМТ, letter = АЛБАН БИЧИГ
  doc_type      text not null check (doc_type in ('quote', 'invoice', 'dispatch', 'letter')),
  number        text not null default '',
  doc_date      date not null default current_date,
  customer_name text not null default '',
  total         numeric(14, 2) not null default 0,
  status        text not null default 'draft' check (status in ('draft', 'issued', 'paid', 'cancelled')),
  -- Мөрүүд, албан маягтын талбарууд, лого/тамганы хэмжээ гэх мэт апп талын бүх төлөв
  data          jsonb not null default '{}',
  created_by    uuid default auth.uid() references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid default auth.uid(),
  deleted_at    timestamptz,
  -- Өөр компанийн байгууллага/харилцагчийг заахаас сэргийлнэ
  foreign key (issuer_id, tenant_id) references public.issuers(id, tenant_id),
  foreign key (customer_id, tenant_id) references public.customers(id, tenant_id)
);
create index documents_tenant_date_idx on public.documents(tenant_id, doc_date desc);
create unique index documents_number_uniq on public.documents(issuer_id, doc_type, number)
  where deleted_at is null and number <> '';

create table public.templates (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  data        jsonb not null default '{}',
  created_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);
create index templates_tenant_idx on public.templates(tenant_id);

create table public.doc_counters (
  issuer_id   uuid not null references public.issuers(id) on delete cascade,
  doc_type    text not null,
  year        int not null,
  last_no     int not null default 0,
  primary key (issuer_id, doc_type, year)
);

-- Компани устсан ч түүх үлдэх ёстой тул foreign key тавихгүй
create table public.audit_log (
  id          bigint generated always as identity primary key,
  tenant_id   uuid not null,
  user_id     uuid,
  user_email  text,
  action      text not null,      -- insert / update / delete / stamp_unlock / pin_set ...
  entity      text not null,      -- хүснэгтийн нэр
  entity_id   text,
  before      jsonb,
  after       jsonb,
  at          timestamptz not null default now()
);
create index audit_log_tenant_idx on public.audit_log(tenant_id, at desc);


-- ════════════════ Эрх шалгах туслах функцууд ════════════════

create or replace function public.member_role(p_tenant uuid)
returns text language sql stable security definer set search_path = '' as $$
  select role from public.memberships where tenant_id = p_tenant and user_id = auth.uid()
$$;

create or replace function public.is_member(p_tenant uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.member_role(p_tenant) is not null
$$;

create or replace function public.has_role(p_tenant uuid, variadic p_roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.member_role(p_tenant) = any(p_roles), false)
$$;

-- Хоёр хэрэглэгч ядаж нэг компанид хамт байгаа эсэх (бие биеийн нэрийг харах)
create or replace function public.shares_tenant(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships a
    join public.memberships b on a.tenant_id = b.tenant_id
    where a.user_id = auth.uid() and b.user_id = p_user
  )
$$;

-- Storage замын хэсгийг uuid болгоно; буруу бол null
create or replace function public.path_uuid(p_name text, p_idx int)
returns uuid language sql immutable set search_path = '' as $$
  select case when split_part(p_name, '/', p_idx) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then split_part(p_name, '/', p_idx)::uuid end
$$;

-- Аудит логт гараар бичих (тамга нээх гэх мэт хүснэгт өөрчлөхгүй үйлдлүүд). Клиент дуудаж чадахгүй.
create or replace function public.log_event(p_tenant uuid, p_action text, p_entity text, p_entity_id text, p_after jsonb default null)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_log(tenant_id, user_id, user_email, action, entity, entity_id, after)
  values (p_tenant, auth.uid(), auth.jwt() ->> 'email', p_action, p_entity, p_entity_id, p_after)
$$;


-- ════════════════ Тамга, гарын үсгийн PIN ════════════════

-- PIN тохируулаагүй, эсвэл энэ хэрэглэгч сүүлийн 15 минутад нээсэн бол true
create or replace function public.stamp_unlocked(p_issuer uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.issuer_secrets s where s.issuer_id = p_issuer and s.pin_hash is not null)
      or exists (select 1 from public.stamp_unlocks u
                 where u.issuer_id = p_issuer and u.user_id = auth.uid() and u.until > now())
$$;

create or replace function public.stamp_status(p_issuer uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_tenant uuid;
  s public.issuer_secrets;
  v_until timestamptz;
begin
  select tenant_id into v_tenant from public.issuers where id = p_issuer;
  if v_tenant is null or not public.is_member(v_tenant) then
    raise exception 'Эрх хүрэлцэхгүй' using errcode = '42501';
  end if;
  select * into s from public.issuer_secrets where issuer_id = p_issuer;
  select until into v_until from public.stamp_unlocks
    where issuer_id = p_issuer and user_id = auth.uid() and until > now();
  return jsonb_build_object(
    'has_pin', s.pin_hash is not null,
    'unlocked_until', v_until,
    'locked_until', case when s.locked_until > now() then s.locked_until end);
end $$;

-- PIN шалгаж, зөв бол 15 минут нээнэ. 5 удаа буруу бол 15 минут түгжинэ.
-- Буцаах утга: {"ok": true, "until": ...} эсвэл {"ok": false, "error": "wrong"|"locked", "left": n, "locked_until": ...}
create or replace function public.verify_stamp_pin(p_issuer uuid, p_pin text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid;
  s public.issuer_secrets;
  v_until timestamptz;
  v_fails int;
  v_locked timestamptz;
begin
  select tenant_id into v_tenant from public.issuers where id = p_issuer and deleted_at is null;
  if v_tenant is null or not public.has_role(v_tenant, 'owner', 'admin', 'staff') then
    raise exception 'Эрх хүрэлцэхгүй' using errcode = '42501';
  end if;

  select * into s from public.issuer_secrets where issuer_id = p_issuer for update;
  if s.pin_hash is null then
    return jsonb_build_object('ok', true, 'until', null);
  end if;
  if s.locked_until > now() then
    return jsonb_build_object('ok', false, 'error', 'locked', 'locked_until', s.locked_until);
  end if;

  if s.pin_hash = extensions.crypt(p_pin, s.pin_hash) then
    update public.issuer_secrets set pin_fails = 0, locked_until = null where issuer_id = p_issuer;
    v_until := now() + interval '15 minutes';
    insert into public.stamp_unlocks(issuer_id, user_id, until) values (p_issuer, auth.uid(), v_until)
      on conflict (issuer_id, user_id) do update set until = excluded.until;
    perform public.log_event(v_tenant, 'stamp_unlock', 'issuers', p_issuer::text);
    return jsonb_build_object('ok', true, 'until', v_until);
  end if;

  update public.issuer_secrets
     set pin_fails    = case when pin_fails + 1 >= 5 then 0 else pin_fails + 1 end,
         locked_until = case when pin_fails + 1 >= 5 then now() + interval '15 minutes' end
   where issuer_id = p_issuer
  returning pin_fails, locked_until into v_fails, v_locked;
  perform public.log_event(v_tenant, 'stamp_unlock_failed', 'issuers', p_issuer::text);
  if v_locked is not null then
    return jsonb_build_object('ok', false, 'error', 'locked', 'locked_until', v_locked);
  end if;
  return jsonb_build_object('ok', false, 'error', 'wrong', 'left', 5 - v_fails);
end $$;

-- PIN тохируулах/солих (owner/admin). PIN байгаа бол эхлээд verify_stamp_pin-ээр нээсэн байх ёстой —
-- ингэснээр хуучин PIN таах оролдлого бүгд нэг түгжээгээр хязгаарлагдана.
create or replace function public.set_stamp_pin(p_issuer uuid, p_new_pin text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid;
begin
  select tenant_id into v_tenant from public.issuers where id = p_issuer and deleted_at is null;
  if v_tenant is null or not public.has_role(v_tenant, 'owner', 'admin') then
    raise exception 'Эрх хүрэлцэхгүй' using errcode = '42501';
  end if;
  if p_new_pin is null or p_new_pin !~ '^[0-9]{4,6}$' then
    raise exception 'PIN нь 4–6 оронтой тоо байна' using errcode = '22023';
  end if;
  if not public.stamp_unlocked(p_issuer) then
    raise exception 'Эхлээд одоогийн PIN-ээр нээнэ үү' using errcode = '42501';
  end if;

  insert into public.issuer_secrets(issuer_id, pin_hash, pin_fails, locked_until)
  values (p_issuer, extensions.crypt(p_new_pin, extensions.gen_salt('bf', 8)), 0, null)
  on conflict (issuer_id) do update set pin_hash = excluded.pin_hash, pin_fails = 0, locked_until = null;

  insert into public.stamp_unlocks(issuer_id, user_id, until) values (p_issuer, auth.uid(), now() + interval '15 minutes')
    on conflict (issuer_id, user_id) do update set until = excluded.until;
  perform public.log_event(v_tenant, 'pin_set', 'issuers', p_issuer::text);
end $$;

-- PIN мартсан үед: зөвхөн эзэмшигч (имэйл, нууц үгээрээ нэвтэрсэн тул тэр өөрөө гэдэг нь батлагдсан)
create or replace function public.reset_stamp_pin(p_issuer uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid;
begin
  select tenant_id into v_tenant from public.issuers where id = p_issuer;
  if v_tenant is null or not public.has_role(v_tenant, 'owner') then
    raise exception 'Зөвхөн эзэмшигч PIN-ийг шинэчилнэ' using errcode = '42501';
  end if;
  delete from public.issuer_secrets where issuer_id = p_issuer;
  delete from public.stamp_unlocks where issuer_id = p_issuer;
  perform public.log_event(v_tenant, 'pin_reset', 'issuers', p_issuer::text);
end $$;

create or replace function public.lock_stamp(p_issuer uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.stamp_unlocks where issuer_id = p_issuer and user_id = auth.uid()
$$;

-- Storage: тамга/гарын үсгийн файлыг унших эрх. Зам: "{tenant_id}/{issuer_id}/stamp.png" эсвэл ".../signature.png"
create or replace function public.can_read_stamp(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.issuers i
    where i.id = public.path_uuid(p_name, 2)
      and i.tenant_id = public.path_uuid(p_name, 1)
      and i.deleted_at is null
      and public.is_member(i.tenant_id)
      and ((case when split_part(p_name, '/', 3) like 'signature%' then i.sig_mode else i.stamp_mode end) <> 'pin'
           or public.stamp_unlocked(i.id))
  )
$$;

create or replace function public.can_write_stamp(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select split_part(p_name, '/', 3) ~ '^(stamp|signature)[^/]*$'
     and exists (
       select 1 from public.issuers i
       where i.id = public.path_uuid(p_name, 2)
         and i.tenant_id = public.path_uuid(p_name, 1)
         and i.deleted_at is null
         and public.has_role(i.tenant_id, 'owner', 'admin')
         and public.stamp_unlocked(i.id)
     )
$$;


-- ════════════════ Компани, гишүүд ════════════════

create or replace function public.slug_available(p_slug text)
returns boolean language sql stable security definer set search_path = '' as $$
  select v ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'
     and v !~ '--'
     and v <> all (array['www', 'app', 'api', 'admin', 'mail', 'smtp', 'ftp', 'cdn', 'static', 'assets',
                         'auth', 'login', 'signup', 'register', 'help', 'support', 'docs', 'blog', 'status',
                         'dev', 'test', 'staging', 'demo', 'hhk', 'root', 'billing', 'pay', 'v'])
     and not exists (select 1 from public.tenants where slug = v)
  from (select lower(trim(coalesce(p_slug, ''))) as v) x
$$;

-- Нэвтрэх хуудсанд компанийн нэрийг харуулахад (нэвтрээгүй хэрэглэгч ч дуудна)
create or replace function public.tenant_by_slug(p_slug text)
returns table (id uuid, name text) language sql stable security definer set search_path = '' as $$
  select t.id, t.name from public.tenants t where t.slug = lower(trim(p_slug))
$$;

-- Шинэ компани нээх: эзэмшигчийн эрх болон анхны баримт гаргагчийг хамт үүсгэнэ
create or replace function public.create_tenant(p_slug text, p_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_slug text := lower(trim(coalesce(p_slug, '')));
begin
  if auth.uid() is null then
    raise exception 'Нэвтрээгүй байна' using errcode = '42501';
  end if;
  if (select count(*) from public.tenants where created_by = auth.uid()) >= 5 then
    raise exception 'Нэг хэрэглэгч 5-аас олон компани нээх боломжгүй' using errcode = '54000';
  end if;
  if not public.slug_available(v_slug) then
    raise exception 'Энэ хаяг боломжгүй эсвэл аль хэдийн авагдсан байна' using errcode = '23505';
  end if;
  insert into public.tenants(slug, name, created_by) values (v_slug, trim(p_name), auth.uid()) returning id into v_id;
  insert into public.memberships(tenant_id, user_id, role) values (v_id, auth.uid(), 'owner');
  insert into public.issuers(tenant_id, name) values (v_id, trim(p_name));
  return v_id;
end $$;

-- Гишүүн урих (owner/admin). Админыг зөвхөн эзэмшигч урина.
-- Урилгыг хүлээн авсан хүн тэр имэйлээр бүртгүүлж нэвтрэхэд accept_invitations() нэгтгэнэ.
create or replace function public.invite_member(p_tenant uuid, p_email text, p_role text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_id uuid;
begin
  if not public.has_role(p_tenant, 'owner', 'admin') then
    raise exception 'Эрх хүрэлцэхгүй' using errcode = '42501';
  end if;
  if p_role not in ('admin', 'staff', 'viewer') then
    raise exception 'Буруу эрх: %', p_role using errcode = '22023';
  end if;
  if p_role = 'admin' and not public.has_role(p_tenant, 'owner') then
    raise exception 'Админыг зөвхөн эзэмшигч урина' using errcode = '42501';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Имэйл буруу байна' using errcode = '22023';
  end if;
  if exists (select 1 from public.memberships m join auth.users u on u.id = m.user_id
             where m.tenant_id = p_tenant and lower(u.email) = v_email) then
    raise exception 'Энэ хүн аль хэдийн гишүүн байна' using errcode = '23505';
  end if;
  insert into public.invitations(tenant_id, email, role, invited_by)
  values (p_tenant, v_email, p_role, auth.uid())
  on conflict (tenant_id, email) do update
    set role = excluded.role, invited_by = excluded.invited_by, created_at = now(), accepted_at = null
  returning id into v_id;
  return v_id;
end $$;

-- Нэвтэрсний дараа дуудна: баталгаажсан имэйлд ирсэн 7 хоногоос дотогш урилгуудыг хүлээн авна
create or replace function public.accept_invitations()
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_email text;
  n int;
begin
  select lower(email) into v_email from auth.users where id = auth.uid() and email_confirmed_at is not null;
  if v_email is null then
    return 0;
  end if;
  with acc as (
    update public.invitations set accepted_at = now()
     where email = v_email and accepted_at is null and created_at > now() - interval '7 days'
    returning tenant_id, role
  ), ins as (
    insert into public.memberships(tenant_id, user_id, role)
    select tenant_id, auth.uid(), role from acc
    on conflict (tenant_id, user_id) do nothing
    returning 1
  )
  select count(*) into n from ins;
  return n;
end $$;

-- Эрх солих: зөвхөн эзэмшигч, өөрийнхөө болон өөр эзэмшигчийн эрхийг солихгүй
create or replace function public.set_member_role(p_tenant uuid, p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_role(p_tenant, 'owner') then
    raise exception 'Зөвхөн эзэмшигч эрх солино' using errcode = '42501';
  end if;
  if p_role not in ('admin', 'staff', 'viewer') then
    raise exception 'Буруу эрх: %', p_role using errcode = '22023';
  end if;
  if p_user = auth.uid() then
    raise exception 'Өөрийнхөө эрхийг солих боломжгүй' using errcode = '42501';
  end if;
  update public.memberships set role = p_role
   where tenant_id = p_tenant and user_id = p_user and role <> 'owner';
  if not found then
    raise exception 'Гишүүн олдсонгүй' using errcode = 'P0002';
  end if;
end $$;

-- Эзэмшлийг шилжүүлэх: шинэ эзэмшигч гишүүн байх ёстой, хуучин эзэмшигч админ болно
create or replace function public.transfer_ownership(p_tenant uuid, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_role(p_tenant, 'owner') then
    raise exception 'Зөвхөн эзэмшигч шилжүүлнэ' using errcode = '42501';
  end if;
  update public.memberships set role = 'owner' where tenant_id = p_tenant and user_id = p_user and user_id <> auth.uid();
  if not found then
    raise exception 'Гишүүн олдсонгүй' using errcode = 'P0002';
  end if;
  update public.memberships set role = 'admin' where tenant_id = p_tenant and user_id = auth.uid();
end $$;

-- Гишүүн хасах: эзэмшигчийг хасахгүй; админыг зөвхөн эзэмшигч хасна; хүн өөрөө гарч болно
create or replace function public.remove_member(p_tenant uuid, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_target text;
begin
  select role into v_target from public.memberships where tenant_id = p_tenant and user_id = p_user;
  if v_target is null then
    raise exception 'Гишүүн олдсонгүй' using errcode = 'P0002';
  end if;
  if v_target = 'owner' then
    raise exception 'Эзэмшигчийг хасах боломжгүй — эхлээд эзэмшлийг шилжүүлнэ үү' using errcode = '42501';
  end if;
  if not (p_user = auth.uid()
          or public.has_role(p_tenant, 'owner')
          or (public.has_role(p_tenant, 'admin') and v_target in ('staff', 'viewer'))) then
    raise exception 'Эрх хүрэлцэхгүй' using errcode = '42501';
  end if;
  delete from public.memberships where tenant_id = p_tenant and user_id = p_user;
  delete from public.stamp_unlocks u using public.issuers i
   where u.issuer_id = i.id and i.tenant_id = p_tenant and u.user_id = p_user;
end $$;

-- Баримтын дараагийн дугаар: байгууллага × төрөл × он тус бүрд 1-ээс эхэлнэ, давхардахгүй
create or replace function public.next_doc_number(p_issuer uuid, p_doc_type text)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid;
  v_no int;
begin
  select tenant_id into v_tenant from public.issuers where id = p_issuer and deleted_at is null;
  if v_tenant is null or not public.has_role(v_tenant, 'owner', 'admin', 'staff') then
    raise exception 'Эрх хүрэлцэхгүй' using errcode = '42501';
  end if;
  insert into public.doc_counters(issuer_id, doc_type, year, last_no)
  values (p_issuer, p_doc_type, extract(year from now() at time zone 'Asia/Ulaanbaatar')::int, 1)
  on conflict (issuer_id, doc_type, year) do update set last_no = public.doc_counters.last_no + 1
  returning last_no into v_no;
  return v_no;
end $$;


-- ════════════════ Trigger-ууд ════════════════

-- Бүх өөрчлөлтийг аудит логт бичнэ (зөвхөн updated_at өөрчлөгдсөн бол алгасна)
create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  r jsonb := coalesce(v_new, v_old);
begin
  if tg_op = 'UPDATE' and (v_old - 'updated_at' - 'updated_by') = (v_new - 'updated_at' - 'updated_by') then
    return null;
  end if;
  insert into public.audit_log(tenant_id, user_id, user_email, action, entity, entity_id, before, after)
  values (
    case when tg_table_name = 'tenants' then (r ->> 'id')::uuid else (r ->> 'tenant_id')::uuid end,
    auth.uid(), auth.jwt() ->> 'email', lower(tg_op), tg_table_name,
    coalesce(r ->> 'id', r ->> 'user_id'),
    v_old, v_new);
  return null;
end $$;

-- Мөрийг өөр компани руу шилжүүлэхгүй; устгасан гэж тэмдэглэх (deleted_at)-ийг зөвхөн owner/admin;
-- хэн хэзээ зассаныг бөглөнө
create or replace function public.guard_row()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.tenant_id is distinct from old.tenant_id then
    raise exception 'Компанийг өөрчлөх боломжгүй' using errcode = '42501';
  end if;
  if current_user = 'authenticated'
     and (to_jsonb(new) ->> 'deleted_at') is distinct from (to_jsonb(old) ->> 'deleted_at')
     and not public.has_role(new.tenant_id, 'owner', 'admin') then
    raise exception 'Устгах эрх хүрэлцэхгүй' using errcode = '42501';
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

-- Багц (төлбөр) болон дэд домэйныг клиентээс өөрчлөхгүй
create or replace function public.guard_tenant()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon')
     and (new.plan is distinct from old.plan or new.slug is distinct from old.slug or new.id is distinct from old.id) then
    raise exception 'Багц болон дэд домэйныг энд өөрчлөх боломжгүй' using errcode = '42501';
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

-- PIN-тэй байгууллагын тамганы тохиргоо, зураг солих, устгахад PIN-ээр нээсэн байх ёстой
create or replace function public.guard_issuer_stamp()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user <> 'authenticated' then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' then
    if not public.stamp_unlocked(old.id) then
      raise exception 'Тамганы PIN шаардлагатай' using errcode = '42501';
    end if;
    return old;
  end if;
  if (new.stamp_mode, new.sig_mode, new.stamp_path, new.signature_path, new.deleted_at)
     is distinct from (old.stamp_mode, old.sig_mode, old.stamp_path, old.signature_path, old.deleted_at)
     and not public.stamp_unlocked(old.id) then
    raise exception 'Тамганы PIN шаардлагатай' using errcode = '42501';
  end if;
  return new;
end $$;

-- Шинэ хэрэглэгч бүртгүүлэхэд профайл үүсгэнэ; имэйл солигдвол дагуулна
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create or replace function public.sync_user_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
drop trigger if exists on_auth_user_email on auth.users;
create trigger on_auth_user_email after update of email on auth.users
  for each row execute function public.sync_user_email();

create trigger tenants_guard before update on public.tenants
  for each row execute function public.guard_tenant();
create trigger issuers_guard before update on public.issuers
  for each row execute function public.guard_row();
create trigger issuers_stamp_guard before update or delete on public.issuers
  for each row execute function public.guard_issuer_stamp();
create trigger customers_guard before update on public.customers
  for each row execute function public.guard_row();
create trigger documents_guard before update on public.documents
  for each row execute function public.guard_row();
create trigger templates_guard before update on public.templates
  for each row execute function public.guard_row();

create trigger tenants_audit after insert or update or delete on public.tenants
  for each row execute function public.audit_row();
create trigger memberships_audit after insert or update or delete on public.memberships
  for each row execute function public.audit_row();
create trigger invitations_audit after insert or update or delete on public.invitations
  for each row execute function public.audit_row();
create trigger issuers_audit after insert or update or delete on public.issuers
  for each row execute function public.audit_row();
create trigger customers_audit after insert or update or delete on public.customers
  for each row execute function public.audit_row();
create trigger documents_audit after insert or update or delete on public.documents
  for each row execute function public.audit_row();
create trigger templates_audit after insert or update or delete on public.templates
  for each row execute function public.audit_row();


-- ════════════════ Row Level Security ════════════════

alter table public.tenants        enable row level security;
alter table public.memberships    enable row level security;
alter table public.invitations    enable row level security;
alter table public.profiles       enable row level security;
alter table public.issuers        enable row level security;
alter table public.issuer_secrets enable row level security;
alter table public.stamp_unlocks  enable row level security;
alter table public.customers      enable row level security;
alter table public.documents      enable row level security;
alter table public.templates      enable row level security;
alter table public.doc_counters   enable row level security;
alter table public.audit_log      enable row level security;
-- issuer_secrets, stamp_unlocks, doc_counters: policy байхгүй = клиент огт хандахгүй

create policy tenants_select on public.tenants for select to authenticated
  using (public.is_member(id));
create policy tenants_update on public.tenants for update to authenticated
  using (public.has_role(id, 'owner', 'admin')) with check (public.has_role(id, 'owner', 'admin'));

create policy memberships_select on public.memberships for select to authenticated
  using (public.is_member(tenant_id));

create policy invitations_select on public.invitations for select to authenticated
  using (public.has_role(tenant_id, 'owner', 'admin'));
create policy invitations_delete on public.invitations for delete to authenticated
  using (public.has_role(tenant_id, 'owner', 'admin'));

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_tenant(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy issuers_select on public.issuers for select to authenticated
  using (public.is_member(tenant_id));
create policy issuers_insert on public.issuers for insert to authenticated
  with check (public.has_role(tenant_id, 'owner', 'admin'));
create policy issuers_update on public.issuers for update to authenticated
  using (public.has_role(tenant_id, 'owner', 'admin')) with check (public.has_role(tenant_id, 'owner', 'admin'));

create policy customers_select on public.customers for select to authenticated
  using (public.is_member(tenant_id));
create policy customers_insert on public.customers for insert to authenticated
  with check (public.has_role(tenant_id, 'owner', 'admin', 'staff'));
create policy customers_update on public.customers for update to authenticated
  using (public.has_role(tenant_id, 'owner', 'admin', 'staff')) with check (public.has_role(tenant_id, 'owner', 'admin', 'staff'));
create policy customers_delete on public.customers for delete to authenticated
  using (public.has_role(tenant_id, 'owner', 'admin'));

create policy documents_select on public.documents for select to authenticated
  using (public.is_member(tenant_id));
create policy documents_insert on public.documents for insert to authenticated
  with check (public.has_role(tenant_id, 'owner', 'admin', 'staff'));
create policy documents_update on public.documents for update to authenticated
  using (public.has_role(tenant_id, 'owner', 'admin', 'staff')) with check (public.has_role(tenant_id, 'owner', 'admin', 'staff'));
create policy documents_delete on public.documents for delete to authenticated
  using (public.has_role(tenant_id, 'owner', 'admin'));

create policy templates_select on public.templates for select to authenticated
  using (public.is_member(tenant_id));
create policy templates_insert on public.templates for insert to authenticated
  with check (public.has_role(tenant_id, 'owner', 'admin', 'staff'));
create policy templates_update on public.templates for update to authenticated
  using (public.has_role(tenant_id, 'owner', 'admin', 'staff')) with check (public.has_role(tenant_id, 'owner', 'admin', 'staff'));
create policy templates_delete on public.templates for delete to authenticated
  using (public.has_role(tenant_id, 'owner', 'admin', 'staff'));

create policy audit_log_select on public.audit_log for select to authenticated
  using (public.has_role(tenant_id, 'owner', 'admin'));


-- ════════════════ Файл хадгалах (Storage) ════════════════
-- assets: лого.  stamps: тамга, гарын үсэг.  Хоёулаа хаалттай — signed URL-аар л харуулна.
-- Зам: "{tenant_id}/{issuer_id}/<файл>"

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('assets', 'assets', false, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('stamps', 'stamps', false, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy hhk_assets_select on storage.objects for select to authenticated
  using (bucket_id = 'assets' and public.is_member(public.path_uuid(name, 1)));
create policy hhk_assets_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'assets' and public.has_role(public.path_uuid(name, 1), 'owner', 'admin'));
create policy hhk_assets_update on storage.objects for update to authenticated
  using (bucket_id = 'assets' and public.has_role(public.path_uuid(name, 1), 'owner', 'admin'))
  with check (bucket_id = 'assets' and public.has_role(public.path_uuid(name, 1), 'owner', 'admin'));
create policy hhk_assets_delete on storage.objects for delete to authenticated
  using (bucket_id = 'assets' and public.has_role(public.path_uuid(name, 1), 'owner', 'admin'));

create policy hhk_stamps_select on storage.objects for select to authenticated
  using (bucket_id = 'stamps' and public.can_read_stamp(name));
create policy hhk_stamps_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'stamps' and public.can_write_stamp(name));
create policy hhk_stamps_update on storage.objects for update to authenticated
  using (bucket_id = 'stamps' and public.can_write_stamp(name))
  with check (bucket_id = 'stamps' and public.can_write_stamp(name));
create policy hhk_stamps_delete on storage.objects for delete to authenticated
  using (bucket_id = 'stamps' and public.can_write_stamp(name));


-- ════════════════ Эрх (GRANT) ════════════════
-- Supabase анхнаасаа anon/authenticated-д бүх зүйлийг нээдэг — шаардлагагүйг хаана.

revoke all on all tables in schema public from anon;
revoke all on public.issuer_secrets, public.stamp_unlocks, public.doc_counters from authenticated;
revoke insert, update, delete, truncate on public.audit_log from authenticated;
revoke insert, delete, truncate on public.tenants, public.memberships, public.invitations from authenticated;
revoke update on public.memberships from authenticated;

revoke execute on all functions in schema public from public, anon;
revoke execute on function
  public.log_event(uuid, text, text, text, jsonb),
  public.audit_row(), public.guard_row(), public.guard_tenant(), public.guard_issuer_stamp(),
  public.handle_new_user(), public.sync_user_email()
from authenticated;

grant execute on function public.slug_available(text), public.tenant_by_slug(text) to anon, authenticated;
grant execute on function
  public.member_role(uuid), public.is_member(uuid), public.has_role(uuid, text[]), public.shares_tenant(uuid),
  public.path_uuid(text, int), public.stamp_unlocked(uuid), public.stamp_status(uuid),
  public.verify_stamp_pin(uuid, text), public.set_stamp_pin(uuid, text), public.reset_stamp_pin(uuid),
  public.lock_stamp(uuid), public.can_read_stamp(text), public.can_write_stamp(text),
  public.create_tenant(text, text), public.invite_member(uuid, text, text), public.accept_invitations(),
  public.set_member_role(uuid, uuid, text), public.transfer_ownership(uuid, uuid), public.remove_member(uuid, uuid),
  public.next_doc_number(uuid, text)
to authenticated;

commit;
