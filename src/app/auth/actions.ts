"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "client");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const normalizedRole = role === "master" ? "master" : "client";

  if (!email || password.length < 6 || !fullName || !city) {
    redirect("/auth/register?error=Заполните все поля и пароль не короче 6 символов");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: normalizedRole,
        full_name: fullName,
        city
      }
    }
  });

  if (error) {
    redirect(`/auth/register?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.user) {
    redirect("/auth/register?error=Не удалось создать пользователя");
  }

  // Supabase can return a user object for an existing email, but with no identities.
  if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    redirect("/auth/register?error=Пользователь с таким email уже существует");
  }

  redirect("/auth/login?registered=1");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    redirect("/auth/login?error=Введите email и пароль");
  }

  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  const user = signInData.user;
  const { data } = await supabase.from("profiles").select("role,is_banned").eq("id", user?.id ?? "").single();

  if (data?.is_banned) {
    await supabase.auth.signOut();
    redirect("/auth/login?error=Ваш аккаунт заблокирован");
  }

  const role = data?.role ?? "client";
  if (role === "admin") redirect("/admin");
  if (role === "master") redirect("/master");
  redirect("/client");
}
