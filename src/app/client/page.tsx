import Link from "next/link";

import { ClientRequestsRealtime } from "@/components/client-requests-realtime";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { countUnreadByRequestId } from "@/lib/notifications/unread-by-request";

export const dynamic = "force-dynamic";

export default async function ClientDashboard() {
  const profile = await requireRole(["client"]);
  const supabase = await createClient();

  const { count: total } = await supabase.from("requests").select("id", { count: "exact", head: true }).eq("client_id", profile.id);
  const { count: open } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("client_id", profile.id)
    .eq("status", "open");

  const { data: recentOpen } = await supabase
    .from("requests")
    .select("id, title, status, budget_min, budget_max, created_at")
    .eq("client_id", profile.id)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: unreadRows } = await supabase
    .from("notifications")
    .select("href")
    .eq("user_id", profile.id)
    .is("read_at", null)
    .like("href", "/client/requests/%")
    .limit(500);
  const unreadByRequest = countUnreadByRequestId((unreadRows ?? []) as Array<{ href: string }>);

  return (
    <section className="space-y-6">
      <ClientRequestsRealtime clientId={profile.id} />
      <div className="p-6 stage-card-light">
        <h1 className="text-2xl font-semibold">Кабинет клиента</h1>
        <p className="mt-2 text-sm text-slate-600">Создавайте заявки, принимайте отклики и общайтесь с мастером в чате после выбора исполнителя.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/client/requests/new" className="stage-button-primary">
            Создать заявку
          </Link>
          <Link href="/client/requests" className="stage-button-light">
            Мои заявки
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl p-5 stage-card-light">
          <p className="text-sm text-slate-600">Всего заявок</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{total ?? 0}</p>
        </div>
        <div className="rounded-2xl p-5 stage-card-light">
          <p className="text-sm text-slate-600">Открытые</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{open ?? 0}</p>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-700">Мои заявки</p>
            <h2 className="mt-1 text-xl font-semibold">Открытые сейчас</h2>
          </div>
          <Link href="/client/requests" className="stage-button-ghost text-sm">
            Все заявки
          </Link>
        </div>
        <div className="space-y-2">
          {recentOpen?.length ? (
            recentOpen.map((item) => {
              const n = unreadByRequest.get(item.id) ?? 0;
              return (
                <Link
                  key={item.id}
                  href={`/client/requests/${item.id}`}
                  className="relative block p-4 stage-card-light transition hover:-translate-y-0.5"
                >
                  {n > 0 ? (
                    <span className="absolute right-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-bold text-white shadow">
                      {n > 99 ? "99+" : n}
                    </span>
                  ) : null}
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-slate-600">
                    {item.status} | {item.budget_min}-{item.budget_max} RUB
                  </p>
                </Link>
              );
            })
          ) : (
            <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-6 text-sm text-slate-600 backdrop-blur-xl">
              У вас пока нет открытых заявок. Создайте новую — мастера начнут отвечать.
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

