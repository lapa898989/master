"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialError = useMemo(() => searchParams.get("error"), [searchParams]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      const email = String(form.get("email") ?? "").trim().toLowerCase();
      const password = String(form.get("password") ?? "");
      const password2 = String(form.get("password2") ?? "");
      const role = String(form.get("role") ?? "client");
      const fullName = String(form.get("full_name") ?? "").trim();
      const city = String(form.get("city") ?? "").trim();
      const agreed = String(form.get("agree") ?? "") === "1";
      const normalizedRole = role === "master" ? "master" : "client";

      if (!agreed) {
        setError("Нужно согласиться с условиями и политикой конфиденциальности");
        return;
      }
      if (!email || password.length < 8 || !fullName || !city) {
        setError("Заполните все поля и пароль не короче 8 символов");
        return;
      }
      if (password !== password2) {
        setError("Пароли не совпадают");
        return;
      }

      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: normalizedRole, full_name: fullName, city } }
      });
      if (signUpError) {
        const msg = signUpError.message || "";
        if (msg.toLowerCase().includes("user already registered")) {
          router.replace("/auth/login?error=" + encodeURIComponent("Этот email уже зарегистрирован. Войдите в аккаунт."));
          return;
        }
        setError(msg);
        return;
      }
      if (!data.user) {
        setError("Не удалось создать пользователя");
        return;
      }
      if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setError("Пользователь с таким email уже существует");
        return;
      }

      router.replace("/auth/login?registered=1");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-4 p-6 stage-card">
      <h1 className="text-2xl font-semibold text-amber-200">Регистрация</h1>
      {initialError ? <p className="text-sm text-rose-200">{decodeURIComponent(initialError)}</p> : null}
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm text-white/80" htmlFor="full_name">
            Имя
          </label>
          <input id="full_name" name="full_name" required className="stage-input" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-white/80" htmlFor="city">
            Город
          </label>
          <input id="city" name="city" required className="stage-input" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-white/80" htmlFor="role">
            Я —
          </label>
          <select id="role" name="role" className="stage-input">
            <option className="text-slate-900" value="client">
              Клиент
            </option>
            <option className="text-slate-900" value="master">
              Мастер
            </option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-white/80" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="stage-input" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-white/80" htmlFor="password">
            Пароль (минимум 8 символов)
          </label>
          <input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required className="stage-input" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-white/80" htmlFor="password2">
            Повторите пароль
          </label>
          <input id="password2" name="password2" type="password" minLength={8} autoComplete="new-password" required className="stage-input" />
        </div>
        <label className="flex items-start gap-2 text-sm text-white/80">
          <input name="agree" value="1" type="checkbox" className="mt-1" required />
          <span>
            Я согласен с <Link className="text-amber-200 underline" href="/terms">условиями</Link> и{" "}
            <Link className="text-amber-200 underline" href="/privacy">политикой конфиденциальности</Link>.
          </span>
        </label>
        <button disabled={loading} type="submit" className="w-full stage-button-primary py-3 disabled:opacity-60">
          {loading ? "Создаём..." : "Создать аккаунт"}
        </button>
      </form>
    </section>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-md space-y-4 p-6 stage-card">
          <p className="text-white/70">Загрузка…</p>
        </section>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
