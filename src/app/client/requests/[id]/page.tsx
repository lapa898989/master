import { acceptOfferAction, raiseRequestBudgetAction } from "@/app/client/actions";
import { RequestOffersLive } from "@/components/request-offers-live";
import { BudgetOfferBar } from "@/components/budget-offer-bar";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { RequestPhotoThumbnail } from "@/components/request-photo-thumbnail";

export default async function ClientRequestDetailsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; accepted?: string; budget_ok?: string; budget_error?: string }>;
}) {
  const p = await params;
  const s = await searchParams;
  const requestId = Number(p.id);
  const profile = await requireRole(["client"]);
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("requests")
    .select("id, title, description, status, client_id, budget_min, budget_max, address, desired_time, city")
    .eq("id", requestId)
    .single();

  if (!request || request.client_id !== profile.id) {
    return <p>Заявка не найдена.</p>;
  }

  const { data: offersRaw } = await supabase
    .from("offers")
    .select("id, price, comment, eta_minutes, status, profiles:master_id(full_name)")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  const statusOrder = (st: string) => (st === "pending" ? 0 : st === "accepted" ? 1 : 2);
  const offers = (offersRaw ?? [])
    .slice()
    .sort((a, b) => {
      const so = statusOrder(a.status) - statusOrder(b.status);
      if (so !== 0) return so;
      return a.price - b.price;
    });

  const { data: photos } = await supabase.from("request_photos").select("id, photo_url").eq("request_id", requestId).order("created_at");

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id")
    .eq("request_id", requestId)
    .maybeSingle();

  return (
    <section className="space-y-4">
      <RequestOffersLive requestId={requestId} />
      {s.accepted ? <p className="rounded-xl px-3 py-2 text-sm text-green-200 glass">Исполнитель успешно выбран.</p> : null}
      {s.error ? <p className="rounded-xl px-3 py-2 text-sm text-red-200 glass">Не удалось выбрать отклик. Попробуйте еще раз.</p> : null}
      {s.budget_ok ? (
        <p className="rounded-xl px-3 py-2 text-sm text-emerald-800 glass">Максимум бюджета обновлён — мастера видят новую вилку.</p>
      ) : null}
      {s.budget_error === "min" ? (
        <p className="rounded-xl px-3 py-2 text-sm text-red-700 glass">Новый максимум не может быть меньше минимума заявки.</p>
      ) : null}
      {s.budget_error === "lower" ? (
        <p className="rounded-xl px-3 py-2 text-sm text-red-700 glass">Новый максимум должен быть не ниже текущего — это «поднять ставку», как в InDrive.</p>
      ) : null}
      {s.budget_error === "1" ? (
        <p className="rounded-xl px-3 py-2 text-sm text-red-700 glass">Не удалось обновить бюджет. Проверьте значение и статус заявки.</p>
      ) : null}
      <h1 className="text-2xl font-semibold">{request.title}</h1>
      <p className="text-sm text-slate-600">
        {request.city ? `${request.city}, ` : null}
        {request.address}
      </p>
      <p className="text-xs text-slate-500">
        Удобное время:{" "}
        {request.desired_time ? new Date(request.desired_time).toLocaleString("ru-RU") : "—"}
      </p>
      <div className="rounded-2xl p-4 glass-card space-y-3">
        <p className="text-sm font-medium text-slate-800">Ваша вилка бюджета (клиентский «диапазон цены»)</p>
        <BudgetOfferBar
          budgetMin={request.budget_min}
          budgetMax={request.budget_max}
          offerPrice={request.budget_min}
          mode="corridor"
        />
        <p className="text-xs text-slate-500">
          Шкала показывает договорённости: отклики мастеров ниже сравниваются с этой вилкой. Если все цены выше — поднимите максимум.
        </p>
        {request.status === "open" ? (
          <form action={raiseRequestBudgetAction} className="flex flex-wrap items-end gap-2 border-t border-emerald-900/10 pt-3">
            <input type="hidden" name="request_id" value={requestId} />
            <label className="flex flex-col gap-1 text-xs text-slate-600">
              Поднять макс. бюджет (₽)
              <input
                name="new_budget_max"
                type="number"
                min={request.budget_max}
                defaultValue={request.budget_max}
                className="rounded-lg border border-emerald-900/10 bg-white/60 p-2 text-slate-900"
              />
            </label>
            <button type="submit" className="glass-button-primary px-4 py-2">
              Обновить вилку
            </button>
          </form>
        ) : null}
      </div>
      <p className="rounded-2xl p-4 glass-card">{request.description}</p>
      {photos?.length ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {photos.map((photo) => (
            <a key={photo.id} href={photo.photo_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <RequestPhotoThumbnail src={photo.photo_url} />
            </a>
          ))}
        </div>
      ) : null}
      <p className="text-sm text-slate-300">Статус: {request.status}</p>
      {assignment ? (
        <Link href={`/chat/${requestId}`} className="inline-block glass-button-primary">
          Открыть чат с мастером
        </Link>
      ) : null}
      <h2 className="text-xl font-semibold">Отклики мастеров</h2>
      <div className="space-y-2">
        {offers?.map((offer) => {
          const masterName =
            typeof (offer as unknown as { profiles?: { full_name?: unknown } | null }).profiles?.full_name === "string"
              ? ((offer as unknown as { profiles?: { full_name: string } | null }).profiles?.full_name ?? "Без имени")
              : "Без имени";

          return (
            <article key={offer.id} className="space-y-3 p-4 glass-card">
              <p className="font-medium">Мастер: {masterName}</p>
            <BudgetOfferBar budgetMin={request.budget_min} budgetMax={request.budget_max} offerPrice={offer.price} />
            <p>
              Цена: <b>{offer.price} RUB</b> | ETA: {offer.eta_minutes} мин
            </p>
            <p className="text-sm text-slate-600">{offer.comment}</p>
            {offer.status === "pending" && request.status === "open" ? (
              <form action={acceptOfferAction} className="mt-3">
                <input type="hidden" name="offer_id" value={offer.id} />
                <input type="hidden" name="request_id" value={requestId} />
                <button type="submit" className="glass-button-primary">
                  Выбрать мастера
                </button>
              </form>
            ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
