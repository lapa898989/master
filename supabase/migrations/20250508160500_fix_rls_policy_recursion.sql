-- Fix RLS recursion between requests <-> offers policies.
-- We must not reference `offers` directly from `requests` policy because `offers` policy references `requests`.
-- Use SECURITY DEFINER helper that reads offers with row_security off.

create or replace function public.master_has_offer_on_request(p_request_id bigint, p_master_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
begin
  -- Avoid RLS recursion: read offers with row_security off.
  perform set_config('row_security', 'off', true);

  select exists(
    select 1
    from public.offers o
    where o.request_id = p_request_id
      and o.master_id = p_master_id
  ) into v_exists;

  return coalesce(v_exists, false);
end;
$$;

-- Replace the policy with function-based version (no recursion).
drop policy if exists "master_can_read_requests_where_has_offer" on public.requests;

create policy "master_can_read_requests_where_has_offer"
on public.requests for select
to authenticated
using (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'master'
  and public.master_has_offer_on_request(requests.id, auth.uid())
);

