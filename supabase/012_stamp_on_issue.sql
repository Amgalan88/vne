-- ════════════════════════════════════════════════════════════════════
--  012 — «Гаргах» үед тамга баримтад «дарагдана»
--
--  Ажиллуулах: 011-ийн дараа SQL Editor дээр нэг удаа Run.
--
--  Асуудал: тамга «PIN-ээр нээсэн үед» горимтой бол харилцагчид илгээсэн
--  холбоос (hhk.mn/d/...) дээр тамга огт гардаггүй байв.
--
--  Шийдэл: баримтыг «Гаргах» үед тамга нээлттэй байсан бол (PIN оруулсан,
--  эсвэл PIN тохируулаагүй) documents.stamped_at-д тэмдэглэнэ. Ийм баримт
--  дээр тамга, гарын үсэг холбоосоор ч, дараа нээхэд ч гарна.
--  Ноорог болгож нээвэл тэмдэг арилна — дахин гаргахад PIN дахин шаардана.
-- ════════════════════════════════════════════════════════════════════

begin;

alter table public.documents add column if not exists stamped_at timestamptz;
alter table public.documents add column if not exists stamped_by uuid;

create or replace function public.set_document_stamp()
returns trigger language plpgsql set search_path = '' as $$
begin
  -- Ноорог: тамгагүй (unlock_document-оор нээсэн үед ч)
  if new.status = 'draft' then
    new.stamped_at := null;
    new.stamped_by := null;
    return new;
  end if;
  -- Дотоод үйлдэл (service role, импорт) — өгсөн утгыг хэвээр
  if current_user <> 'authenticated' then
    return new;
  end if;
  -- Аль хэдийн гаргасан баримт: тэмдгийг гараар өөрчлөхийг зөвшөөрөхгүй
  if tg_op = 'UPDATE' and old.status <> 'draft' then
    new.stamped_at := old.stamped_at;
    new.stamped_by := old.stamped_by;
    return new;
  end if;
  -- Ноорог → гаргасан: тамга энэ хэрэглэгчид нээлттэй бол дарна
  if public.stamp_unlocked(new.issuer_id) then
    new.stamped_at := now();
    new.stamped_by := auth.uid();
  else
    new.stamped_at := null;
    new.stamped_by := null;
  end if;
  return new;
end $$;

drop trigger if exists documents_stamp on public.documents;
create trigger documents_stamp before insert or update on public.documents
  for each row execute function public.set_document_stamp();

-- Харилцагчийн холбоос: «Үргэлж» горим, эсвэл PIN горимтой ч гаргахдаа дарсан бол харуулна
create or replace function public.public_document(p_token uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'doc', jsonb_build_object('id', d.id, 'doc_type', d.doc_type, 'number', d.number, 'doc_date', d.doc_date,
                              'customer_name', d.customer_name, 'status', d.status, 'data', d.data, 'total', d.total),
    'issuer', jsonb_build_object('id', i.id, 'name', i.name, 'address', i.address, 'rd', i.rd, 'phone', i.phone,
                                 'email', i.email, 'bank', i.bank, 'account', i.account, 'director', i.director),
    'assets', jsonb_build_object(
      'logo_path', i.logo_path,
      'stamp_path', case when d.status <> 'draft'
                          and (i.stamp_mode = 'on' or (i.stamp_mode = 'pin' and d.stamped_at is not null))
                         then i.stamp_path end,
      'signature_path', case when d.status <> 'draft'
                              and (i.sig_mode = 'on' or (i.sig_mode = 'pin' and d.stamped_at is not null))
                             then i.signature_path end),
    'tenant', jsonb_build_object('name', t.name, 'slug', t.slug))
  from public.documents d
  join public.issuers i on i.id = d.issuer_id
  join public.tenants t on t.id = d.tenant_id
  where d.share_token = p_token and d.deleted_at is null
$$;

grant execute on function public.public_document(uuid) to anon, authenticated;

commit;
