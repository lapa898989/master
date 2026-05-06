import Link from "next/link";
import { ClientRequestsRealtime } from "@/components/client-requests-realtime";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

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
        {requests?.map((item) => (
          <Link key={item.id} href={`/client/requests/${item.id}`} className="block p-4 stage-card-light hover:-translate-y-0.5 transition">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-slate-600">
              {item.status} | {item.budget_min}-{item.budget_max} RUB
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
