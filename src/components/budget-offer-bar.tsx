"use client";

export function priceVsBudgetMeta(budgetMin: number, budgetMax: number, offerPrice: number) {
  if (offerPrice >= budgetMin && offerPrice <= budgetMax) {
    return { tone: "ok" as const, label: "В вашем диапазоне" };
  }
  if (offerPrice < budgetMin) {
    return { tone: "low" as const, label: `На ${budgetMin - offerPrice} ₽ ниже минимума — выгодно` };
  }
  return { tone: "high" as const, label: `На ${offerPrice - budgetMax} ₽ выше максимума` };
}

export function BudgetOfferBar({
  budgetMin,
  budgetMax,
  offerPrice,
  variant = "light",
  mode = "compare"
}: {
  budgetMin: number;
  budgetMax: number;
  offerPrice: number;
  variant?: "light" | "dark";
  /** `corridor` — только вилка клиента без точки сравнения (для карточки заявки) */
  mode?: "compare" | "corridor";
}) {
  const span = Math.max(budgetMax - budgetMin, 1);
  const rawPct = ((offerPrice - budgetMin) / span) * 100;
  const pct = Math.min(100, Math.max(0, rawPct));
  const meta = mode === "corridor" ? null : priceVsBudgetMeta(budgetMin, budgetMax, offerPrice);

  const track =
    variant === "dark"
      ? "border-white/15 bg-slate-950/40"
      : "border-emerald-900/10 bg-slate-200/80";
  const zone =
    variant === "dark"
      ? "bg-gradient-to-r from-emerald-600/35 via-teal-500/25 to-cyan-500/25"
      : "bg-gradient-to-r from-emerald-300/90 via-teal-200/80 to-cyan-200/70";
  const markerRing = variant === "dark" ? "ring-white/30 bg-white" : "ring-emerald-700/25 bg-indigo-600";
  const labelMuted = variant === "dark" ? "text-slate-400" : "text-slate-500";

  const badge = meta
    ? meta.tone === "ok"
      ? variant === "dark"
        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-100"
        : "border-emerald-600/30 bg-emerald-50 text-emerald-900"
      : meta.tone === "low"
        ? variant === "dark"
          ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100"
          : "border-cyan-600/30 bg-cyan-50 text-cyan-950"
        : variant === "dark"
          ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
          : "border-amber-600/30 bg-amber-50 text-amber-950"
    : "";

  return (
    <div className="space-y-2">
      <div className={`flex flex-wrap items-center justify-between gap-2 text-xs ${labelMuted}`}>
        <span>Бюджет {budgetMin.toLocaleString("ru-RU")}–{budgetMax.toLocaleString("ru-RU")} ₽</span>
        {meta ? <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge}`}>{meta.label}</span> : null}
      </div>
      <div className={`relative h-10 overflow-hidden rounded-2xl border ${track}`}>
        <div className="absolute inset-y-2 left-2 right-2 rounded-xl overflow-hidden">
          <div className={`absolute inset-0 ${zone} opacity-90`} />
          {mode === "compare" ? (
            <div
              className="pointer-events-none absolute inset-y-0 w-1 -translate-x-1/2 shadow-lg"
              style={{ left: `${pct}%` }}
            >
              <div className={`mx-auto h-full w-3 rounded-full ${markerRing} ring-2`} />
            </div>
          ) : null}
        </div>
        <div
          className={`relative z-[1] flex h-full items-center justify-between px-3 text-[11px] font-semibold ${
            variant === "dark" ? "text-white/90" : "text-slate-900/80"
          }`}
        >
          <span className="drop-shadow-sm">мин</span>
          <span className="tabular-nums drop-shadow-sm">
            {mode === "corridor" ? "ваша вилка" : `${offerPrice.toLocaleString("ru-RU")} ₽`}
          </span>
          <span className="drop-shadow-sm">макс</span>
        </div>
      </div>
      {mode === "compare" && rawPct < 0 ? (
        <p className={`text-[11px] ${variant === "dark" ? "text-cyan-200/90" : "text-cyan-800"}`}>
          Маркер слева: цена ниже заявленного минимума — часто лучшая сделка для клиента.
        </p>
      ) : null}
      {mode === "compare" && rawPct > 100 ? (
        <p className={`text-[11px] ${variant === "dark" ? "text-amber-200/90" : "text-amber-800"}`}>
          Маркер справа: цена выше вашего максимума — можно поднять бюджет или выбрать другого мастера.
        </p>
      ) : null}
    </div>
  );
}
