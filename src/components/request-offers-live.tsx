"use client";

import { RealtimeOffers } from "@/components/realtime-offers";
import { useDebouncedRouterRefresh } from "@/hooks/use-debounced-router-refresh";

export function RequestOffersLive({ requestId }: { requestId: number }) {
  const scheduleRefresh = useDebouncedRouterRefresh(320);
  return <RealtimeOffers requestId={requestId} onEvent={scheduleRefresh} />;
}
