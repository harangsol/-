"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Arrow, cx } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";

export const OPEN_CONTACT_EVENT = "hj:open-contact";

/**
 * 모바일 하단 고정 CTA.
 * - 홈: HERO CTA 가 화면을 벗어난 뒤에만 '1분 금융점검'을 보여주고, 마지막 CTA 섹션이 보이면 숨긴다.
 * - 점검 중(/check), 상담(/contact), 약관 페이지: 숨김.
 * - 결과(/check/result): '황진에게 한번 물어보기' — 상담 방법 선택창을 연다.
 */
export function StickyCta() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isResult = pathname === "/check/result";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isHome && !isResult) return;

    const hero = document.getElementById("hero-cta");
    const finale = document.getElementById("final-cta");
    let heroOut = !hero;
    let finaleIn = false;
    const update = () => setVisible(heroOut && !finaleIn);

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) heroOut = !e.isIntersecting && e.boundingClientRect.top < 0;
        if (e.target === finale) finaleIn = e.isIntersecting;
      }
      update();
    });
    if (hero) io.observe(hero);
    if (finale) io.observe(finale);
    update();
    return () => io.disconnect();
  }, [isHome, isResult, pathname]);

  if (!isHome && !isResult) return null;

  const shell = cx(
    "fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 transition-[transform,opacity] duration-300 sm:hidden",
    "bg-gradient-to-t from-ivory via-ivory/95 to-ivory/0",
    visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
  );
  const button =
    "flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-[10px] bg-navy text-[1.0625rem] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(23,36,58,0.6)]";

  if (isResult) {
    return (
      <div className={shell} aria-hidden={!visible}>
        <button
          type="button"
          tabIndex={visible ? 0 : -1}
          className={button}
          onClick={() => {
            track("result_cta_click", { location: "sticky" });
            window.dispatchEvent(new CustomEvent(OPEN_CONTACT_EVENT));
          }}
        >
          황진에게 한번 물어보기
          <Arrow />
        </button>
      </div>
    );
  }

  return (
    <div className={shell} aria-hidden={!visible}>
      <Link
        href="/check"
        tabIndex={visible ? 0 : -1}
        className={button}
        onClick={() => track("hero_cta_click", { location: "sticky" })}
      >
        1분 금융점검
        <Arrow />
      </Link>
    </div>
  );
}
