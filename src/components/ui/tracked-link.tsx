"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { track, type AnalyticsEvent, type EventParams } from "@/lib/analytics";

/** 클릭 시 분석 이벤트를 보내는 링크. 서버 컴포넌트 안에서 CTA 로 쓴다. */
export function TrackedLink({
  event,
  params,
  onClick,
  ...props
}: ComponentProps<typeof Link> & { event: AnalyticsEvent; params?: EventParams }) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        track(event, params);
        onClick?.(e);
      }}
    />
  );
}
