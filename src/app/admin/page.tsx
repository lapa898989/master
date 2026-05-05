import { updateProfileBanAction, updateRequestStatusAction } from "@/app/admin/actions";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data: users } = await supabase.from("profiles").select("id, full_name, role, is_banned").order("created_at", { ascending: false }).limit(20);
  const { data: requests } = await supabase.from("requests").select("id, title, status").order("created_at", { ascending: false }).limit(20);

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-semibold">Админ-панель</h1>

      <div className="space-y-3">
        <h2 className="text-xl font-medium">Пользователи</h2>
        {users?.map((user) => (
          <article key={user.id} className="p-4 glass-card">
            <p>
              {user.full_name} ({user.role}) - {user.is_banned ? "Заблокирован" : "Активен"}
            </p>
            <form action={updateProfileBanAction} className="mt-2 flex gap-2">
              <input type="hidden" name="profile_id" value={user.id} />
              <button type="submit" name="is_banned" value={user.is_banned ? "false" : "true"} className="glass-button">
                {user.is_banned ? "Разблокировать" : "Заблокировать"}
              </button>
            </form>
          </article>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-medium">Заявки</h2>
        {requests?.map((request) => (
          <article key={request.id} className="p-4 glass-card">
            <p>
              #{request.id} {request.title}
            </p>
            <p className="text-sm text-slate-300">Текущий статус: {request.status}</p>
            <form action={updateRequestStatusAction} className="mt-2 flex items-center gap-2">
              <input type="hidden" name="request_id" value={request.id} />
              <select name="status" className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-100 outline-none">
                <option value="open">open</option>
                <option value="in_progress">in_progress</option>
                <option value="done">done</option>
                <option value="cancelled">cancelled</option>
              </select>
              <button type="submit" className="glass-button-primary">
                Обновить
              </button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
