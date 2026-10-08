"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Container, cx } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";
import { interestQuestion, scoredQuestions, TOTAL_STEPS } from "@/lib/diagnostic/questions";
import {
  clearProgress,
  finalize,
  loadProgress,
  loadResult,
  saveProgress,
  type Progress,
} from "@/lib/diagnostic/storage";

type Step = {
  id: string;
  title: string;
  hint?: string;
  options: { label: string; bucket: string; score?: number }[];
};

const STEPS: Step[] = [
  ...scoredQuestions,
  {
    id: interestQuestion.id,
    title: interestQuestion.title,
    hint: "점수에는 들어가지 않아요. 결과를 볼 때 참고합니다.",
    options: interestQuestion.options.map((o) => ({ label: o.label, bucket: o.value })),
  },
];

const ADVANCE_DELAY = 220;

function stepFromUrl() {
  const q = Number(new URLSearchParams(window.location.search).get("q"));
  return Number.isInteger(q) && q >= 1 && q <= TOTAL_STEPS ? q - 1 : 0;
}

function firstUnanswered(answers: Progress["answers"]) {
  const i = STEPS.findIndex((s) => answers[s.id as keyof Progress["answers"]] === undefined);
  return i === -1 ? TOTAL_STEPS - 1 : i;
}

export function Diagnostic() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Progress["answers"]>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [hasPrevResult, setHasPrevResult] = useState(false);
  const startedAt = useRef(0);
  const pushedDepth = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const startTracked = useRef(false);
  const lastViewed = useRef<number | null>(null);
  const advanceTimer = useRef<number | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- 외부 저장소(sessionStorage)를 화면이 보일 때 한 번 읽어 상태를 맞춘다. */
  // 처음 열릴 때(또는 다른 화면에 갔다가 돌아왔을 때): 같은 탭에서 하던 점검이 있으면 이어서 진행한다.
  // Next.js 는 이전 화면의 상태를 보존하므로 여기서 상태를 저장소 기준으로 다시 맞춘다.
  useEffect(() => {
    const saved = loadProgress();
    let initial = 0;
    setFinishing(false);
    setPicked(null);
    setAnswers(saved?.answers ?? {});
    pushedDepth.current = 0;
    lastViewed.current = null;
    startTracked.current = false;
    startedAt.current = Date.now();
    if (saved && saved.answers) {
      startedAt.current = saved.startedAt || Date.now();
      // URL(?q=)과 저장된 진행 상태 중, 답하지 않은 질문을 건너뛰지 않는 쪽을 택한다.
      initial = Math.min(stepFromUrl() || saved.step, firstUnanswered(saved.answers));
    }
    setStep(initial);
    setHasPrevResult(!saved && loadResult() !== null);
    window.history.replaceState(window.history.state, "", `/check?q=${initial + 1}`);
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // 브라우저 뒤로/앞으로 가기
  useEffect(() => {
    const onPop = () => {
      if (window.location.pathname !== "/check") return;
      pushedDepth.current = Math.max(0, pushedDepth.current - 1);
      setPicked(null);
      setStep((current) => {
        const target = stepFromUrl();
        const saved = loadProgress();
        const limit = saved ? firstUnanswered(saved.answers) : 0;
        return Math.min(target, Math.max(limit, current));
      });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(
    () => () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    },
    [],
  );

  // 질문 노출 이벤트 + 포커스 이동
  useEffect(() => {
    if (!ready) return;
    const q = STEPS[step];
    if (!startTracked.current && step === 0 && Object.keys(answers).length === 0) {
      startTracked.current = true;
      track("diagnostic_start", { location: "check" });
    }
    if (lastViewed.current !== step) {
      lastViewed.current = step;
      track("diagnostic_question_view", { question_id: q.id, step: step + 1, total_steps: TOTAL_STEPS });
      headingRef.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [ready, step, answers]);

  const persist = useCallback((nextAnswers: Progress["answers"], nextStep: number) => {
    saveProgress({ answers: nextAnswers, step: nextStep, startedAt: startedAt.current });
  }, []);

  const choose = (index: number) => {
    if (picked !== null || finishing) return;
    const q = STEPS[step];
    const opt = q.options[index];
    const nextAnswers = { ...answers, [q.id]: index };
    setAnswers(nextAnswers);
    setPicked(index);
    track("diagnostic_answer", {
      question_id: q.id,
      answer_bucket: opt.bucket,
      ...(opt.score !== undefined ? { score: opt.score } : {}),
    });

    const isLast = step === TOTAL_STEPS - 1;
    if (isLast) {
      setFinishing(true);
      const result = finalize(nextAnswers);
      if (!result) {
        // 이론상 발생하지 않지만, 빠진 답이 있으면 그 질문으로 돌려보낸다.
        const missing = firstUnanswered(nextAnswers);
        setFinishing(false);
        setPicked(null);
        setStep(missing);
        return;
      }
      clearProgress();
      track("diagnostic_complete", {
        result_type: result.type,
        total_score: result.total,
        interest_area: result.interest,
        priority_tags: result.tags.join(","),
      });
      advanceTimer.current = window.setTimeout(() => router.push("/check/result"), 650);
      return;
    }

    persist(nextAnswers, step + 1);
    advanceTimer.current = window.setTimeout(() => {
      window.history.pushState(window.history.state, "", `/check?q=${step + 2}`);
      pushedDepth.current += 1;
      setPicked(null);
      setStep(step + 1);
    }, ADVANCE_DELAY);
  };

  const goBack = () => {
    if (step === 0 || finishing) return;
    if (pushedDepth.current > 0) {
      window.history.back();
      return;
    }
    // 새로고침 후 이어하기처럼 브라우저 기록이 없으면 직접 이전 질문으로 이동한다.
    window.history.replaceState(window.history.state, "", `/check?q=${step}`);
    setPicked(null);
    setStep(step - 1);
    persist(answers, step - 1);
  };

  const q = STEPS[step];
  const previous = answers[q.id as keyof Progress["answers"]];
  const progress = finishing ? 100 : (step / TOTAL_STEPS) * 100;

  return (
    <div className="flex min-h-dvh flex-col bg-ivory pb-16 pt-16 sm:pt-20">
      <Container className="max-w-[40rem] flex-1">
        <div className="flex items-center justify-between pt-4">
          {step > 0 && !finishing ? (
            <button
              type="button"
              onClick={goBack}
              className="-ml-3 flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-base font-medium text-navy/80 hover:text-navy"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none">
                <path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              이전 질문
            </button>
          ) : (
            <Link href="/" className="-ml-3 flex min-h-11 items-center rounded-lg px-3 text-base font-medium text-navy/80 hover:text-navy">
              처음으로
            </Link>
          )}
          <p className="text-base font-semibold tabular-nums text-navy" aria-live="polite">
            <span className="sr-only">질문 </span>
            {Math.min(step + 1, TOTAL_STEPS)} <span className="text-muted">/ {TOTAL_STEPS}</span>
          </p>
        </div>

        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-navy/10"
          role="progressbar"
          aria-label="점검 진행률"
          aria-valuemin={0}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={finishing ? TOTAL_STEPS : step}
        >
          <div className="h-full rounded-full bg-green transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <div className={cx("pt-10 sm:pt-14", !ready && "invisible")}>
          {finishing ? (
            <div className="animate-rise py-16 text-center" role="status">
              <p className="text-[1.5rem] font-bold text-navy">결과를 정리하고 있어요</p>
              <p className="mt-3 text-muted">답해주신 내용으로 먼저 볼 영역을 추리는 중입니다.</p>
            </div>
          ) : (
            <div key={step} className="animate-rise">
              {step === 0 && hasPrevResult && (
                <Link href="/check/result" className="mb-6 inline-flex min-h-11 items-center text-base font-medium text-green underline underline-offset-4">
                  지난번 점검 결과 다시 보기
                </Link>
              )}
              <p className="text-base font-bold tracking-[0.04em] text-green">Q{step + 1}.</p>
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="pre-line mt-3 text-[1.5rem] font-bold leading-[1.45] text-navy outline-none sm:text-[1.875rem]"
              >
                {q.title}
              </h1>
              {q.hint && <p className="mt-3 text-base text-muted">{q.hint}</p>}

              <ul className="mt-8 space-y-3">
                {q.options.map((o, i) => {
                  const active = picked === i || (picked === null && previous === i);
                  return (
                    <li key={o.label}>
                      <button
                        type="button"
                        onClick={() => choose(i)}
                        aria-pressed={active}
                        className={cx(
                          "flex min-h-[3.75rem] w-full items-center justify-between gap-4 rounded-[10px] border px-5 py-3.5 text-left text-[1.0625rem] font-medium transition-colors duration-150 sm:text-[1.125rem]",
                          active
                            ? "border-green bg-green text-white"
                            : "border-navy/15 bg-white text-ink hover:border-navy/40",
                        )}
                      >
                        <span>{o.label}</span>
                        <span
                          aria-hidden="true"
                          className={cx(
                            "grid size-6 shrink-0 place-items-center rounded-full border",
                            active ? "border-white bg-white text-green" : "border-navy/20",
                          )}
                        >
                          {active && (
                            <svg viewBox="0 0 12 12" className="size-3.5" fill="none">
                              <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </Container>

      <Container className="mt-12 max-w-[40rem]">
        <p className="text-base leading-relaxed text-muted">
          이름이나 연락처는 묻지 않습니다. 답변은 이 브라우저 탭에만 잠시 저장되고 서버로 보내지 않습니다.
        </p>
      </Container>
    </div>
  );
}
