import { MasterOfferForm } from "@/components/master-offer-form";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function MasterRequestsPage(props: {
  searchParams: Promise<{ category?: string; city?: string; error?: string; sent?: string }>;
}) {
  const searchParams = await props.searchParams;
  await requireRole(["master"]);
  const supabase = await createClient();
  const selectedCategory = Number(searchParams.category ?? 0);
  const selectedCity = String(searchParams.city ?? "").trim();
  const { data: categories } = await supabase.from("categories").select("id,name").order("name");

  let query = supabase
    .from("requests")
    .select("id, title, description, budget_min, budget_max, city, status, category_id, categories:category_id(name)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const { data: citiesRaw } = await supabase.from("requests").select("city").eq("status", "open").order("city");
  const cities = Array.from(new Set((citiesRaw ?? []).map((x) => x.city).filter((x): x is string => typeof x === "string" && x.trim().length > 0)));

  if (selectedCategory > 0) {
    query = query.eq("category_id", selectedCategory);
  }
  if (selectedCity) {
    query = query.eq("city", selectedCity);
  }

  const { data: requests } = await query;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Доступные заявки</h1>
      <p className="text-sm text-slate-600">
        Логика как в InDrive: у клиента вилка бюджета — вы предлагаете свою цену и время; клиент сравнивает предложения на шкале.
      </p>
      {searchParams.sent ? (
        <p className="rounded-xl px-3 py-2 text-sm text-emerald-800 glass">
          Отклик по заявке #{searchParams.sent} отправлен. Можете предложить цену по другим заказам ниже.
        </p>
      ) : null}
      {searchParams.error ? <p className="text-sm text-red-300">{decodeURIComponent(searchParams.error)}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Link href="/master/requests" className={`rounded px-3 py-1 text-sm ${selectedCategory ? "glass" : "bg-indigo-600 text-white"}`}>
          Все категории
        </Link>
        {categories?.map((c) => (
          <Link
            key={c.id}
            href={`/master/requests?category=${c.id}`}
            className={`rounded px-3 py-1 text-sm ${selectedCategory === c.id ? "bg-indigo-600 text-white" : "glass"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400">Город:</span>
        <Link
          href={`/master/requests${selectedCategory ? `?category=${selectedCategory}` : ""}`}
          className={`rounded px-3 py-1 text-sm ${selectedCity ? "border border-slate-700 bg-slate-950/40" : "bg-indigo-600 text-white"}`}
        >
          Все
        </Link>
        {cities.slice(0, 12).map((city) => {
          const params = new URLSearchParams();
          if (selectedCategory) params.set("category", String(selectedCategory));
          params.set("city", city);
          return (
            <Link
              key={city}
              href={`/master/requests?${params.toString()}`}
              className={`rounded border px-3 py-1 text-sm ${
                selectedCity === city ? "border-indigo-500/60 bg-indigo-600/20 text-indigo-200" : "border-slate-800 bg-slate-950/40 text-slate-200 hover:bg-slate-900"
              }`}
            >
              {city}
            </Link>
          );
        })}
      </div>
      <div className="space-y-3">
        {requests?.map((request) => {
          const categoryName =
            typeof (request as unknown as { categories?: { name?: unknown } | null }).categories?.name === "string"
              ? ((request as unknown as { categories?: { name: string } | null }).categories?.name ?? "-")
              : "-";

          return (
            <article key={request.id} className="p-4 glass-card">
              <p className="font-medium">{request.title}</p>
              <p className="text-xs text-slate-400">Категория: {categoryName}</p>
            <p className="text-sm text-slate-300">{request.description}</p>
            <p className="text-sm text-slate-200">
              Бюджет: {request.budget_min}-{request.budget_max} RUB
            </p>
            <div className="mt-3">
              <MasterOfferForm requestId={request.id} budgetMin={request.budget_min} budgetMax={request.budget_max} />
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
}
