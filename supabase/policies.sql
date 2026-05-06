alter table profiles enable row level security;
alter table requests enable row level security;
alter table offers enable row level security;
alter table assignments enable row level security;
alter table reviews enable row level security;
alter table categories enable row level security;
alter table request_photos enable row level security;
alter table request_messages enable row level security;
alter table notifications enable row level security;

drop policy if exists "categories_read_all" on categories;
drop policy if exists "profiles_read_self_or_admin" on profiles;
drop policy if exists "profiles_insert_self" on profiles;
drop policy if exists "profiles_update_self_or_admin" on profiles;
drop policy if exists "client_can_manage_own_requests" on requests;
drop policy if exists "master_can_read_open_requests" on requests;
drop policy if exists "master_can_read_assigned_requests" on requests;
drop policy if exists "master_can_read_requests_where_has_offer" on requests;
drop policy if exists "offers_read_participant" on offers;
drop policy if exists "master_insert_own_offers" on offers;
drop policy if exists "master_update_own_offers" on offers;
drop policy if exists "assignments_participant_read" on assignments;
drop policy if exists "reviews_participant_manage" on reviews;
drop policy if exists "request_photos_participant_read" on request_photos;
drop policy if exists "request_photos_client_insert" on request_photos;
drop policy if exists "request_messages_participant_read" on request_messages;
drop policy if exists "request_messages_participant_insert" on request_messages;

create policy "categories_read_all"
on categories for select
to authenticated
using (true);

create policy "profiles_read_self_or_admin"
on profiles for select
to authenticated
using (
  id = auth.uid() or
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

create policy "profiles_insert_self"
on profiles for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_self_or_admin"
on profiles for update
to authenticated
using (
  id = auth.uid() or
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
with check (
  id = auth.uid() or
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

create policy "client_can_manage_own_requests"
on requests for all
to authenticated
using (
  client_id = auth.uid()
)
with check (
  client_id = auth.uid()
);

create policy "master_can_read_open_requests"
on requests for select
to authenticated
using (
  status = 'open' or
  client_id = auth.uid() or
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

create policy "master_can_read_assigned_requests"
on requests for select
to authenticated
using (
  exists (
    select 1
    from assignments a
    join offers o on o.id = a.offer_id
    where a.request_id = requests.id
      and o.master_id = auth.uid()
  )
);

create policy "master_can_read_requests_where_has_offer"
on requests for select
to authenticated
using (
  exists (
    select 1
    from offers o
    where o.request_id = requests.id
      and o.master_id = auth.uid()
  )
);

create policy "offers_read_participant"
on offers for select
to authenticated
using (
  master_id = auth.uid() or
  exists (
    select 1 from requests r
    where r.id = request_id and r.client_id = auth.uid()
  ) or
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

create policy "master_insert_own_offers"
on offers for insert
to authenticated
with check (
  master_id = auth.uid() and
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'master'
);

create policy "master_update_own_offers"
on offers for update
to authenticated
using (
  master_id = auth.uid() or
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
with check (
  master_id = auth.uid() or
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

create policy "assignments_participant_read"
on assignments for select
to authenticated
using (
  exists (
    select 1 from requests r
    where r.id = request_id and r.client_id = auth.uid()
  ) or
  exists (
    select 1 from offers o
    where o.id = offer_id and o.master_id = auth.uid()
  ) or
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "reviews_participant_manage"
on reviews for all
to authenticated
using (
  client_id = auth.uid() or
  master_id = auth.uid() or
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  client_id = auth.uid() or
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "request_photos_participant_read"
on request_photos for select
to authenticated
using (
  exists (
    select 1
    from requests r
    where r.id = request_id and r.client_id = auth.uid()
  ) or
  exists (
    select 1
    from offers o
    where o.request_id = request_id and o.master_id = auth.uid()
  ) or
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "request_photos_client_insert"
on request_photos for insert
to authenticated
with check (
  exists (
    select 1
    from requests r
    where r.id = request_id and r.client_id = auth.uid()
  )
);

create policy "request_messages_participant_read"
on request_messages for select
to authenticated
using (
  exists (
    select 1
    from requests r
    where r.id = request_id and r.client_id = auth.uid()
  ) or
  exists (
    select 1
    from assignments a
    join offers o on o.id = a.offer_id
    where a.request_id = request_id and o.master_id = auth.uid()
  ) or
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "request_messages_participant_insert"
on request_messages for insert
to authenticated
with check (
  sender_id = auth.uid() and
  (
    exists (
      select 1
      from requests r
      where r.id = request_id and r.client_id = auth.uid()
    ) or
    exists (
      select 1
      from assignments a
      join offers o on o.id = a.offer_id
      where a.request_id = request_id and o.master_id = auth.uid()
    ) or
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  )
);

create policy "notifications_select_own"
on notifications for select
to authenticated
using (user_id = auth.uid());

create policy "notifications_update_own"
on notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
