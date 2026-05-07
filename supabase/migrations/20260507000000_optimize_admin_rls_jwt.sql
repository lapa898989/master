-- Replace admin checks in some policies to use JWT role claim
-- instead of querying profiles inside RLS (faster, avoids extra reads).

-- assignments
drop policy if exists "assignments_participant_read" on assignments;
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
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- reviews
drop policy if exists "reviews_participant_manage" on reviews;
create policy "reviews_participant_manage"
on reviews for all
to authenticated
using (
  client_id = auth.uid() or
  master_id = auth.uid() or
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
with check (
  client_id = auth.uid() or
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- request_photos
drop policy if exists "request_photos_participant_read" on request_photos;
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
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- request_messages
drop policy if exists "request_messages_participant_read" on request_messages;
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
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

drop policy if exists "request_messages_participant_insert" on request_messages;
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
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
);

