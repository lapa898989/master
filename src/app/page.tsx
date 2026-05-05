import Link from "next/link";
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

      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/60 bg-gradient-to-b from-slate-950 to-slate-900 p-6 text-white shadow-[0_30px_90px_rgba(2,6,23,0.55)] md:p-10">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-fuchsia-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-amber-200/80">БЫСТРЫЙ ВЫБОР ИСПОЛНИТЕЛЯ</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              ServiceDrive
              <span className="block text-2xl font-medium text-slate-200/90 md:text-3xl">маркетплейс услуг в стиле inDrive</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-200/80 md:text-base">
              Клиент публикует заявку с вилкой бюджета. Мастера предлагают свою цену и ETA — вы сравниваете предложения и выбираете
              лучшее.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/client/requests/new" className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
                Создать заявку
              </Link>
              <Link href="/master/requests" className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/10">
                Я мастер — смотреть заявки
              </Link>
              <Link href="/auth/login" className="rounded-xl border border-white/15 bg-white/0 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/5">
                Войти
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-2 text-[11px] text-slate-300/80">
              {["Электрики", "Сантехники", "Сборка мебели", "Ремонт", "Клининг"].map((x) => (
                <span key={x} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {x}
                </span>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-amber-400/10 blur-2xl" />
            <p className="text-xs font-semibold tracking-wide text-amber-200/90">Как это работает</p>
            <ol className="mt-4 space-y-3">
              {[
                { t: "Публикация", d: "Опишите задачу, адрес, время и вилку бюджета." },
                { t: "Отклики", d: "Мастера предлагают цену и ETA — можно обновлять отклик." },
                { t: "Выбор", d: "Смотрите шкалу «бюджет ↔ цена» и выбираете исполнителя." },
                { t: "Чат", d: "После принятия отклика — чат и завершение заказа." }
              ].map((s) => (
                <li key={s.t} className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                  <p className="text-sm font-semibold">{s.t}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-200/70">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { step: "1", title: "Вилка бюджета", desc: "Как ставка в inDrive: обозначьте диапазон, чтобы мастерам было проще откликаться." },
          { step: "2", title: "Прозрачные отклики", desc: "Каждый отклик — цена, ETA и комментарий. Можно сравнивать на шкале бюджета." },
          { step: "3", title: "Назначение + чат", desc: "Выберите мастера и продолжайте общение в чате по заявке." }
        ].map((item) => (
          <div
            key={item.step}
            className="group rounded-2xl border border-slate-200/70 bg-white/60 p-5 shadow-[0_16px_50px_rgba(2,6,23,0.10)] backdrop-blur-xl transition hover:-translate-y-0.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-amber-200 shadow-lg shadow-slate-950/20">
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
            <p className="text-sm font-medium text-slate-700">Афиша работ</p>
            <h2 className="mt-1 text-2xl font-semibold">Популярные категории</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-600">Соберите короткую заявку и получите отклики мастеров в вашем городе.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { title: "Электрик", desc: "Розетки, автоматы, освещение, проводка", tag: "безопасность" },
            { title: "Сантехник", desc: "Протечки, смесители, монтаж, трубы", tag: "срочно" },
            { title: "Сборка мебели", desc: "Кухни, шкафы, кровати, крепёж", tag: "точность" },
            { title: "Ремонт", desc: "Отделка, плитка, полы, косметика", tag: "под ключ" },
            { title: "Клининг", desc: "После ремонта, окна, регулярная уборка", tag: "чисто" },
            { title: "Техника", desc: "Диагностика и мелкий ремонт", tag: "выезд" }
          ].map((x) => (
            <div
              key={x.title}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/60 p-5 shadow-[0_16px_50px_rgba(2,6,23,0.10)] backdrop-blur-xl transition hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-semibold">{x.title}</p>
                <span className="rounded-full border border-slate-200/70 bg-white/70 px-2 py-0.5 text-[10px] text-slate-700">
                  {x.tag}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{x.desc}</p>
              <div className="mt-5 overflow-hidden rounded-2xl bg-slate-950 p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-300" />
                  <span className="h-2 w-2 rounded-full bg-emerald-200" />
                  <span className="h-2 w-2 rounded-full bg-fuchsia-200" />
                </div>
                <div className="mt-4 h-1 w-16 rounded bg-gradient-to-r from-amber-300 to-emerald-200 transition-all group-hover:w-28" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/60 p-6 shadow-[0_16px_50px_rgba(2,6,23,0.10)] backdrop-blur-xl md:p-8">
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="text-sm font-medium text-slate-700">Три принципа</p>
            <h2 className="mt-2 text-2xl font-semibold">Как в зале: свет, темп, выбор</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Сервис построен на простых правилах: вы задаёте вилку, мастера отвечают конкретикой, а решение — всегда за вами.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5">
              <p className="text-sm font-semibold">Прозрачно</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Цена и ETA видны сразу — без “уточните в чате”.</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5">
              <p className="text-sm font-semibold">Быстро</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Отклики приходят в реальном времени — можно выбирать сразу.</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5">
              <p className="text-sm font-semibold">Справедливо</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Торг остаётся цивилизованным: диапазон, предложения, выбор.</p>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
