"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function ClientRequestsRealtime({ clientId }: { clientId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`client-requests-${clientId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests", filter: `client_id=eq.${clientId}` },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, router]);

  return null;
}
