-- In-app notifications (new offers, accepted offers, chat messages)

create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('offer_new', 'offer_accepted', 'message_new')),
  title text not null,
  body text,
  href text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;

create policy "notifications_select_own"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

create policy "notifications_update_own"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Realtime (Supabase): подписка на новые строки в клиенте
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- Клиент: новый отклик по его заявке
create or replace function public.notify_client_new_offer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid;
  v_master_name text;
begin
  select r.client_id into v_client from public.requests r where r.id = new.request_id;
  select p.full_name into v_master_name from public.profiles p where p.id = new.master_id;

  if v_client is null or v_client = new.master_id then
    return new;
  end if;

  insert into public.notifications (user_id, type, title, body, href)
  values (
    v_client,
    'offer_new',
    'Новый отклик',
    coalesce(v_master_name, 'Мастер') || ' предложил цену ' || new.price::text || ' ₽',
    '/client/requests/' || new.request_id::text
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_client_new_offer on public.offers;
create trigger trg_notify_client_new_offer
after insert on public.offers
for each row execute procedure public.notify_client_new_offer();

-- Мастер: отклик принят
create or replace function public.notify_master_offer_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status is distinct from new.status then
    insert into public.notifications (user_id, type, title, body, href)
    values (
      new.master_id,
      'offer_accepted',
      'Вас выбрали',
      'Клиент принял ваш отклик по заявке',
      '/chat/' || new.request_id::text
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_master_offer_accepted on public.offers;
create trigger trg_notify_master_offer_accepted
after update on public.offers
for each row execute procedure public.notify_master_offer_accepted();

-- Собеседник в чате: новое сообщение
create or replace function public.notify_chat_recipient()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid;
  v_master uuid;
  v_recipient uuid;
  v_preview text;
begin
  select r.client_id into v_client from public.requests r where r.id = new.request_id;

  select o.master_id into v_master
  from public.assignments a
  join public.offers o on o.id = a.offer_id
  where a.request_id = new.request_id
  limit 1;

  if v_client is null then
    return new;
  end if;

  if new.sender_id = v_client then
    v_recipient := v_master;
  else
    v_recipient := v_client;
  end if;

  if v_recipient is null or v_recipient = new.sender_id then
    return new;
  end if;

  v_preview := left(new.message, 120);
  if length(new.message) > 120 then
    v_preview := v_preview || '…';
  end if;

  insert into public.notifications (user_id, type, title, body, href)
  values (
    v_recipient,
    'message_new',
    'Новое сообщение в чате',
    v_preview,
    '/chat/' || new.request_id::text
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_chat_recipient on public.request_messages;
create trigger trg_notify_chat_recipient
after insert on public.request_messages
for each row execute procedure public.notify_chat_recipient();

analyze public.notifications;
