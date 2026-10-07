"use client";

import { usePathname } from "next/navigation";
import { TrackedLink } from "@/components/ui/tracked-link";

/** 헤더의 '1분 점검' 버튼. 점검·결과·문의 화면에서는 각 화면의 CTA 와 겹치므로 숨긴다. */
export function HeaderCta() {
  const pathname = usePathname();
  if (pathname.startsWith("/check") || pathname.startsWith("/contact")) return null;
  return (
    <TrackedLink
      href="/check"
      event="hero_cta_click"
      params={{ location: "header" }}
      className="ml-1 flex min-h-11 items-center rounded-full border border-navy/20 px-4 text-navy transition-colors hover:border-navy hover:bg-white/70"
    >
      1분 점검
    </TrackedLink>
  );
}
