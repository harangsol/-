"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { analyticsConfig, track } from "@/lib/analytics";
import { captureAttribution } from "@/lib/diagnostic/storage";

/**
 * GA4 / Meta Pixel 로더 + page_view, scroll_50, scroll_90.
 * ID 가 비어 있으면 외부 스크립트를 전혀 불러오지 않는다.
 */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    captureAttribution();
  }, []);

  useEffect(() => {
    track("page_view", { page_path: pathname, page_title: document.title.slice(0, 80) });

    const fired = new Set<number>();
    let ticking = false;
    const check = () => {
      ticking = false;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable < 200) return;
      const pct = (window.scrollY / scrollable) * 100;
      for (const mark of [50, 90] as const) {
        if (pct >= mark && !fired.has(mark)) {
          fired.add(mark);
          track(mark === 50 ? "scroll_50" : "scroll_90", { page_path: pathname });
        }
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(check);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return (
    <>
      {analyticsConfig.gaId && (
        <Script
          id="ga4"
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.gaId}`}
        />
      )}
      {analyticsConfig.pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive" src="https://connect.facebook.net/en_US/fbevents.js" />
      )}
    </>
  );
}
