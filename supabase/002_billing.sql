-- ════════════════════════════════════════════════════════════════════
--  002 — Үнэгүй / төлбөртэй багц
--
--  Ажиллуулах: schema.sql-ийн дараа SQL Editor дээр нэг удаа Run.
--
--  Үнэгүй:      өдөрт 1 баримт, 1 хэрэглэгч, 1 байгууллага
--  Төлбөртэй:   49,900₮/сар — хязгааргүй баримт, ажилтан урих, тамганы PIN, аудит лог, олон ХХК
--
--  Төлбөр Хаан банкны дансаар орж ирэхэд SQL Editor дээр идэвхжүүлнэ:
--      select public.activate_pro('tumen');        -- 1 сар
--      select public.activate_pro('tumen', 12);    -- 12 сар
--  Хугацаа дуусаагүй байхад дахин идэвхжүүлбэл үлдсэн хугацаан дээр нэмэгдэнэ.
-- ════════════════════════════════════════════════════════════════════

begin;

alter table public.tenants drop constraint if exists tenants_plan_check;
update public.tenants set plan = 'free' where plan not in ('free', 'pro');
alter table public.tenants add constraint tenants_plan_check check (plan in ('free', 'pro'));
alter table public.tenants add column if not exists paid_until timestamptz;

-- Багц, төлбөрийн хугацаа, дэд домэйныг клиентээс өөрчлөхгүй (эзэмшигч ч)
create or replace function public.guard_tenant()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon')
     and (new.plan is distinct from old.plan or new.paid_until is distinct from old.paid_until
          or new.slug is distinct from old.slug or new.id is distinct from old.id) then
    raise exception 'Багц болон дэд домэйныг энд өөрчлөх боломжгүй' using errcode = '42501';
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

create or replace function public.tenant_is_pro(p_tenant uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.tenants where id = p_tenant and plan = 'pro' and paid_until > now())
$$;

-- Алдааны код HK402: апп энэ кодыг хараад "Төлбөртэй багц" руу чиглүүлнэ
create or replace function public.enforce_doc_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  n int;
begin
  if public.tenant_is_pro(new.tenant_id) then
    return new;
  end if;
  -- Нэг зэрэг хоёр баримт хадгалж хязгаарыг давахаас сэргийлнэ
  perform pg_advisory_xact_lock(hashtext('doc_limit:' || new.tenant_id::text));
  -- Устгасан баримтыг ч тоолно — устгаад дахин үүсгэж хязгаар тойрохгүй
  select count(*) into n from public.documents
   where tenant_id = new.tenant_id
     and (created_at at time zone 'Asia/Ulaanbaatar')::date = (now() at time zone 'Asia/Ulaanbaatar')::date;
  if n >= 1 then
    raise exception 'Үнэгүй багцад өдөрт 1 баримт гаргана. Хязгааргүй гаргахын тулд төлбөртэй багц идэвхжүүлнэ үү.'
      using errcode = 'HK402';
  end if;
  return new;
end $$;

drop trigger if exists documents_limit on public.documents;
create trigger documents_limit before insert on public.documents
  for each row execute function public.enforce_doc_limit();

create or replace function public.enforce_issuer_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not public.tenant_is_pro(new.tenant_id)
     and exists (select 1 from public.issuers where tenant_id = new.tenant_id and deleted_at is null) then
    raise exception 'Олон байгууллагаар баримт гаргах нь төлбөртэй багцад багтана.' using errcode = 'HK402';
  end if;
  return new;
end $$;

drop trigger if exists issuers_limit on public.issuers;
create trigger issuers_limit before insert on public.issuers
  for each row execute function public.enforce_issuer_limit();

-- Ажилтан урих: төлбөртэй багцад
create or replace function public.invite_member(p_tenant uuid, p_email text, p_role text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_id uuid;
begin
  if not public.has_role(p_tenant, 'owner', 'admin') then
    raise exception 'Эрх хүрэлцэхгүй' using errcode = '42501';
  end if;
  if not public.tenant_is_pro(p_tenant) then
    raise exception 'Ажилтан урих нь төлбөртэй багцад багтана.' using errcode = 'HK402';
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

-- Тамганы PIN тохируулах: төлбөртэй багцад. (Хугацаа дууссан ч өмнө тохируулсан PIN хамгаалсаар байна.)
create or replace function public.set_stamp_pin(p_issuer uuid, p_new_pin text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid;
begin
  select tenant_id into v_tenant from public.issuers where id = p_issuer and deleted_at is null;
  if v_tenant is null or not public.has_role(v_tenant, 'owner', 'admin') then
    raise exception 'Эрх хүрэлцэхгүй' using errcode = '42501';
  end if;
  if not public.tenant_is_pro(v_tenant) then
    raise exception 'Тамганы PIN нь төлбөртэй багцад багтана.' using errcode = 'HK402';
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

-- Аудит лог үнэгүй багцад ч бичигдсээр байна — төлбөртэй болмогц бүх түүх харагдана
drop policy if exists audit_log_select on public.audit_log;
create policy audit_log_select on public.audit_log for select to authenticated
  using (public.has_role(tenant_id, 'owner', 'admin') and public.tenant_is_pro(tenant_id));

-- Төлбөр баталгаажуулах (зөвхөн SQL Editor / service role)
create or replace function public.activate_pro(p_slug text, p_months int default 1)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_until timestamptz;
begin
  if p_months is null or p_months < 1 or p_months > 36 then
    raise exception 'Сарын тоо 1–36 байна';
  end if;
  update public.tenants
     set plan = 'pro',
         paid_until = greatest(coalesce(paid_until, now()), now()) + make_interval(months => p_months)
   where slug = lower(trim(p_slug))
  returning id, paid_until into v_id, v_until;
  if v_id is null then
    raise exception 'Компани олдсонгүй: %', p_slug;
  end if;
  perform public.log_event(v_id, 'plan_activated', 'tenants', v_id::text,
                           jsonb_build_object('months', p_months, 'paid_until', v_until));
  return v_until;
end $$;

revoke execute on function public.activate_pro(text, int) from public, anon, authenticated;
revoke execute on function public.enforce_doc_limit(), public.enforce_issuer_limit() from public, anon, authenticated;
grant execute on function public.tenant_is_pro(uuid) to authenticated;

commit;
