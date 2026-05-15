import { notFound, redirect } from "next/navigation";
import { sendMessageAction } from "@/app/chat/actions";
import { ChatThread } from "@/components/chat-thread";
import { getCurrentProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: Promise<{ requestId: string }> }) {
  const p = await params;
  const requestId = Number(p.requestId);
  const profile = await getCurrentProfile();
  if (!requestId) return notFound();
  if (!profile) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  const {
    data: request,
    error: requestError
  } = await supabase.from("requests").select("id, client_id").eq("id", requestId).maybeSingle();
  if (!request) {
    return (
      <section className="mx-auto max-w-2xl space-y-3 stage-card-light p-6">
        <h1 className="text-xl font-semibold">Чат не найден</h1>
        <p className="text-sm text-slate-600">Заявка #{requestId} не найдена или у вас нет доступа.</p>
        {requestError ? <p className="text-xs text-slate-500">Supabase: {requestError.message}</p> : null}
      </section>
    );
  }

  const { data: assignment } = await supabase
    .from("assignments")
    .select("offer_id")
    .eq("request_id", requestId)
    .maybeSingle();

  if (!assignment) {
    return <p>Чат доступен после выбора мастера.</p>;
  }

  const { data: acceptedOffer } = await supabase.from("offers").select("master_id").eq("id", assignment.offer_id).maybeSingle();
  const canAccess = profile.role === "admin" || request.client_id === profile.id || acceptedOffer?.master_id === profile.id;
  if (!canAccess) {
    return (
      <section className="mx-auto max-w-2xl space-y-3 stage-card-light p-6">
        <h1 className="text-xl font-semibold">Нет доступа к чату</h1>
        <p className="text-sm text-slate-600">Чат доступен только клиенту, выбранному мастеру или администратору.</p>
      </section>
    );
  }

  const {
    data: messages,
    error: messagesError
  } = await supabase
    .from("request_messages")
    .select("id, message, created_at, sender_id")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    return (
      <section className="mx-auto max-w-2xl space-y-3 stage-card-light p-6">
        <h1 className="text-xl font-semibold">Не удалось загрузить чат</h1>
        <p className="text-sm text-slate-600">Ошибка при загрузке сообщений.</p>
        <p className="text-xs text-slate-500">{messagesError.message}</p>
      </section>
    );
  }

  const senderIds = Array.from(new Set((messages ?? []).map((m) => m.sender_id).filter(Boolean))) as string[];
  const namesById = new Map<string, string>();
  if (senderIds.length) {
    const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", senderIds);
    for (const row of profs ?? []) {
      if (row.id && typeof row.full_name === "string" && row.full_name.trim()) {
        namesById.set(row.id, row.full_name.trim());
      }
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Чат по заявке #{requestId}</h1>
      <ChatThread
        requestId={requestId}
        currentUserId={profile.id}
        initialMessages={
          (messages ?? []).map((m) => ({
            id: Number(m.id),
            message: m.message,
            created_at: m.created_at,
            sender_id: m.sender_id,
            sender_name: namesById.get(m.sender_id) ?? null
          })) as Array<{
            id: number;
            message: string;
            created_at: string;
            sender_id: string;
            sender_name?: string | null;
          }>
        }
      />
      <form action={sendMessageAction} className="flex gap-2">
        <input type="hidden" name="request_id" value={requestId} />
        <input
          name="message"
          required
          placeholder="Введите сообщение..."
          className="flex-1 rounded-lg border border-emerald-900/10 bg-white/40 p-3 text-slate-900 outline-none placeholder:text-slate-500"
        />
        <button type="submit" className="glass-button-primary">
          Отправить
        </button>
      </form>
    </section>
  );
}
