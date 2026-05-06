import { notFound, redirect } from "next/navigation";
import { sendMessageAction } from "@/app/chat/actions";
import { ChatLive } from "@/components/chat-live";
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
  const { data: request } = await supabase.from("requests").select("id, client_id").eq("id", requestId).maybeSingle();
  if (!request) {
    return (
      <section className="mx-auto max-w-2xl space-y-3 stage-card-light p-6">
        <h1 className="text-xl font-semibold">Чат не найден</h1>
        <p className="text-sm text-slate-600">Заявка #{requestId} не найдена или у вас нет доступа.</p>
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

  const { data: messages } = await supabase
    .from("request_messages")
    .select("id, message, created_at, sender_id, profiles:sender_id(full_name)")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <ChatLive requestId={requestId} />
      <h1 className="text-2xl font-semibold">Чат по заявке #{requestId}</h1>
      <div className="space-y-2 p-4 glass-card">
        {messages?.length ? (
          messages.map((msg) => (
            <article key={msg.id} className={`rounded-xl p-3 ${msg.sender_id === profile.id ? "bg-emerald-600/10" : "bg-white/40"} backdrop-blur`}>
              <p className="text-xs text-slate-500">{(msg.profiles as { full_name?: string } | null)?.full_name ?? "Пользователь"}</p>
              <p>{msg.message}</p>
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-500">Сообщений пока нет.</p>
        )}
      </div>
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
