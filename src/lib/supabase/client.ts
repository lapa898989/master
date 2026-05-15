"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonOrPublishable =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

  if (!supabaseUrl || !anonOrPublishable) {
    // eslint-disable-next-line no-console
    console.error(
      "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or key. Check your .env.local (see .env.local.example)."
    );
  }

  return createBrowserClient(supabaseUrl, anonOrPublishable);
}
