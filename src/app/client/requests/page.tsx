import Link from "next/link";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function ClientRequestsPage() {
  const profile = await requireRole(["client"]);
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("requests")
    .select("id, title, status, budget_min, budget_max, created_at")
    .eq("client_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Мои заявки</h1>
        <Link href="/client/requests/new" className="glass-button-primary">
          Новая заявка
        </Link>
      </div>
      <div className="space-y-2">
        {requests?.map((item) => (
          <Link key={item.id} href={`/client/requests/${item.id}`} className="block p-4 glass-card">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-slate-300">
              {item.status} | {item.budget_min}-{item.budget_max} RUB
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
