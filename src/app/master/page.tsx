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
          Выбирайте заявки, отправляйте отклики с ценой и временем приезда. Когда клиент выберет вас — чат откроется автоматически.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/master/requests" className="stage-button-primary">
            Смотреть заявки
          </Link>
          <Link href="/master/offers" className="stage-button-light">
            Мои отклики
          </Link>
          <Link href="/notifications" className="stage-button-ghost">
            Уведомления
          </Link>
          <Link href="/account/role" className="stage-button-ghost">
            Сменить роль
          </Link>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            title: "Что важно в отклике",
            desc: "Пиши понятную цену, время приезда и короткий комментарий. Это повышает шанс, что выберут именно тебя."
          },
          {
            title: "Как получать больше заказов",
            desc: "Откликайся быстро и обновляй предложение, если клиент поднял максимум цены."
          },
          {
            title: "Преимущества",
            desc: "Новые заявки и изменения приходят без перезагрузки страницы. Выбор клиента сразу переводит в чат."
          }
        ].map((x) => (
          <div key={x.title} className="rounded-2xl p-5 stage-card-light">
            <p className="text-sm font-semibold text-slate-900">{x.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{x.desc}</p>
          </div>
        ))}
      </section>

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

