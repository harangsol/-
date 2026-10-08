"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "./primitives";

/**
 * 네이티브 <dialog> 기반 모달. 포커스 가두기·ESC 닫기·배경 클릭 닫기를 브라우저 기본 동작으로 처리한다.
 * 모바일에서는 하단 시트처럼, 데스크톱에서는 가운데 창으로 보인다.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  labelId,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  labelId: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = "hidden";
    }
    if (!open && d.open) d.close();
    return () => {
      // 다른 화면으로 이동할 때 열린 모달이 남아 새 화면을 막지 않게 닫는다.
      if (d.open) d.close();
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelId}
      onClose={() => {
        document.documentElement.style.overflow = "";
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cx(
        "m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-[16px] bg-ivory p-0 text-ink",
        "sm:m-auto sm:max-h-[85vh] sm:max-w-[34rem] sm:rounded-[12px]",
        "open:animate-rise",
      )}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-ivory px-5 py-3 sm:px-7">
        <h2 id={labelId} className="text-[1.1875rem] font-bold text-navy">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="-mr-2 grid size-11 place-items-center rounded-full text-navy hover:bg-navy/5"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none">
            <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 sm:px-7 sm:pb-7">{children}</div>
    </dialog>
  );
}
