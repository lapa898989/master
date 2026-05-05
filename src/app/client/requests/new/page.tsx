import { createRequestAction } from "@/app/client/actions";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function NewRequestPage(props: { searchParams: Promise<{ error?: string }> }) {
  await requireRole(["client"]);
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name").order("name");

  return (
    <section className="mx-auto max-w-xl space-y-4 p-6 stage-card">
      <h1 className="text-2xl font-semibold text-amber-200">Создать заявку</h1>
      {searchParams.error ? <p className="text-sm text-red-300">{decodeURIComponent(searchParams.error)}</p> : null}
      <form action={createRequestAction} className="space-y-3">
        <select name="category_id" required className="stage-input">
          {categories?.map((c) => (
            <option className="text-slate-900" key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input name="title" placeholder="Заголовок" required className="stage-input" />
        <textarea name="description" placeholder="Описание проблемы" required className="stage-input" rows={4} />
        <input name="address" placeholder="Адрес" required className="stage-input" />
        <textarea
          name="photo_urls"
          placeholder="Ссылки на фото (по одной в строке), до 5"
          className="stage-input"
          rows={3}
        />
        <input name="desired_time" type="datetime-local" required className="stage-input" />
        <div className="grid grid-cols-2 gap-2">
          <input name="budget_min" type="number" min={100} required placeholder="Мин бюджет" className="stage-input" />
          <input name="budget_max" type="number" min={100} required placeholder="Макс бюджет" className="stage-input" />
        </div>
        <button type="submit" className="w-full stage-button-primary py-3">
          Опубликовать
        </button>
      </form>
    </section>
  );
}
