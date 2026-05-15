-- Клиент и выбранный мастер могут видеть имя собеседника в чате и в UI заявки.
-- Без этого вложенный select profiles(...) и отдельные запросы к profiles для sender_id
-- возвращают пусто / ломают отображение чата.

drop policy if exists "profiles_read_chat_counterparty" on public.profiles;

create policy "profiles_read_chat_counterparty"
on public.profiles for select
to authenticated
using (
  exists (
    select 1
    from public.assignments a
    join public.requests r on r.id = a.request_id
    join public.offers o on o.id = a.offer_id
    where
      (r.client_id = auth.uid() and o.master_id = profiles.id)
      or
      (o.master_id = auth.uid() and r.client_id = profiles.id)
  )
);
