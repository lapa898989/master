"use client";

import { useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);

    if (password.length < 8) {
      setError("Пароль должен быть не короче 8 символов");
      return;
    }
    if (password !== password2) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setStatus("Пароль обновлён. Теперь можно войти.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-4 p-6 stage-card-light">
      <h1 className="text-2xl font-semibold">Новый пароль</h1>
      <p className="text-sm text-slate-700">Откройте эту страницу через ссылку из письма, затем задайте новый пароль.</p>
      {status ? <p className="text-sm text-emerald-700">{status}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm text-slate-700" htmlFor="password">
            Новый пароль
          </label>
          <input
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
            className="stage-input-light"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-slate-700" htmlFor="password2">
            Повторите пароль
          </label>
          <input
            id="password2"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
            className="stage-input-light"
          />
        </div>
        <button disabled={loading} type="submit" className="w-full stage-button-primary py-3 disabled:opacity-60">
          {loading ? "Сохраняем..." : "Сохранить пароль"}
        </button>
      </form>
      <Link className="text-sm text-slate-900 underline decoration-slate-400/50 hover:decoration-slate-900" href="/auth/login">
        Перейти ко входу
      </Link>
    </section>
  );
}

