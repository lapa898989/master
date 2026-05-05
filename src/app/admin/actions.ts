"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export async function updateRequestStatusAction(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const requestId = Number(formData.get("request_id"));
  const status = String(formData.get("status") ?? "open");
  await supabase.from("requests").update({ status }).eq("id", requestId);
  revalidatePath("/admin");
}

export async function updateProfileBanAction(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const profileId = String(formData.get("profile_id") ?? "");
  const isBanned = String(formData.get("is_banned")) === "true";
  await supabase.from("profiles").update({ is_banned: isBanned }).eq("id", profileId);
  revalidatePath("/admin");
}
