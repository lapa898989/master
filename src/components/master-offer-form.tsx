"use client";

import { useMemo, useState } from "react";
import { BudgetOfferBar } from "@/components/budget-offer-bar";
import { upsertOfferAction } from "@/app/master/actions";

export function MasterOfferForm({
  requestId,
  budgetMin,
  budgetMax
}: {
  requestId: number;
  budgetMin: number;
  budgetMax: number;
}) {
  const mid = Math.round((budgetMin + budgetMax) / 2);
  const [price, setPrice] = useState(mid);
  const safePrice = useMemo(() => (Number.isFinite(price) && price > 0 ? price : mid), [price, mid]);

  const inputClass = "stage-input-light";

  return (
    <div className="space-y-3">
      <BudgetOfferBar budgetMin={budgetMin} budgetMax={budgetMax} offerPrice={safePrice} variant="light" />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPrice(budgetMin)}
          className="rounded-lg border border-emerald-900/15 bg-white/60 px-3 py-1.5 text-xs text-slate-800 hover:bg-white/80"
        >
          Как мин. бюджет ({budgetMin} ₽)
        </button>
        <button
          type="button"
          onClick={() => setPrice(budgetMax)}
          className="rounded-lg border border-emerald-900/15 bg-white/60 px-3 py-1.5 text-xs text-slate-800 hover:bg-white/80"
        >
          Как макс. бюджет ({budgetMax} ₽)
        </button>
        <button
          type="button"
          onClick={() => setPrice(mid)}
          className="rounded-lg border border-emerald-900/15 bg-white/60 px-3 py-1.5 text-xs text-slate-800 hover:bg-white/80"
        >
          Середина ({mid} ₽)
        </button>
      </div>
      <form action={upsertOfferAction} className="grid gap-2 md:grid-cols-3">
        <input type="hidden" name="request_id" value={requestId} />
        <input
          name="price"
          type="number"
          min={100}
          required
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="Ваша цена"
          className={inputClass}
        />
        <input name="eta_minutes" type="number" min={10} required placeholder="Минут до выезда" className={inputClass} />
        <input name="comment" required placeholder="Комментарий (оборудование, нюансы)" className={inputClass} />
        <button type="submit" className="stage-button-primary py-3 md:col-span-3">
          Отправить цену (повторно — обновит отклик)
        </button>
      </form>
      <p className="text-[11px] text-slate-500">
        Как в InDrive: клиент задал вилку, вы предлагаете свою сумму; можно изменить отклик, пока заказ открыт.
      </p>
    </div>
  );
}
