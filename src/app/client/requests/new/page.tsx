import { createRequestAction } from "@/app/client/actions";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function NewRequestPage(props: { searchParams: Promise<{ error?: string }> }) {
  await requireRole(["client"]);
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name").order("name");

  return (
    <section className="mx-auto max-w-xl space-y-4 p-6 glass-card">
      <h1 className="text-2xl font-semibold">Создать заявку</h1>
      {searchParams.error ? <p className="text-sm text-red-300">{decodeURIComponent(searchParams.error)}</p> : null}
      <form action={createRequestAction} className="space-y-3">
        <select name="category_id" required className="w-full rounded-lg border border-emerald-900/10 bg-white/40 p-3 text-slate-900 outline-none">
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input name="title" placeholder="Заголовок" required className="w-full rounded-lg border border-emerald-900/10 bg-white/40 p-3 text-slate-900 outline-none placeholder:text-slate-500" />
        <textarea name="description" placeholder="Описание проблемы" required className="w-full rounded-lg border border-emerald-900/10 bg-white/40 p-3 text-slate-900 outline-none placeholder:text-slate-500" rows={4} />
        <input name="address" placeholder="Адрес" required className="w-full rounded-lg border border-emerald-900/10 bg-white/40 p-3 text-slate-900 outline-none placeholder:text-slate-500" />
        <textarea
          name="photo_urls"
          placeholder="Ссылки на фото (по одной в строке), до 5"
          className="w-full rounded-lg border border-emerald-900/10 bg-white/40 p-3 text-slate-900 outline-none placeholder:text-slate-500"
          rows={3}
        />
        <input name="desired_time" type="datetime-local" required className="w-full rounded-lg border border-emerald-900/10 bg-white/40 p-3 text-slate-900 outline-none" />
        <div className="grid grid-cols-2 gap-2">
          <input name="budget_min" type="number" min={100} required placeholder="Мин бюджет" className="rounded-lg border border-emerald-900/10 bg-white/40 p-3 text-slate-900 outline-none placeholder:text-slate-500" />
          <input name="budget_max" type="number" min={100} required placeholder="Макс бюджет" className="rounded-lg border border-emerald-900/10 bg-white/40 p-3 text-slate-900 outline-none placeholder:text-slate-500" />
        </div>
        <button type="submit" className="w-full glass-button-primary py-3">
          Опубликовать
        </button>
      </form>
    </section>
  );
}
