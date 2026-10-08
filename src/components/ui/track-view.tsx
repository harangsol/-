"use client";

import { useEffect, useRef } from "react";
import { track, type AnalyticsEvent, type EventParams } from "@/lib/analytics";

/**
 * 이 표시 지점이 화면에 들어오면 한 번만 이벤트를 보낸다 (섹션 노출 측정용).
 * 화면에는 아무것도 그리지 않는다. 개인정보는 다루지 않는다.
 */
export function TrackView({ event, params }: { event: AnalyticsEvent; params?: EventParams }) {
  const ref = useRef<HTMLSpanElement>(null);
  const sent = useRef(false);
  const paramsRef = useRef(params);

  useEffect(() => {
    const el = ref.current;
    if (!el || sent.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !sent.current) {
        sent.current = true;
        track(event, paramsRef.current);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [event]);

  return <span ref={ref} aria-hidden="true" className="block h-px w-full" />;
}
