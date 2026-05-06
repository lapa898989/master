-- Hot-path indexes for faster reads (master feed, filters, admin lists, offer sorting).
-- Safe on existing databases: IF NOT EXISTS.

create index if not exists idx_requests_open_created_at
  on public.requests (created_at desc)
  where status = 'open';

create index if not exists idx_requests_open_category_created
  on public.requests (category_id, created_at desc)
  where status = 'open';

create index if not exists idx_requests_open_city_created
  on public.requests (city, created_at desc)
  where status = 'open';

create index if not exists idx_offers_request_status_price
  on public.offers (request_id, status, price);

create index if not exists idx_requests_created_at
  on public.requests (created_at desc);

create index if not exists idx_profiles_created_at
  on public.profiles (created_at desc);

analyze public.requests;
analyze public.offers;
analyze public.profiles;
