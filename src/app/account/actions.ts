"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export async function updateAppRoleAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/auth/login");
  }
  if (profile.role === "admin") {
    redirect("/admin");
  }

  const nextRole = String(formData.get("role") ?? "").trim();
  if (nextRole !== "client" && nextRole !== "master") {
    redirect("/account/role");
  }

  const supabase = await createClient();

  if (nextRole !== profile.role) {
    const { error: dbError } = await supabase.from("profiles").update({ role: nextRole }).eq("id", profile.id);
    if (dbError) {
      throw new Error(`Не удалось обновить роль: ${dbError.message}`);
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();
    const meta = { ...(user?.user_metadata as Record<string, unknown> | undefined), role: nextRole };
    const { error: authError } = await supabase.auth.updateUser({ data: meta });
    if (authError) {
      throw new Error(`Роль в базе обновлена, но сессия не обновилась: ${authError.message}. Выйдите и войдите снова.`);
    }
  }

  revalidatePath("/", "layout");
  revalidatePath("/client");
  revalidatePath("/master");
  revalidatePath("/account/role");

  redirect(nextRole === "master" ? "/master" : "/client");
}
