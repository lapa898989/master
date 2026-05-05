import Link from "next/link";
import { AiLandingShowcase } from "@/components/ai-landing-showcase";
import { getSiteUrl } from "@/lib/site-url";

export default function Home() {
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ServiceDrive",
    url: `${siteUrl}/`
  };

  return (
    <section className="space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="relative overflow-hidden rounded-[2rem] p-5 glass-card md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-fuchsia-600/10 blur-3xl" />
        <AiLandingShowcase />
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/auth/register" className="glass-button-primary px-5 py-3">
            Создать аккаунт
          </Link>
          <Link href="/auth/login" className="glass-button px-5 py-3">
            Войти
          </Link>
          <Link href="/client/requests/new" className="glass-button px-5 py-3">
            Создать заявку
          </Link>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { step: "1", title: "Опишите проблему", desc: "Категория, вилка бюджета (мин–макс), адрес и удобное время — как цена поездки в InDrive." },
          { step: "2", title: "AI усиливает заявку", desc: "GPT Image 2 готовит визуал, Seedance 2.0 добавляет динамический сценарий." },
          { step: "3", title: "Торг и выбор", desc: "Мастера предлагают цену по вашей вилке — на шкале видно, кто в диапазоне; затем чат по заказу." }
        ].map((item) => (
          <div key={item.step} className="group rounded-2xl p-5 transition hover:-translate-y-0.5 glass">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20">
              {item.step}
            </span>
            <p className="mt-4 text-base font-semibold">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-emerald-700">Динамические категории</p>
            <h2 className="mt-1 text-2xl font-semibold">Популярные услуги</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-500">Каждая категория может получить AI-визуал для понятной заявки и короткий видеосценарий для мастера.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { title: "Электрик", desc: "Розетки, проводка, автоматы, освещение", tag: "свет + безопасность" },
            { title: "Сантехник", desc: "Смесители, протечки, трубы, установка", tag: "протечки + монтаж" },
            { title: "Сборка мебели", desc: "Кухни, шкафы, кровати, крепёж", tag: "сборка + крепеж" },
            { title: "Ремонт квартиры", desc: "Косметика, отделка, плитка, полы", tag: "before/after" },
            { title: "Клининг", desc: "Уборка, мойка окон, после ремонта", tag: "чистота в кадре" },
            { title: "Бытовая техника", desc: "Диагностика и мелкий ремонт", tag: "диагностика" }
          ].map((x) => (
            <div
              key={x.title}
              className="group rounded-2xl p-5 transition hover:-translate-y-1 glass"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-semibold">{x.title}</p>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300 backdrop-blur">
                  {x.tag}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{x.desc}</p>
              <div className="mt-5 overflow-hidden rounded-2xl bg-slate-950/90 p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  <span className="h-2 w-2 rounded-full bg-cyan-200" />
                  <span className="h-2 w-2 rounded-full bg-fuchsia-200" />
                </div>
                <div className="mt-4 h-1 w-16 rounded bg-gradient-to-r from-emerald-300 to-cyan-200 transition-all group-hover:w-28" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] p-6 glass-card md:p-8">
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="text-sm font-medium text-emerald-700">Как это выглядит для пользователя</p>
            <h2 className="mt-2 text-2xl font-semibold">Меньше текста, больше ясности</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Клиент пишет обычную заявку, а интерфейс показывает, какой визуал и движение будут сгенерированы для мастеров. Это делает главную страницу живой и сразу объясняет пользу AI-функции.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl p-5 glass">
              <p className="text-sm font-semibold">Прозрачно</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Отклики с ценой и сроком — вы выбираете сами.</p>
            </div>
            <div className="rounded-2xl p-5 glass floaty">
              <p className="text-sm font-semibold">Визуально</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">GPT Image 2 помогает показать проблему без сложных объяснений.</p>
            </div>
            <div className="rounded-2xl p-5 glass">
              <p className="text-sm font-semibold">Динамично</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Seedance 2.0 добавляет короткий сценарий и ощущение живого сервиса.</p>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
