import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
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
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("id, role, full_name").eq("id", user.id).single()
    : { data: null };

  return (
    <html lang="ru">
      <body>
        <header className="border-b border-emerald-900/10 bg-white/30 backdrop-blur-2xl">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold tracking-wide text-emerald-700">
              ServiceDrive
            </Link>
            <div className="flex items-center gap-4 text-sm">
              {profile?.role === "client" ? (
                <>
                  <Link className="text-slate-800 hover:text-slate-950" href="/client">
                    Кабинет
                  </Link>
                  <Link className="text-slate-800 hover:text-slate-950" href="/client/requests/new">
                    Создать
                  </Link>
                </>
              ) : null}
              {profile?.role === "master" ? (
                <>
                  <Link className="text-slate-800 hover:text-slate-950" href="/master">
                    Кабинет
                  </Link>
                  <Link className="text-slate-800 hover:text-slate-950" href="/master/requests">
                    Заявки
                  </Link>
                  <Link className="text-slate-800 hover:text-slate-950" href="/master/offers">
                    Мои отклики
                  </Link>
                </>
              ) : null}
              {profile?.role === "admin" ? (
                <Link className="text-slate-800 hover:text-slate-950" href="/admin">
                  Админ
                </Link>
              ) : null}
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="hidden text-xs text-slate-600 md:inline">{profile?.full_name ?? user.email}</span>
                  <form action={signOut}>
                    <button type="submit" className="glass-button">
                      Выйти
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login" className="glass-button-primary">
                    Войти
                  </Link>
                  <Link href="/auth/register" className="glass-button">
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 page-enter">{children}</main>
        <footer className="border-t border-emerald-900/10 py-8">
          <div className="mx-auto max-w-6xl px-4 text-xs text-slate-600">
            ServiceDrive — маркетплейс бытовых услуг. Клиент публикует заявку, мастера предлагают цену, вы выбираете исполнителя.
          </div>
        </footer>
      </body>
    </html>
  );
}
