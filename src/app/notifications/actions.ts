"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationReadAction(notificationId: number) {
  const profile = await requireRole(["client", "master", "admin"]);
  const supabase = await createClient();
  const now = new Date().toISOString();
  await supabase
    .from("notifications")
    .update({ read_at: now })
    .eq("id", notificationId)
    .eq("user_id", profile.id);
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const profile = await requireRole(["client", "master", "admin"]);
  const supabase = await createClient();
  const now = new Date().toISOString();
  await supabase.from("notifications").update({ read_at: now }).eq("user_id", profile.id).is("read_at", null);
  revalidatePath("/notifications");
}
