import { NotificationsRealtimeRefresh } from "@/components/notifications-realtime-refresh";
import { NotificationRow, type NotificationRowModel } from "@/components/notification-row";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { markAllNotificationsReadAction } from "@/app/notifications/actions";

export default async function NotificationsPage() {
  const profile = await requireRole(["client", "master", "admin"]);
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, href, read_at, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-red-600">
          Не удалось загрузить уведомления. Если вы только что обновили проект, выполните SQL-миграцию с таблицей{" "}
          <code className="rounded bg-slate-100 px-1">notifications</code> в Supabase.
        </p>
      </section>
    );
  }

  const list = (rows ?? []) as NotificationRowModel[];
  const hasUnread = list.some((r) => !r.read_at);

  return (
    <section className="space-y-6">
      <NotificationsRealtimeRefresh userId={profile.id} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Уведомления</h1>
          <p className="mt-1 text-sm text-slate-600">
            Новые отклики по вашим заявкам, принятие вашего отклика и сообщения в чатах.
          </p>
        </div>
        {hasUnread ? (
          <form action={markAllNotificationsReadAction}>
            <button type="submit" className="stage-button-light text-sm">
              Отметить все прочитанными
            </button>
          </form>
        ) : null}
      </div>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-slate-200/70 bg-white/60 p-6 text-sm text-slate-600 backdrop-blur-xl">
          Пока ничего нет. Когда появится отклик или сообщение — увидите это здесь.
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((row) => (
            <NotificationRow key={row.id} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}
