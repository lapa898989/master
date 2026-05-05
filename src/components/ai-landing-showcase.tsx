"use client";

import { useEffect, useMemo, useState } from "react";

type ServiceStory = {
  title: string;
  prompt: string;
  palette: string;
  imageCue: string;
  motionCue: string;
  result: string;
  gradient: string;
};

const serviceStories: ServiceStory[] = [
  {
    title: "Сантехник",
    prompt: "Протечка под раковиной, нужен мастер сегодня вечером",
    palette: "emerald",
    imageCue: "GPT Image 2 собирает чистый кадр кухни и точки поломки",
    motionCue: "Seedance 2.0 показывает короткий маршрут мастера к заказу",
    result: "3 отклика за 8 минут",
    gradient: "from-emerald-400/40 via-cyan-300/20 to-slate-900/10"
  },
  {
    title: "Электрик",
    prompt: "Не работает освещение в прихожей, нужен аккуратный ремонт",
    palette: "amber",
    imageCue: "GPT Image 2 подсвечивает щиток, проводку и безопасную зону",
    motionCue: "Seedance 2.0 оживляет сценарий диагностики без лишних деталей",
    result: "мастер найден за 12 минут",
    gradient: "from-amber-300/40 via-emerald-300/20 to-slate-900/10"
  },
  {
    title: "Клининг",
    prompt: "Генеральная уборка после ремонта в двухкомнатной квартире",
    palette: "fuchsia",
    imageCue: "GPT Image 2 создает понятный before/after визуал",
    motionCue: "Seedance 2.0 превращает его в плавный ролик для заявки",
    result: "5 ценовых предложений",
    gradient: "from-fuchsia-400/30 via-emerald-300/20 to-slate-900/10"
  }
];

const pipelineSteps = ["Анализ заявки", "GPT Image 2", "Seedance 2.0", "Отклики мастеров"];

export function AiLandingShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressTimer = window.setInterval(() => {
      setProgress((current) => (current >= 100 ? 0 : current + 2));
    }, 120);

    const storyTimer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % serviceStories.length);
      setProgress(0);
    }, 6200);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(storyTimer);
    };
  }, []);

  const activeStory = serviceStories[activeIndex];
  const activeStep = useMemo(() => {
    return Math.min(pipelineSteps.length - 1, Math.floor(progress / 25));
  }, [progress]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/50 px-3 py-1 text-xs font-medium text-emerald-900 shadow-sm backdrop-blur-xl">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.9)]" />
          GPT Image 2 + Seedance 2.0
        </div>

        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
            Заявка становится живой,
            <span className="text-emerald-700"> мастера отвечают быстрее.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            ServiceDrive превращает описание задачи в наглядный AI-визуал и короткий динамический сценарий: клиенту проще объяснить проблему, а мастеру проще оценить работу.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {serviceStories.map((story, index) => (
            <button
              key={story.title}
              type="button"
              onClick={() => {
                setActiveIndex(index);
                setProgress(0);
              }}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeIndex === index
                  ? "border-emerald-500/40 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "border-emerald-900/10 bg-white/50 text-slate-700 hover:bg-white/70"
              }`}
              aria-pressed={activeIndex === index}
            >
              {story.title}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl p-4 glass">
            <p className="text-2xl font-semibold text-slate-950">8 мин</p>
            <p className="mt-1 text-sm text-slate-500">до первого отклика</p>
          </div>
          <div className="rounded-2xl p-4 glass">
            <p className="text-2xl font-semibold text-slate-950">2 AI</p>
            <p className="mt-1 text-sm text-slate-500">визуал + видео</p>
          </div>
          <div className="rounded-2xl p-4 glass">
            <p className="text-2xl font-semibold text-slate-950">24/7</p>
            <p className="mt-1 text-sm text-slate-500">заявки онлайн</p>
          </div>
        </div>
      </div>

      <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-white/50 bg-white/40 p-4 shadow-2xl shadow-emerald-900/10 backdrop-blur-2xl">
        <div className={`absolute inset-0 bg-gradient-to-br ${activeStory.gradient}`} />
        <div className="ai-aurora absolute -right-16 top-10 h-56 w-56 rounded-full bg-white/50 blur-3xl" />
        <div className="ai-orbit absolute left-8 top-8 h-28 w-28 rounded-full border border-white/50" />

        <div className="relative flex h-full min-h-[488px] flex-col justify-between gap-4">
          <div className="rounded-3xl border border-white/50 bg-slate-950/80 p-4 text-white shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/80">AI заявка</p>
                <p className="mt-1 text-lg font-semibold">{activeStory.title}</p>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-100">{activeStory.result}</span>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs text-slate-400">Промпт клиента</p>
              <p className="mt-2 text-sm leading-6 text-slate-100">“{activeStory.prompt}”</p>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-200 transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              {pipelineSteps.map((step, index) => (
                <div
                  key={step}
                  className={`rounded-xl border px-3 py-2 text-xs transition ${
                    index <= activeStep ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-50" : "border-white/10 bg-white/5 text-slate-400"
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="ai-card-scan rounded-3xl border border-white/50 bg-white/70 p-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">GPT Image 2</p>
                <span className="rounded-full bg-slate-950 px-2 py-1 text-[10px] text-white">image</span>
              </div>
              <div className="mt-4 aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900 p-3">
                <div className="grid h-full grid-cols-3 gap-2">
                  <div className="rounded-xl bg-emerald-300/80" />
                  <div className="rounded-xl bg-white/80" />
                  <div className="rounded-xl bg-cyan-200/80" />
                  <div className="col-span-2 rounded-xl bg-white/20" />
                  <div className="rounded-xl bg-emerald-500/70" />
                </div>
              </div>
              <p className="mt-3 text-sm leading-5 text-slate-600">{activeStory.imageCue}</p>
            </div>

            <div className="rounded-3xl border border-white/50 bg-white/70 p-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Seedance 2.0</p>
                <span className="rounded-full bg-slate-950 px-2 py-1 text-[10px] text-white">video</span>
              </div>
              <div className="mt-4 space-y-2">
                {[0, 1, 2].map((frame) => (
                  <div key={frame} className="flex items-center gap-3 rounded-2xl bg-slate-950/90 p-2">
                    <div className="h-12 w-16 rounded-xl bg-gradient-to-br from-emerald-300/80 to-cyan-200/70" />
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-emerald-300 transition-all duration-300"
                        style={{ width: `${Math.max(16, (progress + frame * 18) % 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm leading-5 text-slate-600">{activeStory.motionCue}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
