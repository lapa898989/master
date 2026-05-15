"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ChatMessage = {
  id: number;
  message: string;
  created_at: string;
  sender_id: string;
  sender_name?: string | null;
};

function pickNameFallback(name: unknown, senderId: string) {
  if (typeof name === "string" && name.trim()) return name.trim();
  return senderId;
}

/** Supabase Realtime / bigint часто отдаёт id как string — без этого новые сообщения не появляются. */
function parseMessageId(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function ChatThread({
  requestId,
  currentUserId,
  initialMessages
}: {
  requestId: number;
  currentUserId: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "subscribed" | "error">("connecting");
  const namesCacheRef = useRef<Map<string, string>>(new Map());
  const seenIdsRef = useRef<Set<number>>(new Set(initialMessages.map((m) => Number(m.id)).filter((n) => Number.isFinite(n))));

  const ordered = useMemo(() => {
    const copy = [...messages];
    copy.sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : a.id - b.id));
    return copy;
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    setRealtimeStatus("connecting");

    const ensureName = async (senderId: string, hint?: string | null) => {
      if (namesCacheRef.current.has(senderId)) return;
      const hinted = typeof hint === "string" && hint.trim() ? hint.trim() : null;
      if (hinted) {
        namesCacheRef.current.set(senderId, hinted);
        return;
      }
      const { data } = await supabase.from("profiles").select("full_name").eq("id", senderId).maybeSingle();
      const name = pickNameFallback(data?.full_name, senderId);
      namesCacheRef.current.set(senderId, name);
    };

    const channel = supabase
      .channel(`chat-thread-${requestId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "request_messages", filter: `request_id=eq.${requestId}` },
        async (payload) => {
          const row = payload.new as Partial<{ id: unknown; message: unknown; created_at: unknown; sender_id: unknown }> | null;
          const id = parseMessageId(row?.id);
          if (id === null) return;
          if (seenIdsRef.current.has(id)) return;

          const senderId = typeof row?.sender_id === "string" ? row.sender_id : "";
          const createdAt = typeof row?.created_at === "string" ? row.created_at : new Date().toISOString();
          const text = typeof row?.message === "string" ? row.message : "";

          await ensureName(senderId);
          const senderName = senderId ? namesCacheRef.current.get(senderId) : null;

          seenIdsRef.current.add(id);
          setMessages((prev) => [
            ...prev,
            {
              id,
              message: text,
              created_at: createdAt,
              sender_id: senderId,
              sender_name: senderName ?? null
            }
          ]);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeStatus("subscribed");
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setRealtimeStatus("error");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  return (
    <div className="space-y-2 p-4 glass-card">
      {realtimeStatus !== "subscribed" ? (
        <div className="rounded-lg border border-amber-600/20 bg-amber-50/60 p-3 text-sm text-amber-900">
          {realtimeStatus === "connecting" ? (
            <p>Подключаем обновления чата…</p>
          ) : (
            <>
              <p className="font-medium">Онлайн-обновления чата не работают.</p>
              <p className="mt-1 text-amber-800/90">
                Проверьте переменные `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` в `.env.local` и что в
                публикацию `supabase_realtime` добавлена таблица `request_messages` (см. `supabase/migrations/20250508120000_realtime_core_tables.sql`).
              </p>
            </>
          )}
        </div>
      ) : null}
      {ordered.length ? (
        ordered.map((msg) => {
          const name =
            msg.sender_id === currentUserId
              ? "Вы"
              : pickNameFallback(msg.sender_name ?? namesCacheRef.current.get(msg.sender_id), msg.sender_id);
          return (
            <article
              key={msg.id}
              className={`rounded-xl p-3 ${
                msg.sender_id === currentUserId ? "bg-emerald-600/10" : "bg-white/40"
              } backdrop-blur`}
            >
              <p className="text-xs text-slate-500">{name}</p>
              <p>{msg.message}</p>
            </article>
          );
        })
      ) : (
        <p className="text-sm text-slate-500">Сообщений пока нет.</p>
      )}
    </div>
  );
}

