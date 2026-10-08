"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { cx } from "@/components/ui/primitives";
import { consultCases } from "@/config/cases";

/** 상담 사례 탭. 문구는 src/config/cases.ts 에서 관리한다. */
export function ConsultCases() {
  const [active, setActive] = useState(0);
  const uid = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const c = consultCases[active];
  if (!c) return null;

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const n = consultCases.length;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (active + 1) % n;
    if (e.key === "ArrowLeft") next = (active - 1 + n) % n;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = n - 1;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="mt-10 sm:mt-14">
      <div role="tablist" aria-label="상담 예시" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
        {consultCases.map((x, i) => (
          <button
            key={x.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            id={`${uid}-tab-${x.id}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`${uid}-panel`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={onKey}
            className={cx(
              "flex min-h-11 shrink-0 items-center rounded-full border px-4 text-base font-semibold transition-colors",
              i === active ? "border-navy bg-navy text-white" : "border-navy/20 bg-white text-navy hover:border-navy/50",
            )}
          >
            {x.tab}
          </button>
        ))}
      </div>

      <div
        id={`${uid}-panel`}
        role="tabpanel"
        aria-labelledby={`${uid}-tab-${c.id}`}
        tabIndex={0}
        key={c.id}
        className="animate-rise mt-6 rounded-[8px] border border-line bg-white px-6 py-7 sm:px-10 sm:py-10"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-bold text-green">처음 질문</p>
          {c.sample && (
            <span className="shrink-0 rounded-full bg-paper px-3 py-0.5 text-base font-semibold text-muted">예시</span>
          )}
        </div>
        <p className="mt-2 text-[1.375rem] font-bold leading-[1.45] tracking-[-0.03em] text-navy sm:text-[1.625rem]">
          “{c.question}”
        </p>

        <div className="mt-7 border-t border-line pt-6">
          <p className="text-base font-bold text-green">먼저 본 것</p>
          <ul className="mt-3 space-y-2">
            {c.looked.map((l) => (
              <li key={l} className="flex gap-3 text-ink/90">
                <span aria-hidden="true" className="mt-[0.75em] h-px w-3 shrink-0 bg-navy/40" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-7 border-t border-line pt-6">
          <p className="text-base font-bold text-green">정리한 방향</p>
          <p className="mt-2 font-semibold text-navy">{c.direction}</p>
          {c.steps && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="정리 단계">
              {c.steps.map((st, i) => (
                <li
                  key={st}
                  className={cx(
                    "rounded-full px-3 py-1 text-base font-semibold",
                    i === 0 ? "bg-green text-white" : "bg-green-soft text-green-deep",
                  )}
                >
                  {st}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {consultCases.some((x) => x.sample) && (
        <p className="mt-4 text-base text-muted">사례는 상담 방식을 이해하기 위한 예시이며, 실제 방향은 개인별 상황에 따라 달라집니다.</p>
      )}
    </div>
  );
}
