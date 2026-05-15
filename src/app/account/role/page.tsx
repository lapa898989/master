import Link from "next/link";
import { redirect } from "next/navigation";

import { updateAppRoleAction } from "@/app/account/actions";
import { getCurrentProfile } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function AccountRolePage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/auth/login");
  }

  if (profile.role === "admin") {
    return (
      <section className="mx-auto max-w-lg space-y-4 p-6 stage-card-light">
        <h1 className="text-2xl font-semibold">Роль в сервисе</h1>
        <p className="text-sm text-slate-600">Для учётной записи администратора смена роли через этот экран недоступна.</p>
        <Link href="/admin" className="inline-block stage-button-primary">
          В админку
        </Link>
      </section>
    );
  }

  const current = profile.role === "master" ? "master" : "client";

  return (
    <section className="mx-auto max-w-lg space-y-4 p-6 stage-card-light">
      <h1 className="text-2xl font-semibold">Роль в сервисе</h1>
      <p className="text-sm text-slate-600">
        Сейчас вы в кабинете как <b>{current === "master" ? "мастер" : "клиент"}</b>. Можно переключиться — откроется соответствующий личный кабинет.
      </p>
      <form action={updateAppRoleAction} className="space-y-4">
        <label className="block space-y-1 text-sm text-slate-700" htmlFor="role">
          Как будете пользоваться сервисом
          <select id="role" name="role" defaultValue={current} className="mt-1 w-full stage-input-light">
            <option value="client">Клиент — размещаю заявки</option>
            <option value="master">Мастер — откликаюсь на заявки</option>
          </select>
        </label>
        <button type="submit" className="w-full stage-button-primary py-3">
          Сохранить и перейти в кабинет
        </button>
      </form>
      <p className="text-xs text-slate-500">
        Роль сохраняется в профиле и в сессии входа, чтобы меню и доступ к разделам совпадали с выбором.
      </p>
    </section>
  );
}
