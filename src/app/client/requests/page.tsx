import Link from "next/link";
import { ClientRequestsRealtime } from "@/components/client-requests-realtime";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { countUnreadByRequestId } from "@/lib/notifications/unread-by-request";

export const dynamic = "force-dynamic";

export default async function ClientRequestsPage(props: { searchParams?: Promise<{ error?: string }> }) {
  const profile = await requireRole(["client"]);
  const searchParams = props.searchParams ? await props.searchParams : {};
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("requests")
    .select("id, title, status, budget_min, budget_max, created_at")
    .eq("client_id", profile.id)
    .order("created_at", { ascending: false });

  const { data: unreadRows } = await supabase
    .from("notifications")
    .select("href")
    .eq("user_id", profile.id)
    .is("read_at", null)
    .like("href", "/client/requests/%")
    .limit(500);
  const unreadByRequest = countUnreadByRequestId((unreadRows ?? []) as Array<{ href: string }>);

  return (
    <section className="space-y-4">
      <ClientRequestsRealtime clientId={profile.id} />
      {searchParams.error ? (
        <p className="rounded-xl px-3 py-2 text-sm text-red-700 stage-card-light">{decodeURIComponent(searchParams.error)}</p>
      ) : null}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Мои заявки</h1>
        <Link href="/client/requests/new" className="stage-button-primary">
          Новая заявка
        </Link>
      </div>
      <div className="space-y-2">
        {requests?.map((item) => {
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
        })}
      </div>
    </section>
  );
}
