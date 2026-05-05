import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function MasterRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const requestId = Number(p.id);
  const profile = await requireRole(["master"]);
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("requests")
    .select("id, title, description, status, budget_min, budget_max, address, city, desired_time, category_id")
    .eq("id", requestId)
    .single();

  if (!request) {
    return <p>Заявка не найдена.</p>;
  }

  const { data: myOffer } = await supabase
    .from("offers")
    .select("id, price, comment, eta_minutes, status, created_at")
    .eq("request_id", requestId)
    .eq("master_id", profile.id)
    .maybeSingle();

  const { data: assignment } = await supabase.from("assignments").select("id").eq("request_id", requestId).maybeSingle();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{request.title}</h1>
          <p className="text-sm text-slate-600">
            {request.city ? `${request.city}, ` : null}
            {request.address}
          </p>
          <p className="text-xs text-slate-500">Статус: {request.status}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/master/offers" className="glass-button">
            Назад к откликам
          </Link>
          {assignment && request.status === "in_progress" ? (
            <Link href={`/chat/${requestId}`} className="glass-button-primary">
              Чат по заказу
            </Link>
          ) : null}
        </div>
      </div>

      <article className="rounded-2xl p-4 glass-card space-y-2">
        <p className="text-sm font-medium text-slate-800">Описание</p>
        <p className="text-sm text-slate-700">{request.description}</p>
        <p className="text-sm text-slate-700">
          Бюджет клиента: <b>{request.budget_min}–{request.budget_max} RUB</b>
        </p>
        <p className="text-xs text-slate-500">
          Удобное время: {request.desired_time ? new Date(request.desired_time).toLocaleString("ru-RU") : "—"}
        </p>
      </article>

      <article className="rounded-2xl p-4 glass-card space-y-2">
        <p className="text-sm font-medium text-slate-800">Мой отклик</p>
        {myOffer ? (
          <>
            <p className="text-sm text-slate-700">
              Статус: <b>{myOffer.status}</b>
            </p>
            <p className="text-sm text-slate-700">
              Цена: <b>{myOffer.price} RUB</b> • ETA: {myOffer.eta_minutes} мин
            </p>
            <p className="text-sm text-slate-700">{myOffer.comment}</p>
          </>
        ) : (
          <p className="text-sm text-slate-600">Вы ещё не отправляли отклик по этой заявке.</p>
        )}
      </article>
    </section>
  );
}

