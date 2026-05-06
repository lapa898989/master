"use client";

import Link from "next/link";
import { useTransition } from "react";

import { markNotificationReadAction } from "@/app/notifications/actions";

export type NotificationRowModel = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  href: string;
  read_at: string | null;
  created_at: string;
};

function typeHint(type: string): string {
  switch (type) {
    case "offer_new":
      return "Отклик";
    case "offer_accepted":
      return "Выбор";
    case "message_new":
      return "Чат";
    default:
      return "Событие";
  }
}

export function NotificationRow({ row }: { row: NotificationRowModel }) {
  const [pending, startTransition] = useTransition();
  const unread = !row.read_at;

  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        unread ? "border-amber-400/40 bg-amber-50/50 shadow-sm" : "border-slate-200/70 bg-white/60"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200/80 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
              {typeHint(row.type)}
            </span>
            <p className="text-sm font-semibold text-slate-900">{row.title}</p>
          </div>
          {row.body ? <p className="text-sm text-slate-600">{row.body}</p> : null}
          <p className="text-xs text-slate-500">{new Date(row.created_at).toLocaleString("ru-RU")}</p>
        </div>
        <Link
          href={row.href}
          onClick={() => {
            if (unread) {
              startTransition(() => {
                void markNotificationReadAction(row.id);
              });
            }
          }}
          className="stage-button-primary shrink-0 py-2 text-xs disabled:opacity-50"
          aria-disabled={pending}
        >
          Открыть
        </Link>
      </div>
    </div>
  );
}
