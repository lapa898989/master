import Link from "next/link";

import { ClientRequestsRealtime } from "@/components/client-requests-realtime";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

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
    </section>
  );
}

