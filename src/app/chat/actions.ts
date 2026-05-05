"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export async function sendMessageAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const requestId = Number(formData.get("request_id"));
  const message = String(formData.get("message") ?? "").trim();
  if (!requestId || !message) return;

  const supabase = await createClient();
  await supabase.from("request_messages").insert({
    request_id: requestId,
    sender_id: profile.id,
    message
  });

  revalidatePath(`/chat/${requestId}`);
}
