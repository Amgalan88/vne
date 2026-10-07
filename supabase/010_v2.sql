-- ════════════════════════════════════════════════════════════════════
--  010 — Алдааны бүртгэл, баримт хуваалцах холбоос, админы сунгалт,
--        нийтийн хуудасны ажлын цаг / зургийн цомог / газрын зураг / захиалгын маягт
--
--  Ажиллуулах: 009-ийн дараа SQL Editor дээр нэг удаа Run.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ─── 1. Апп-ын алдааны бүртгэл (админ «Алдаа» табаас харна) ───
create table if not exists public.error_logs (
  id         bigserial primary key,
  created_at timestamptz not null default now(),
  message    text not null,
  digest     text,
  url        text,
  user_agent text,
  user_id    uuid
);
alter table public.error_logs enable row level security;
revoke all on public.error_logs from anon, authenticated;

create or replace function public.log_client_error(p_message text, p_digest text, p_url text, p_ua text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  -- Нэг минутад 60-аас олон бол хаяна (спамаас сэргийлнэ)
  if (select count(*) from public.error_logs where created_at > now() - interval '1 minute') >= 60 then
    return;
  end if;
  insert into public.error_logs(message, digest, url, user_agent, user_id)
  values (left(coalesce(p_message, ''), 2000), left(p_digest, 100), left(p_url, 500), left(p_ua, 300), auth.uid());
  delete from public.error_logs where created_at < now() - interval '60 days';
end $$;

create or replace function public.admin_errors()
returns setof public.error_logs language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Эрх хүрэлцэхгүй' using errcode = '42501';
  end if;
  return query select * from public.error_logs order by created_at desc limit 200;
end $$;

-- ─── 2. Баримтыг холбоосоор хуваалцах ───
alter table public.documents add column if not exists share_token uuid unique;

create or replace function public.share_document(p_id uuid, p_enable boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid;
  v_token uuid;
begin
  select tenant_id into v_tenant from public.documents where id = p_id and deleted_at is null;
  if v_tenant is null or not public.has_role(v_tenant, 'owner', 'admin', 'staff') then
    raise exception 'Эрх хүрэлцэхгүй' using errcode = '42501';
  end if;
  update public.documents
     set share_token = case when p_enable then coalesce(share_token, gen_random_uuid()) end
   where id = p_id
  returning share_token into v_token;
  return v_token;
end $$;

-- Холбоостой хэн ч харна. Тамга/гарын үсгийн замыг зөвхөн «үргэлж гаргах» горимтой үед өгнө (PIN горим бол үгүй).
create or replace function public.public_document(p_token uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'doc', jsonb_build_object('id', d.id, 'doc_type', d.doc_type, 'number', d.number, 'doc_date', d.doc_date,
                              'customer_name', d.customer_name, 'status', d.status, 'data', d.data, 'total', d.total),
    'issuer', jsonb_build_object('id', i.id, 'name', i.name, 'address', i.address, 'rd', i.rd, 'phone', i.phone,
                                 'email', i.email, 'bank', i.bank, 'account', i.account, 'director', i.director),
    'assets', jsonb_build_object(
      'logo_path', i.logo_path,
      'stamp_path', case when i.stamp_mode = 'on' then i.stamp_path end,
      'signature_path', case when i.sig_mode = 'on' then i.signature_path end),
    'tenant', jsonb_build_object('name', t.name, 'slug', t.slug))
  from public.documents d
  join public.issuers i on i.id = d.issuer_id
  join public.tenants t on t.id = d.tenant_id
  where d.share_token = p_token and d.deleted_at is null
$$;

-- ─── 3. Админ: багц гараар сунгах ───
create or replace function public.admin_extend(p_slug text, p_months int)
returns timestamptz language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Эрх хүрэлцэхгүй' using errcode = '42501';
  end if;
  return public.activate_pro(p_slug, p_months);
end $$;

-- ─── 4. Нийтийн хуудас: ажлын цаг, зургийн цомог, газрын зураг ───
alter table public.tenant_sites add column if not exists hours text not null default '';
alter table public.tenant_sites add column if not exists gallery jsonb not null default '[]';
alter table public.tenant_sites add column if not exists show_map boolean not null default true;

create or replace function public.public_site(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when coalesce(s.published, false) then
           jsonb_build_object('name', t.name, 'slug', t.slug, 'published', true,
                              'headline', s.headline, 'about', s.about, 'services', s.services,
                              'phone', s.phone, 'email', s.email, 'address', s.address,
                              'facebook', s.facebook, 'color', s.color,
                              'template', s.template, 'cover_path', s.cover_path,
                              'logo_path', s.logo_path, 'about_image_path', s.about_image_path,
                              'hours', s.hours, 'gallery', s.gallery, 'show_map', s.show_map)
         else jsonb_build_object('name', t.name, 'slug', t.slug, 'published', false, 'logo_path', s.logo_path)
         end
  from public.tenants t
  left join public.tenant_sites s on s.tenant_id = t.id
  where t.slug = lower(trim(p_slug))
$$;

-- ─── 5. Нийтийн хуудасны захиалга / асуултын маягт ───
create table if not exists public.site_inquiries (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null,
  phone      text not null,
  message    text not null default '',
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists site_inquiries_tenant_idx on public.site_inquiries(tenant_id, created_at desc);
alter table public.site_inquiries enable row level security;
drop policy if exists site_inquiries_select on public.site_inquiries;
create policy site_inquiries_select on public.site_inquiries for select to authenticated
  using (public.has_role(tenant_id, 'owner', 'admin', 'staff'));
drop policy if exists site_inquiries_update on public.site_inquiries;
create policy site_inquiries_update on public.site_inquiries for update to authenticated
  using (public.has_role(tenant_id, 'owner', 'admin', 'staff')) with check (public.has_role(tenant_id, 'owner', 'admin', 'staff'));
drop policy if exists site_inquiries_delete on public.site_inquiries;
create policy site_inquiries_delete on public.site_inquiries for delete to authenticated
  using (public.has_role(tenant_id, 'owner', 'admin'));
revoke all on public.site_inquiries from anon;
grant select, update, delete on public.site_inquiries to authenticated;

create or replace function public.submit_inquiry(p_slug text, p_name text, p_phone text, p_message text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid;
  v_id uuid;
begin
  select t.id into v_tenant from public.tenants t join public.tenant_sites s on s.tenant_id = t.id
   where t.slug = lower(trim(p_slug)) and s.published;
  if v_tenant is null then
    raise exception 'Компани олдсонгүй' using errcode = 'P0002';
  end if;
  if length(trim(coalesce(p_name, ''))) = 0 or length(trim(coalesce(p_phone, ''))) < 6 then
    raise exception 'Нэр, утсаа оруулна уу' using errcode = '22023';
  end if;
  -- Нэг компанид цагт 30-аас олон бол хаана (спам)
  if (select count(*) from public.site_inquiries where tenant_id = v_tenant and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Түр завсарлаад дахин илгээнэ үү' using errcode = '54000';
  end if;
  insert into public.site_inquiries(tenant_id, name, phone, message)
  values (v_tenant, left(trim(p_name), 100), left(trim(p_phone), 30), left(trim(coalesce(p_message, '')), 1000))
  returning id into v_id;
  return v_id;
end $$;

-- ─── Эрх ───
revoke execute on function public.log_client_error(text, text, text, text), public.admin_errors(),
  public.share_document(uuid, boolean), public.public_document(uuid), public.admin_extend(text, int),
  public.submit_inquiry(text, text, text, text) from public;
grant execute on function public.log_client_error(text, text, text, text), public.public_document(uuid),
  public.submit_inquiry(text, text, text, text) to anon, authenticated;
grant execute on function public.admin_errors(), public.share_document(uuid, boolean), public.admin_extend(text, int)
  to authenticated;

-- ─── 6. Хуучин апп (/umgm/)-аас импорт ───
-- Үнэгүй багцын өдрийн хязгаар импорт хийж буй үед үйлчлэхгүй (зөвхөн доорх функц тохируулна)
create or replace function public.enforce_doc_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  n int;
begin
  if public.tenant_is_pro(new.tenant_id) or current_setting('hhk.importing', true) = 'on' then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtext('doc_limit:' || new.tenant_id::text));
  select count(*) into n from public.documents
   where tenant_id = new.tenant_id
     and (created_at at time zone 'Asia/Ulaanbaatar')::date = (now() at time zone 'Asia/Ulaanbaatar')::date;
  if n >= 1 then
    raise exception 'Үнэгүй багцад өдөрт 1 баримт гаргана. Хязгааргүй гаргахын тулд төлбөртэй багц идэвхжүүлнэ үү.'
      using errcode = 'HK402';
  end if;
  return new;
end $$;

-- p_docs: [{doc_type, number, doc_date, customer_name, total, data}], p_customers: ["нэр", ...]
-- Буцаах: {"documents": импортолсон тоо, "customers": тоо}. Дугаар давхардвал алгасна.
create or replace function public.import_legacy(p_tenant uuid, p_issuer uuid, p_docs jsonb, p_customers jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  d jsonb;
  c text;
  n_docs int := 0;
  n_cust int := 0;
  k int;
begin
  if not public.has_role(p_tenant, 'owner', 'admin') then
    raise exception 'Эрх хүрэлцэхгүй' using errcode = '42501';
  end if;
  if not exists (select 1 from public.issuers where id = p_issuer and tenant_id = p_tenant and deleted_at is null) then
    raise exception 'Байгууллага олдсонгүй' using errcode = 'P0002';
  end if;
  if jsonb_array_length(coalesce(p_docs, '[]')) > 2000 then
    raise exception 'Нэг удаад 2000 хүртэл баримт импортлоно' using errcode = '22023';
  end if;
  perform set_config('hhk.importing', 'on', true);

  for d in select * from jsonb_array_elements(coalesce(p_docs, '[]')) loop
    if d->>'doc_type' not in ('quote', 'invoice', 'dispatch', 'letter') then
      continue;
    end if;
    insert into public.documents(tenant_id, issuer_id, doc_type, number, doc_date, customer_name, total, status, data)
    values (p_tenant, p_issuer, d->>'doc_type', left(coalesce(d->>'number', ''), 40),
            coalesce(nullif(d->>'doc_date', '')::date, current_date), left(coalesce(d->>'customer_name', ''), 300),
            coalesce((d->>'total')::numeric, 0), 'issued', coalesce(d->'data', '{}'))
    on conflict (issuer_id, doc_type, number) where deleted_at is null and number <> '' do nothing;
    get diagnostics k = row_count;
    n_docs := n_docs + k;
  end loop;

  for c in select jsonb_array_elements_text(coalesce(p_customers, '[]')) loop
    if length(trim(c)) = 0 or exists (select 1 from public.customers where tenant_id = p_tenant and name = trim(c) and deleted_at is null) then
      continue;
    end if;
    insert into public.customers(tenant_id, name) values (p_tenant, left(trim(c), 300));
    n_cust := n_cust + 1;
  end loop;

  perform public.log_event(p_tenant, 'legacy_import', 'documents', '', jsonb_build_object('documents', n_docs, 'customers', n_cust));
  return jsonb_build_object('documents', n_docs, 'customers', n_cust);
end $$;

revoke execute on function public.import_legacy(uuid, uuid, jsonb, jsonb), public.enforce_doc_limit() from public, anon;
grant execute on function public.import_legacy(uuid, uuid, jsonb, jsonb) to authenticated;

commit;
