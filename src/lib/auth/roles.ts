import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "client" | "master" | "admin";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, city, is_banned")
    .eq("id", user.id)
    .single();

  // Если profiles временно недоступен/ошибка RLS/таймаут — не «разлогиниваем» пользователя.
  // Делаем мягкий fallback из user_metadata, чтобы кабинеты не выкидывало на /auth/login.
  if (error || !data) {
    const metaRole = (user.user_metadata?.role as unknown) === "master" ? "master" : (user.user_metadata?.role as unknown) === "admin" ? "admin" : "client";
    const fullName =
      typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
        ? String(user.user_metadata.full_name)
        : typeof user.email === "string"
          ? user.email
          : "Пользователь";
    const city = typeof user.user_metadata?.city === "string" ? String(user.user_metadata.city) : "";
    return { id: user.id, role: metaRole, full_name: fullName, city, is_banned: false } as const;
  }

  return data;
}

export async function requireRole(roles: AppRole[]) {
  const profile = await getCurrentProfile();
  if (!profile || profile.is_banned || !roles.includes(profile.role as AppRole)) {
    redirect("/auth/login");
  }
  return profile;
}
