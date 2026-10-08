"use client";

import { useEffect, useRef, useState } from "react";
import { share, siteUrl } from "@/config/site";
import { track } from "@/lib/analytics";
import { buttonClass, cx, type ButtonVariant } from "./primitives";

/**
 * '지인에게 이 페이지 보내기'.
 * 1) Web Share API 지원 기기(대부분의 모바일): 카카오톡·문자 등 공유 시트를 연다.
 * 2) 지원하지 않거나 실패하면: 공유 문구 + 링크를 클립보드에 복사한다.
 * 공유 링크에는 '지인 소개' 유입 구분값(UTM)만 붙는다. 개인정보는 들어가지 않는다.
 */
export function ShareButton({
  location,
  variant = "primary",
  className,
  label = "지인에게 이 페이지 보내기",
}: {
  location: string;
  variant?: ButtonVariant;
  className?: string;
  label?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const url = `${siteUrl}/?${share.utm}`;

  const flash = (s: "copied" | "failed") => {
    setStatus(s);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), 3500);
  };

  const copy = async () => {
    const text = `${share.text}\n${url}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 오래된 브라우저·권한 거부 시 대체 방식
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      if (!ok) {
        flash("failed");
        return;
      }
    }
    track("referral_url_copy", { location });
    flash("copied");
  };

  const onClick = async () => {
    const data = { title: share.title, text: share.text, url };
    const canShare = typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(data));
    track("referral_share_click", { location, method: canShare ? "share_sheet" : "copy" });
    if (canShare) {
      try {
        await navigator.share(data);
        return;
      } catch (err) {
        // 사용자가 공유 창을 닫은 경우는 그대로 둔다.
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    await copy();
  };

  return (
    <div>
      <button type="button" onClick={onClick} className={buttonClass(variant, className)}>
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-[1.1em]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 3v10M6 7l4-4 4 4M4 12v3.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V12" />
        </svg>
        {label}
      </button>
      <p
        role="status"
        aria-live="polite"
        className={cx("mt-3 min-h-[1.75rem] text-base", status === "failed" ? "text-[#a63b28]" : "text-inherit opacity-80")}
      >
        {status === "copied" && "링크를 복사했어요. 카카오톡이나 문자에 붙여넣어 보내주세요."}
        {status === "failed" && `복사가 안 됐어요. 이 주소를 보내주세요: ${url}`}
      </p>
    </div>
  );
}
