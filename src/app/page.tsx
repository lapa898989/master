import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/roles";
import { getSiteUrl } from "@/lib/site-url";
import { VideoPresentation } from "@/components/video-presentation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const profile = await getCurrentProfile();
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
              <span className="block text-2xl font-medium text-slate-200/90 md:text-3xl">услуги рядом с домом — цену предлагают мастера</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-200/80 md:text-base">
              Вы описываете задачу и пишете, сколько готовы заплатить — от меньшей суммы до большей. Мастера отвечают своей ценой и
              примерным временем приезда. Вы сравниваете предложения и выбираете удобный вариант.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {!profile ? (
                <>
                  <Link href="/client/requests/new" className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
                    Создать заявку
                  </Link>
                  <Link
                    href="/master/requests"
                    className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/10"
                  >
                    Я мастер — смотреть заявки
                  </Link>
                  <Link
                    href="/auth/login"
                    className="rounded-xl border border-white/15 bg-white/0 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/5"
                  >
                    Войти
                  </Link>
                </>
              ) : profile.role === "admin" ? (
                <Link href="/admin" className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
                  Админ-панель
                </Link>
              ) : profile.role === "master" ? (
                <>
                  <Link href="/master/requests" className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
                    Смотреть заявки
                  </Link>
                  <Link
                    href="/master"
                    className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/10"
                  >
                    Кабинет мастера
                  </Link>
                  <Link
                    href="/master/offers"
                    className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/10"
                  >
                    Мои отклики
                  </Link>
                  <Link
                    href="/account/role"
                    className="rounded-xl border border-white/15 bg-white/0 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/5"
                  >
                    Сменить роль
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/client/requests/new" className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
                    Создать заявку
                  </Link>
                  <Link
                    href="/client"
                    className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/10"
                  >
                    Мой кабинет
                  </Link>
                  <Link
                    href="/client/requests"
                    className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/10"
                  >
                    Мои заявки
                  </Link>
                  <Link
                    href="/account/role"
                    className="rounded-xl border border-white/15 bg-white/0 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/5"
                  >
                    Сменить роль
                  </Link>
                </>
              )}
            </div>
            <div className="mt-7 flex flex-wrap gap-2 text-[11px] text-slate-300/80">
              {["Электрики", "Сантехники", "Сборка мебели", "Ремонт", "Клининг"].map((x) => (
                <span key={x} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {x}
                </span>
              ))}
            </div>
            {profile ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-xl">
                <p className="text-xs font-semibold text-amber-200/90">
                  {profile.is_banned ? "Аккаунт заблокирован" : `Здравствуйте, ${profile.full_name}`}
                </p>
                {!profile.is_banned ? (
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
                    {profile.role === "admin" ? "Роль: администратор" : profile.role === "master" ? "Роль: мастер" : "Роль: клиент"}
                  </p>
                ) : null}
                {profile.is_banned ? (
                  <p className="mt-2 text-xs leading-5 text-red-200/90">Доступ к заявкам и откликам ограничен. Если это ошибка — свяжитесь с поддержкой.</p>
                ) : profile.role === "admin" ? (
                  <p className="mt-2 text-xs leading-5 text-slate-200/80">
                    В админ-панели можно просматривать пользователей и заявки, при необходимости вмешиваться в модерацию.
                  </p>
                ) : profile.role === "master" ? (
                  <p className="mt-2 text-xs leading-5 text-slate-200/80">
                    Откройте ленту заявок в вашем городе и отправьте отклик с ценой и временем приезда. Когда клиент вас выберет, откроется чат по заказу. Новые события
                    приходят в уведомления — не обязательно обновлять страницу.
                  </p>
                ) : (
                  <p className="mt-2 text-xs leading-5 text-slate-200/80">
                    Создайте заявку с адресом, удобным временем и диапазоном цены — мастера ответят своими предложениями. Сравните цены на одном экране, выберите исполнителя и
                    общайтесь в чате. Непрочитанные сообщения и отклики подсвечиваются в кабинете и в уведомлениях.
                  </p>
                )}
                {!profile.is_banned && profile.city ? (
                  <p className="mt-3 text-[11px] text-slate-400">Город в профиле: {profile.city}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-amber-400/10 blur-2xl" />
            <p className="text-xs font-semibold tracking-wide text-amber-200/90">Как это работает</p>
            <ol className="mt-4 space-y-3">
              {[
                { t: "Заявка", d: "Расскажите, что нужно сделать, укажите адрес, когда удобно и диапазон цены (от и до)." },
                { t: "Ответы мастеров", d: "Мастера пишут цену и примерно, когда смогут приехать. Ответ можно обновить." },
                { t: "Выбор", d: "На экране видно, как цена мастера относится к вашему диапазону — так проще сравнить." },
                { t: "Общение", d: "Когда выбрали мастера — можно переписываться в чате по заказу." }
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

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-700">Видеопрезентация</p>
            <h2 className="mt-1 text-2xl font-semibold">Посмотрите, как всё устроено</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Коротко показываем: как оформить заявку, получить ответы мастеров и выбрать исполнителя.
            </p>
          </div>
        </div>
        <VideoPresentation />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            step: "1",
            title: "Диапазон цены",
            desc: "Напишите, сколько готовы заплатить — от меньшей суммы до большей. Так мастерам проще предложить свою цену."
          },
          {
            step: "2",
            title: "Понятные ответы",
            desc: "В каждом отклике — цена, примерное время приезда и комментарий. Всё можно сравнить на одном экране."
          },
          {
            step: "3",
            title: "Выбор и чат",
            desc: "Выбираете мастера и продолжаете общение в чате по конкретному заказу."
          }
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
            <p className="text-sm font-medium text-slate-700">Часто заказывают</p>
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
            <h2 className="mt-2 text-2xl font-semibold">Простые правила</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Вы заранее обозначаете диапазон цены, мастера отвечают цифрами и сроками, а выбирать исполнителя — всегда вы.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5">
              <p className="text-sm font-semibold">Прозрачно</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Цена и примерное время приезда видны сразу — без долгих уточнений.</p>
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
