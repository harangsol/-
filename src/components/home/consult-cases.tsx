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

  const rows = [
    { k: "유지할 것", v: c.direction.keep, strong: true },
    { k: "확인할 것", v: c.direction.check },
    { k: "다음에 준비할 것", v: c.direction.next },
  ];

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
          <p className="text-base text-muted">{c.who}</p>
          {c.sample && (
            <span className="shrink-0 rounded-full bg-paper px-3 py-0.5 text-base font-semibold text-muted">예시</span>
          )}
        </div>

        <div className="mt-6">
          <p className="text-base font-bold text-green">처음 질문</p>
          <p className="mt-2 text-[1.375rem] font-bold leading-[1.45] tracking-[-0.03em] text-navy sm:text-[1.625rem]">
            ‘{c.question}’
          </p>
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <p className="text-base font-bold text-green">먼저 본 것</p>
          <p className="mt-2 text-ink/90">{c.looked}</p>
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <p className="text-base font-bold text-green">정리한 방향</p>
          <dl className="mt-3 overflow-hidden rounded-[8px] border border-line">
            {rows.map((r, i) => (
              <div key={r.k} className={cx("grid gap-1 px-4 py-3.5 sm:grid-cols-[9rem_1fr] sm:gap-4", i > 0 && "border-t border-dashed border-line")}>
                <dt className={cx("font-semibold", r.strong ? "text-green" : "text-navy")}>{r.k}</dt>
                <dd className="text-ink/90">{r.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {consultCases.some((x) => x.sample) && (
        <p className="mt-4 text-base text-muted">이해를 돕기 위해 구성한 예시입니다. 실제 상담 내용과 방향은 사람마다 다릅니다.</p>
      )}
    </div>
  );
}
