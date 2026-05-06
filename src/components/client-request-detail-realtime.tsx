"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/** Отклики, смена статуса заявки, появление assignment → router.refresh() без F5. */
export function ClientRequestDetailRealtime({ requestId }: { requestId: number }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const filterReq = `request_id=eq.${requestId}`;
    const filterId = `id=eq.${requestId}`;

    const channel = supabase
      .channel(`client-req-${requestId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "offers", filter: filterReq }, () => {
        router.refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments", filter: filterReq }, () => {
        router.refresh();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "requests", filter: filterId }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, router]);

  return null;
}
