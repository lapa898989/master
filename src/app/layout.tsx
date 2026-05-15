import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { AutoOpenChatOnAccepted } from "@/components/auto-open-chat-on-accepted";
import { NotificationsNavLink } from "@/components/notifications-nav-link";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ServiceDrive — найдите мастера для бытовых услуг быстро и недорого",
  description:
    "Маркетплейс бытовых услуг: электрики, сантехники, сборщики мебели и другие. Публикуйте заявку — мастера сами предложат цену. Выбор исполнителя и чат.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "ServiceDrive — маркетплейс бытовых услуг",
    description: "Найдите мастера быстро. Выбирайте цену и общайтесь в чате.",
    url: "/",
    siteName: "ServiceDrive",
    locale: "ru_RU",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "ServiceDrive — маркетплейс бытовых услуг",
    description: "Найдите мастера быстро. Выбирайте цену и общайтесь в чате."
  }
};

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  // getSession() читает JWT из cookies без лишнего запроса к Auth; валидацию/refresh делает middleware на защищённых путях.
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const roleMeta = (user?.user_metadata?.role as unknown) === "admin" ? "admin" : (user?.user_metadata?.role as unknown) === "master" ? "master" : "client";
  const fullNameMeta =
    typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? String(user.user_metadata.full_name).trim()
      : user?.email ?? "Пользователь";

  return (
    <html lang="ru">
      <body>
        {user && roleMeta === "master" ? <AutoOpenChatOnAccepted userId={user.id} /> : null}
        <header className="border-b border-white/15 bg-slate-900/45 backdrop-blur-2xl shadow-[0_1px_0_rgba(255,255,255,0.06)_inset]">
          <div className="stage-bg">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <Link href="/" className="font-semibold tracking-wide text-amber-200">
                ServiceDrive
              </Link>
              <div className="flex items-center gap-4 text-sm">
              {user && roleMeta === "client" ? (
                <>
                  <Link className="text-white/90 hover:text-white" href="/client">
                    Кабинет
                  </Link>
                  <Link className="text-white/90 hover:text-white" href="/client/requests/new">
                    Создать
                  </Link>
                  <Link className="text-white/90 hover:text-white" href="/account/role">
                    Сменить роль
                  </Link>
                </>
              ) : null}
              {user && roleMeta === "master" ? (
                <>
                  <Link className="text-white/90 hover:text-white" href="/master">
                    Кабинет
                  </Link>
                  <Link className="text-white/90 hover:text-white" href="/master/requests">
                    Заявки
                  </Link>
                  <Link className="text-white/90 hover:text-white" href="/master/offers">
                    Мои отклики
                  </Link>
                  <Link className="text-white/90 hover:text-white" href="/account/role">
                    Сменить роль
                  </Link>
                </>
              ) : null}
              {user && roleMeta === "admin" ? (
                <Link className="text-white/90 hover:text-white" href="/admin">
                  Админ
                </Link>
              ) : null}
              {user && ["client", "master", "admin"].includes(roleMeta) ? (
                <NotificationsNavLink userId={user.id} />
              ) : null}
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="hidden text-xs text-white/70 md:inline">{fullNameMeta}</span>
                  <form action={signOut}>
                    <button type="submit" className="stage-button">
                      Выйти
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login" className="stage-button-primary">
                    Войти
                  </Link>
                  <Link href="/auth/register" className="stage-button">
                    Регистрация
                  </Link>
                </div>
              )}
              </div>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 page-enter">{children}</main>
        <footer className="mt-10 border-t border-white/15 bg-slate-900/45 py-10 text-white/80 backdrop-blur-2xl shadow-[0_-1px_0_rgba(255,255,255,0.06)_inset]">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-xl">
                <p className="text-sm font-semibold text-amber-200">ServiceDrive</p>
                <p className="mt-2 text-xs leading-5 text-white/70">
                  Сервис бытовых услуг: вы публикуете заявку с диапазоном цены, мастера отвечают своей ценой и примерным временем
                  приезда — вы выбираете исполнителя.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <Link className="text-white/70 hover:text-white" href="/terms">
                  Условия
                </Link>
                <Link className="text-white/70 hover:text-white" href="/privacy">
                  Политика
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
