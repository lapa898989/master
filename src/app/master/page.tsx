import Link from "next/link";

import { MasterDashboardRealtime } from "@/components/master-dashboard-realtime";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MasterDashboard() {
  const profile = await requireRole(["master"]);
  const supabase = await createClient();

  const { count: open } = await supabase.from("requests").select("id", { count: "exact", head: true }).eq("status", "open");
  const { count: myOffers } = await supabase.from("offers").select("id", { count: "exact", head: true }).eq("master_id", profile.id);

  return (
    <section className="space-y-6">
      <MasterDashboardRealtime masterId={profile.id} />
      <div className="p-6 stage-card-light">
        <h1 className="text-2xl font-semibold">Кабинет мастера</h1>
        <p className="mt-2 text-sm text-slate-600">
          Заявки с вилкой бюджета: предлагайте свою цену (можно обновить отклик), клиент сравнивает предложения на шкале. После принятия — чат по заказу.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/master/requests" className="stage-button-primary">
            Смотреть заявки
          </Link>
          <Link href="/master/offers" className="stage-button-light">
            Мои отклики
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl p-5 stage-card-light">
          <p className="text-sm text-slate-600">Открытых заявок</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{open ?? 0}</p>
        </div>
        <div className="rounded-2xl p-5 stage-card-light">
          <p className="text-sm text-slate-600">Моих откликов</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{myOffers ?? 0}</p>
        </div>
      </div>
    </section>
  );
}

