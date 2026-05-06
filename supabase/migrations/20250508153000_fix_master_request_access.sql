-- Fix: allow master to read requests they have offered on.
-- This avoids chat 404 when the request is no longer `open` and assignment join gets blocked by RLS.

drop policy if exists "master_can_read_requests_where_has_offer" on public.requests;

create policy "master_can_read_requests_where_has_offer"
on public.requests for select
to authenticated
using (
  exists (
    select 1
    from public.offers o
    where o.request_id = requests.id
      and o.master_id = auth.uid()
  )
);

