import Link from "next/link";

import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

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
      <div className="p-6 glass-card">
        <h1 className="text-2xl font-semibold">Кабинет клиента</h1>
        <p className="mt-2 text-sm text-slate-300">Создавайте заявки, принимайте отклики и общайтесь с мастером в чате после выбора исполнителя.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/client/requests/new" className="glass-button-primary">
            Создать заявку
          </Link>
          <Link href="/client/requests" className="glass-button">
            Мои заявки
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl p-5 glass">
          <p className="text-sm text-slate-400">Всего заявок</p>
          <p className="mt-1 text-2xl font-semibold">{total ?? 0}</p>
        </div>
        <div className="rounded-2xl p-5 glass">
          <p className="text-sm text-slate-400">Открытые</p>
          <p className="mt-1 text-2xl font-semibold">{open ?? 0}</p>
        </div>
      </div>
    </section>
  );
}

