import Link from "next/link";
import { MasterOffersRealtime } from "@/components/master-offers-realtime";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MasterOffersPage() {
  const profile = await requireRole(["master"]);
  const supabase = await createClient();

  const { data: offers } = await supabase
    .from("offers")
    .select("id, request_id, price, status")
    .eq("master_id", profile.id)
    .order("created_at", { ascending: false });

  const requestIds = Array.from(
    new Set((offers ?? []).map((o) => o.request_id).filter((id): id is number => typeof id === "number"))
  );
  const { data: requests } = requestIds.length ? await supabase.from("requests").select("id,title,status").in("id", requestIds) : { data: [] };
  const requestsById = new Map((requests ?? []).map((r) => [r.id, r]));

  return (
    <section className="space-y-4">
      <MasterOffersRealtime masterId={profile.id} />
      <h1 className="text-2xl font-semibold">Мои отклики</h1>
      <div className="space-y-2">
        {offers?.map((offer) => {
          const request = requestsById.get(offer.request_id) ?? null;
          return (
            <article key={offer.id} className="p-4 stage-card-light">
              <p className="font-medium">{request?.title ?? "Заявка недоступна"}</p>
              <p className="text-sm text-slate-600">
                Статус отклика: {offer.status}, цена: {offer.price}
              </p>
              {request ? (
                <div className="mt-2 flex gap-3">
                  <Link href={`/master/requests/${request.id}`} className="text-sm font-semibold text-slate-900 underline decoration-slate-400/50 hover:decoration-slate-900">
                    Открыть заявку
                  </Link>
                  {request.status === "in_progress" ? (
                    <Link href={`/chat/${request.id}`} className="text-sm text-slate-900 hover:text-black">
                      Чат по заказу
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
