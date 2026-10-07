-- ════════════════════════════════════════════════════════════════════
--  011 — Тамга дарсан (гаргасан) баримтыг түгжих
--
--  Ажиллуулах: 010-ын дараа SQL Editor дээр нэг удаа Run.
--
--  Дүрэм:
--   • Ноорог — засна, тамга/гарын үсэг гарахгүй.
--   • «Гаргах» (status = issued) — тамга дарагдаж, агуулга түгжигдэнэ.
--   • Гаргасан / төлөгдсөн / цуцалсан баримтын зөвхөн төлвийг өөрчилнө.
--   • Засах шаардлагатай бол эзэмшигч/админ unlock_document()-оор шалтгаантайгаар нээнэ (аудит логт үлдэнэ).
-- ════════════════════════════════════════════════════════════════════

begin;

create or replace function public.guard_document_lock()
returns trigger language plpgsql set search_path = '' as $$
begin
  -- Зөвхөн апп-ын хэрэглэгчдэд (service role, импорт зэрэг дотоод үйлдэлд үйлчлэхгүй)
  if current_user <> 'authenticated' or old.status = 'draft' then
    return new;
  end if;
  if new.status = 'draft' and coalesce(current_setting('hhk.unlocking', true), '') <> 'on' then
    raise exception 'Гаргасан баримтыг ноорог болгохын тулд «Засахаар нээх»-ийг ашиглана уу.' using errcode = '42501';
  end if;
  if new.status <> 'draft'
     and (new.data, new.total, new.number, new.doc_date, new.customer_name, new.issuer_id, new.doc_type, new.customer_id)
         is distinct from (old.data, old.total, old.number, old.doc_date, old.customer_name, old.issuer_id, old.doc_type, old.customer_id) then
    raise exception 'Тамга дарсан (гаргасан) баримтыг засах боломжгүй. «⧉ Хуулах»-аар шинэ баримт үүсгэнэ үү.' using errcode = 'HK423';
  end if;
  return new;
end $$;

drop trigger if exists documents_lock on public.documents;
create trigger documents_lock before update on public.documents
  for each row execute function public.guard_document_lock();

-- Эзэмшигч/админ: гаргасан баримтыг шалтгаантайгаар ноорог болгож засахаар нээнэ
create or replace function public.unlock_document(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid;
  v_number text;
  v_status text;
begin
  select tenant_id, number, status into v_tenant, v_number, v_status from public.documents where id = p_id and deleted_at is null;
  if v_tenant is null or not public.has_role(v_tenant, 'owner', 'admin') then
    raise exception 'Зөвхөн эзэмшигч, админ нээнэ' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'Нээх шалтгаанаа бичнэ үү' using errcode = '22023';
  end if;
  if v_status = 'draft' then
    return;
  end if;
  perform set_config('hhk.unlocking', 'on', true);
  update public.documents set status = 'draft' where id = p_id;
  perform public.log_event(v_tenant, 'document_unlocked', 'documents', p_id::text,
                           jsonb_build_object('number', v_number, 'from_status', v_status, 'reason', left(trim(p_reason), 300)));
end $$;

-- Хуваалцсан холбоосоор ноорог баримтад тамга/гарын үсэг гарахгүй
create or replace function public.public_document(p_token uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'doc', jsonb_build_object('id', d.id, 'doc_type', d.doc_type, 'number', d.number, 'doc_date', d.doc_date,
                              'customer_name', d.customer_name, 'status', d.status, 'data', d.data, 'total', d.total),
    'issuer', jsonb_build_object('id', i.id, 'name', i.name, 'address', i.address, 'rd', i.rd, 'phone', i.phone,
                                 'email', i.email, 'bank', i.bank, 'account', i.account, 'director', i.director),
    'assets', jsonb_build_object(
      'logo_path', i.logo_path,
      'stamp_path', case when i.stamp_mode = 'on' and d.status <> 'draft' then i.stamp_path end,
      'signature_path', case when i.sig_mode = 'on' and d.status <> 'draft' then i.signature_path end),
    'tenant', jsonb_build_object('name', t.name, 'slug', t.slug))
  from public.documents d
  join public.issuers i on i.id = d.issuer_id
  join public.tenants t on t.id = d.tenant_id
  where d.share_token = p_token and d.deleted_at is null
$$;

revoke execute on function public.guard_document_lock(), public.unlock_document(uuid, text) from public, anon;
grant execute on function public.unlock_document(uuid, text) to authenticated;
grant execute on function public.public_document(uuid) to anon, authenticated;

commit;
