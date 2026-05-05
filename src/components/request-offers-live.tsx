"use client";

import { useRouter } from "next/navigation";
import { RealtimeOffers } from "@/components/realtime-offers";

export function RequestOffersLive({ requestId }: { requestId: number }) {
  const router = useRouter();
  return <RealtimeOffers requestId={requestId} onEvent={() => router.refresh()} />;
}
