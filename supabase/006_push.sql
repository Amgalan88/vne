-- ════════════════════════════════════════════════════════════════════
--  006 — Push мэдэгдэл (PWA)
--
--  Ажиллуулах: 005-ын дараа SQL Editor дээр нэг удаа Run.
--  Хэрэглэгч "Мэдэгдэл асаах" дарахад төхөөрөмжийн хаяг энд хадгалагдана.
-- ════════════════════════════════════════════════════════════════════

begin;

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  email      text not null,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_email_idx on public.push_subscriptions(lower(email));

alter table public.push_subscriptions enable row level security;
drop policy if exists push_select_own on public.push_subscriptions;
create policy push_select_own on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
-- insert/update/delete зөвхөн доорх функцүүдээр. Бусдын хаягийг уншихгүй (илгээх нь service-role-оор серверээс).

-- Нэг төхөөрөмж дээр өөр хэрэглэгч нэвтэрвэл хаяг шинэ хэрэглэгчид шилжинэ
create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text;
begin
  select lower(email) into v_email from auth.users where id = auth.uid();
  if v_email is null then
    raise exception 'Нэвтрээгүй байна' using errcode = '42501';
  end if;
  insert into public.push_subscriptions(user_id, email, endpoint, p256dh, auth)
  values (auth.uid(), v_email, p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update
    set user_id = excluded.user_id, email = excluded.email, p256dh = excluded.p256dh, auth = excluded.auth;
end $$;

create or replace function public.delete_push_subscription(p_endpoint text)
returns void language sql security definer set search_path = '' as $$
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = auth.uid()
$$;

revoke all on public.push_subscriptions from anon, authenticated;
grant select on public.push_subscriptions to authenticated;
revoke execute on function public.save_push_subscription(text, text, text), public.delete_push_subscription(text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text), public.delete_push_subscription(text) to authenticated;

commit;
