"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export async function createRequestAction(formData: FormData) {
  const profile = await requireRole(["client"]);
  const supabase = await createClient();
  const budgetMin = Number(formData.get("budget_min"));
  const budgetMax = Number(formData.get("budget_max"));
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const desiredTime = String(formData.get("desired_time") ?? "");

  if (!title || !description || !address || !desiredTime || Number.isNaN(budgetMin) || Number.isNaN(budgetMax) || budgetMin <= 0 || budgetMax < budgetMin) {
    redirect("/client/requests/new?error=" + encodeURIComponent("Проверьте поля формы"));
  }

  // `<input type="datetime-local">` gives no timezone; convert to ISO for timestamptz.
  const desiredTimeIso = new Date(desiredTime).toISOString();

  const payload = {
    client_id: profile.id,
    category_id: Number(formData.get("category_id")),
    title,
    description,
    address,
    city: profile.city,
    budget_min: budgetMin,
    budget_max: budgetMax,
    desired_time: desiredTimeIso
  };

  const { data, error } = await supabase.from("requests").insert(payload).select("id").single();
  if (error) {
    console.error("createRequestAction insert requests error", error);
    redirect("/client/requests/new?error=" + encodeURIComponent(error.message));
  }

  const requestId = data?.id;
  const rawPhotoUrls = String(formData.get("photo_urls") ?? "");
  const photoUrls = rawPhotoUrls
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter((item) => item.startsWith("http://") || item.startsWith("https://"))
    .slice(0, 5);

  if (requestId && photoUrls.length) {
    const { error: photosError } = await supabase
      .from("request_photos")
      .insert(photoUrls.map((url) => ({ request_id: requestId, photo_url: url })));
    if (photosError) {
      console.error("createRequestAction insert request_photos error", photosError);
    }
  }

  revalidatePath("/client/requests");
  redirect("/client/requests");
}

export async function acceptOfferAction(formData: FormData) {
  await requireRole(["client"]);
  const supabase = await createClient();
  const offerId = Number(formData.get("offer_id"));
  const requestId = Number(formData.get("request_id"));
  if (!offerId || !requestId) return;

  const { error } = await supabase.rpc("accept_offer", {
    p_offer_id: offerId,
    p_request_id: requestId
  });

  if (error) {
    redirect(`/client/requests/${requestId}?error=offer`);
  }

  revalidatePath(`/client/requests/${requestId}`);
  redirect(`/client/requests/${requestId}?accepted=1`);
}

export async function raiseRequestBudgetAction(formData: FormData) {
  const profile = await requireRole(["client"]);
  const supabase = await createClient();
  const requestId = Number(formData.get("request_id"));
  const newBudgetMax = Number(formData.get("new_budget_max"));

  if (!requestId || Number.isNaN(requestId) || Number.isNaN(newBudgetMax) || newBudgetMax <= 0) {
    redirect("/client/requests?budget_error=1");
  }

  const { data: row, error: fetchError } = await supabase
    .from("requests")
    .select("id, client_id, status, budget_min, budget_max")
    .eq("id", requestId)
    .single();

  if (fetchError || !row || row.client_id !== profile.id || row.status !== "open") {
    redirect(`/client/requests/${requestId}?budget_error=1`);
  }

  if (newBudgetMax < row.budget_min) {
    redirect(`/client/requests/${requestId}?budget_error=min`);
  }

  if (newBudgetMax < row.budget_max) {
    redirect(`/client/requests/${requestId}?budget_error=lower`);
  }

  const { error } = await supabase.from("requests").update({ budget_max: newBudgetMax }).eq("id", requestId);
  if (error) {
    console.error("raiseRequestBudgetAction update error", error);
    redirect(`/client/requests/${requestId}?budget_error=1`);
  }

  revalidatePath(`/client/requests/${requestId}`);
  redirect(`/client/requests/${requestId}?budget_ok=1`);
}
