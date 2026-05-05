import Link from "next/link";

import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function MasterDashboard() {
  const profile = await requireRole(["master"]);
  const supabase = await createClient();

  const { count: open } = await supabase.from("requests").select("id", { count: "exact", head: true }).eq("status", "open");
  const { count: myOffers } = await supabase.from("offers").select("id", { count: "exact", head: true }).eq("master_id", profile.id);

  return (
    <section className="space-y-6">
      <div className="p-6 stage-card">
        <h1 className="text-2xl font-semibold text-amber-200">Кабинет мастера</h1>
        <p className="mt-2 text-sm text-white/70">
          Заявки с вилкой бюджета: предлагайте свою цену (можно обновить отклик), клиент сравнивает предложения на шкале. После принятия — чат по заказу.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/master/requests" className="stage-button-primary">
            Смотреть заявки
          </Link>
          <Link href="/master/offers" className="stage-button">
            Мои отклики
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl p-5 stage-card">
          <p className="text-sm text-white/60">Открытых заявок</p>
          <p className="mt-1 text-2xl font-semibold text-white">{open ?? 0}</p>
        </div>
        <div className="rounded-2xl p-5 stage-card">
          <p className="text-sm text-white/60">Моих откликов</p>
          <p className="mt-1 text-2xl font-semibold text-white">{myOffers ?? 0}</p>
        </div>
      </div>
    </section>
  );
}

