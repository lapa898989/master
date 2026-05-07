-- Ensure accept_offer always creates/updates assignment.
-- Uses SECURITY DEFINER + row_security=off to avoid RLS blocking internal writes.

create or replace function public.accept_offer(p_offer_id bigint, p_request_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_offer_request_id bigint;
  v_offer_status offer_status;
begin
  -- SECURITY: keep RLS checks explicit, but disable RLS for internal writes.
  perform set_config('row_security', 'off', true);

  select client_id into v_client_id from public.requests where id = p_request_id;
  if v_client_id is null then
    raise exception 'request_not_found';
  end if;

  if auth.uid() <> v_client_id then
    raise exception 'not_request_owner';
  end if;

  select request_id, status
  into v_offer_request_id, v_offer_status
  from public.offers
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

  update public.offers
  set status = case when id = p_offer_id then 'accepted'::offer_status else 'rejected'::offer_status end
  where request_id = p_request_id and status = 'pending';

  update public.requests
  set status = 'in_progress'
  where id = p_request_id;

  insert into public.assignments(request_id, offer_id, status)
  values (p_request_id, p_offer_id, 'in_progress')
  on conflict (request_id)
  do update set offer_id = excluded.offer_id, status = excluded.status;
end;
$$;

grant execute on function public.accept_offer(bigint, bigint) to authenticated;

