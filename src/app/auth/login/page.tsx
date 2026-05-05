"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registered = useMemo(() => searchParams.get("registered"), [searchParams]);
  const initialError = useMemo(() => searchParams.get("error"), [searchParams]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      const email = String(form.get("email") ?? "").trim().toLowerCase();
      const password = String(form.get("password") ?? "");

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("role,is_banned")
        .single();
      if (profileError) {
        setError(profileError.message);
        return;
      }

      if (data?.is_banned) {
        await supabase.auth.signOut();
        setError("Ваш аккаунт заблокирован");
        return;
      }

      const role = data?.role ?? "client";
      if (role === "master") router.replace("/master/requests");
      else if (role === "admin") router.replace("/admin");
      else router.replace("/client/requests");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-4 p-6 glass-card">
      <h1 className="text-2xl font-semibold">Вход</h1>
      {registered ? <p className="text-sm text-green-300">Аккаунт создан, можно входить.</p> : null}
      {initialError ? <p className="text-sm text-red-300">{decodeURIComponent(initialError)}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm text-slate-700" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="w-full rounded-lg border border-emerald-900/10 bg-white/40 p-3 text-slate-900 outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-slate-700" htmlFor="password">
            Пароль
          </label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="w-full rounded-lg border border-emerald-900/10 bg-white/40 p-3 text-slate-900 outline-none" />
        </div>
        <button disabled={loading} type="submit" className="w-full glass-button-primary py-3 disabled:opacity-60">
          {loading ? "Входим..." : "Войти"}
        </button>
      </form>
      <div className="flex items-center justify-between text-sm">
        <Link className="text-emerald-700 underline" href="/auth/forgot">
          Забыли пароль?
        </Link>
        <span>
          Нет аккаунта?{" "}
          <Link className="text-emerald-700 underline" href="/auth/register">
            Регистрация
          </Link>
        </span>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-md space-y-4 p-6 glass-card">
          <p className="text-slate-600">Загрузка…</p>
        </section>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
