create extension if not exists "pgcrypto";

do $$ begin
  create type app_role as enum ('client', 'master', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type request_status as enum ('open', 'in_progress', 'done', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type offer_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');
exception
  when duplicate_object then null;
end $$;

create table if not exists categories (
  id bigserial primary key,
  name text not null unique
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'client',
  full_name text not null,
  phone text,
  city text not null,
  rating numeric(3,2) not null default 5.0,
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  v_role app_role;
begin
  v_role := case
    when new.raw_user_meta_data->>'role' = 'master' then 'master'::app_role
    when new.raw_user_meta_data->>'role' = 'admin' then 'admin'::app_role
    else 'client'::app_role
  end;

  insert into public.profiles (id, role, full_name, city)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'city', 'Не указан')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists requests (
  id bigserial primary key,
  client_id uuid not null references profiles(id) on delete cascade,
  category_id bigint not null references categories(id),
  title text not null,
  description text not null,
  address text not null,
  city text not null,
  desired_time timestamptz not null,
  budget_min integer not null check (budget_min > 0),
  budget_max integer not null check (budget_max >= budget_min),
  status request_status not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists offers (
  id bigserial primary key,
  request_id bigint not null references requests(id) on delete cascade,
  master_id uuid not null references profiles(id) on delete cascade,
  price integer not null check (price > 0),
  comment text not null,
  eta_minutes integer not null check (eta_minutes > 0),
  status offer_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (request_id, master_id)
);

create table if not exists assignments (
  id bigserial primary key,
  request_id bigint not null unique references requests(id) on delete cascade,
  offer_id bigint not null unique references offers(id) on delete cascade,
  status request_status not null default 'in_progress',
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id bigserial primary key,
  request_id bigint not null unique references requests(id) on delete cascade,
  client_id uuid not null references profiles(id) on delete cascade,
  master_id uuid not null references profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists request_photos (
  id bigserial primary key,
  request_id bigint not null references requests(id) on delete cascade,
  photo_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists request_messages (
  id bigserial primary key,
  request_id bigint not null references requests(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_requests_client on requests(client_id);
create index if not exists idx_requests_status_city on requests(status, city);
create index if not exists idx_offers_request on offers(request_id);
create index if not exists idx_offers_master on offers(master_id);
create index if not exists idx_request_photos_request on request_photos(request_id);
create index if not exists idx_request_messages_request on request_messages(request_id, created_at);

insert into categories(name)
values
  ('Электрик'),
  ('Сантехник'),
  ('Ремонт квартиры'),
  ('Сборка мебели'),
  ('Мелкий бытовой ремонт')
on conflict (name) do nothing;

create or replace function public.accept_offer(p_offer_id bigint, p_request_id bigint)
returns void
language plpgsql
security definer
as $$
declare
  v_client_id uuid;
  v_offer_request_id bigint;
  v_offer_status offer_status;
begin
  select client_id into v_client_id from requests where id = p_request_id;
  if v_client_id is null then
    raise exception 'request_not_found';
  end if;

  if auth.uid() <> v_client_id then
    raise exception 'not_request_owner';
  end if;

  select request_id, status
  into v_offer_request_id, v_offer_status
  from offers
  where id = p_offer_id;

  if v_offer_request_id is null then
    raise exception 'offer_not_found';
  end if;

  if v_offer_request_id <> p_request_id then
    raise exception 'offer_request_mismatch';
  end if;

  if v_offer_status <> 'pending' then
    raise exception 'offer_not_pending';
  end if;

  update offers
  set status = case when id = p_offer_id then 'accepted'::offer_status else 'rejected'::offer_status end
  where request_id = p_request_id and status = 'pending';

  update requests
  set status = 'in_progress'
  where id = p_request_id;

  insert into assignments(request_id, offer_id, status)
  values (p_request_id, p_offer_id, 'in_progress')
  on conflict (request_id) do update set offer_id = excluded.offer_id, status = excluded.status;
end;
$$;

grant execute on function public.accept_offer(bigint, bigint) to authenticated;
