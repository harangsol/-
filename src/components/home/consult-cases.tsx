"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
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
        className="animate-rise mt-6 rounded-[8px] border border-line bg-white px-5 py-6 sm:px-9 sm:py-9"
      >
        {c.sample && (
          <span className="float-right rounded-full bg-paper px-3 py-0.5 text-base font-semibold text-muted">예시</span>
        )}
        <ol className="relative">
          <FlowStep no={1} label="처음 질문">
            <p className="text-[1.25rem] font-bold leading-[1.45] tracking-[-0.03em] text-navy sm:text-[1.5rem]">“{c.question}”</p>
          </FlowStep>
          <FlowStep no={2} label="먼저 본 것">
            {c.lookedLead && <p className="mb-2.5">{c.lookedLead}</p>}
            <ul className="flex flex-wrap gap-2" aria-label="먼저 본 것">
              {c.looked.map((l) => (
                <li key={l} className="rounded-full border border-navy/20 bg-ivory px-3 py-1 text-base font-medium text-navy">
                  {l}
                </li>
              ))}
            </ul>
          </FlowStep>
          <FlowStep no={3} label="정리" last>
            <ul className="flex flex-wrap gap-2" aria-label="정리한 방향">
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
            <p className="mt-2.5 text-muted">{c.direction}</p>
          </FlowStep>
        </ol>
      </div>

      {consultCases.some((x) => x.sample) && (
        <p className="mt-4 text-base text-muted">사례는 상담 방식을 이해하기 위한 예시이며, 실제 방향은 개인별 상황에 따라 달라집니다.</p>
      )}
    </div>
  );
}

/** 처음 질문 → 먼저 본 것 → 정리 흐름의 한 단계. 왼쪽 세로선과 아래 화살표로 순서를 보여준다. */
function FlowStep({ no, label, last, children }: { no: number; label: string; last?: boolean; children: ReactNode }) {
  return (
    <li className={cx("relative pl-11", !last && "pb-7")}>
      <span
        aria-hidden="true"
        className={cx(
          "absolute left-0 top-0 grid size-8 place-items-center rounded-full text-base font-bold",
          last ? "bg-green text-white" : "bg-navy text-white",
        )}
      >
        {no}
      </span>
      {!last && (
        <span aria-hidden="true" className="absolute bottom-1 left-[15px] top-9 w-[2px] bg-navy/15">
          <svg viewBox="0 0 10 8" className="absolute -bottom-1 -left-[4px] w-[10px] text-navy/30" fill="currentColor">
            <path d="M0 0h10L5 8z" />
          </svg>
        </span>
      )}
      <p className="pt-0.5 text-base font-bold text-muted">{label}</p>
      <div className="mt-2">{children}</div>
    </li>
  );
}
