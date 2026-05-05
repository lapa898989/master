"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export async function upsertOfferAction(formData: FormData) {
  const profile = await requireRole(["master"]);
  const supabase = await createClient();

  const requestId = Number(formData.get("request_id"));
  const price = Number(formData.get("price"));
  const etaMinutes = Number(formData.get("eta_minutes"));
  const comment = String(formData.get("comment") ?? "").trim();
  if (!requestId || Number.isNaN(price) || price <= 0 || Number.isNaN(etaMinutes) || etaMinutes <= 0 || !comment) {
    redirect("/master/requests?error=" + encodeURIComponent("Проверьте поля отклика"));
  }
  const payload = {
    request_id: requestId,
    master_id: profile.id,
    price,
    comment,
    eta_minutes: etaMinutes
  };

  const { error } = await supabase
    .from("offers")
    .upsert(payload, { onConflict: "request_id,master_id", ignoreDuplicates: false })
    .select("id");
  if (error) {
    console.error("upsertOfferAction error", error);
    redirect("/master/requests?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/master/requests");
  revalidatePath("/master/offers");
  revalidatePath(`/client/requests/${requestId}`);
  redirect(`/master/requests?sent=${requestId}`);
}
