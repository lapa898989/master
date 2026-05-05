"use client";

import { useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: "http://80.78.243.126/auth/reset"
      });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setStatus("Мы отправили письмо для восстановления пароля (если email зарегистрирован).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-4 p-6 glass-card">
      <h1 className="text-2xl font-semibold">Восстановление пароля</h1>
      {status ? <p className="text-sm text-emerald-700">{status}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-emerald-900/10 bg-white/40 p-3 text-slate-900 outline-none"
          />
        </div>
        <button disabled={loading} type="submit" className="w-full glass-button-primary py-3 disabled:opacity-60">
          {loading ? "Отправляем..." : "Отправить ссылку"}
        </button>
      </form>
      <Link className="text-sm text-emerald-700 underline" href="/auth/login">
        Вернуться ко входу
      </Link>
    </section>
  );
}

