"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/modal";
import { Button, cx } from "@/components/ui/primitives";
import { contact } from "@/config/site";
import { track } from "@/lib/analytics";
import {
  AGE_OPTIONS,
  CONCERN_MAX,
  formatPhone,
  INTEREST_OPTIONS,
  TIME_OPTIONS,
  validate,
  type ConsultationInput,
  type FieldErrors,
} from "@/lib/consultation/validate";
import { interestLabels, priorityLabels, resultCopy } from "@/lib/diagnostic/questions";
import { loadAttribution } from "@/lib/diagnostic/storage";
import { useStoredResult } from "@/lib/diagnostic/use-stored-result";
import { MarketingConsentSummary, PrivacyConsentSummary } from "./privacy-summary";

type Status = "idle" | "submitting" | "success" | "error";

const EMPTY: ConsultationInput = {
  name: "",
  phone: "",
  interest: "",
  ageRange: "",
  contactTime: "",
  concern: "",
  privacyConsent: false,
  marketingConsent: false,
  website: "",
};

export function ConsultationForm() {
  const [values, setValues] = useState<ConsultationInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState("");
  const result = useStoredResult() ?? null;
  const [attachResult, setAttachResult] = useState(true);
  const [sheet, setSheet] = useState<"privacy" | "marketing" | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const viewed = useRef(false);
  const uid = useId();

  // 폼이 실제로 화면에 보였을 때 한 번만 consultation_form_view
  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !viewed.current) {
          viewed.current = true;
          track("consultation_form_view", { location: "contact_page", ...(result ? { result_type: result.type } : {}) });
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [result]);

  const set = <K extends keyof ConsultationInput>(key: K, value: ConsultationInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key as keyof FieldErrors]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // 점검에서 고른 관심 영역을 기본값으로 쓰되, 사용자가 바꾸면 그 값을 따른다.
  const interest = values.interest || result?.interest || "";
  const current: ConsultationInput = { ...values, interest };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    const found = validate(current);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0];
      document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }

    setStatus("submitting");
    setServerMessage("");
    const payload: ConsultationInput = {
      ...current,
      result: result && attachResult ? { type: result.type, interest: result.interest, tags: result.tags } : null,
      attribution: loadAttribution(),
    };

    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: FieldErrors };
      if (res.ok && data.ok) {
        setStatus("success");
        // 개인정보는 보내지 않는다. 관심 영역과 결과 유형만.
        track("consultation_submit", {
          interest_area: interest,
          ...(payload.result ? { result_type: payload.result.type } : {}),
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setStatus("error");
      if (data.error === "validation" && data.fields) {
        setErrors(data.fields);
        setServerMessage("입력하신 내용을 한 번만 확인해주세요.");
      } else if (res.status === 429) {
        setServerMessage("짧은 시간에 여러 번 신청되었어요. 잠시 후 다시 시도해주세요.");
      } else if (data.error === "not_configured") {
        setServerMessage("지금은 온라인 신청을 받을 수 없어요. 아래 카카오톡이나 전화로 편하게 연락 주세요.");
      } else {
        setServerMessage("신청이 전송되지 않았어요. 잠시 후 다시 시도하시거나 카카오톡·전화로 연락 주세요.");
      }
    } catch {
      setStatus("error");
      setServerMessage("인터넷 연결을 확인한 뒤 다시 시도해주세요.");
    }
  };

  if (status === "success") {
    return (
      <div className="animate-rise rounded-[10px] border border-line bg-white px-6 py-10 text-center sm:px-10" role="status">
        <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-full bg-green-soft text-green">
          <svg viewBox="0 0 24 24" className="size-7" fill="none">
            <path d="M5 12.5 10 17.5 19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="mt-5 text-[1.5rem] font-bold text-navy">잘 전달되었습니다.</h2>
        <p className="mt-3 text-muted">
          {contact.responseNote}
          <br />
          부담 갖지 마시고, 궁금한 것만 편하게 물어보세요.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          {result && (
            <Link href="/check/result" className="flex min-h-11 items-center justify-center px-3 font-medium text-green underline underline-offset-4">
              내 점검 결과 다시 보기
            </Link>
          )}
          <Link href="/" className="flex min-h-11 items-center justify-center px-3 font-medium text-navy underline underline-offset-4">
            처음으로
          </Link>
        </div>
      </div>
    );
  }

  const fid = (k: string) => `${uid}-${k}`;

  return (
    <>
      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-7" aria-describedby={fid("required-note")}>
        <p id={fid("required-note")} className="text-base text-muted">
          <span className="font-semibold text-green">*</span> 표시는 꼭 필요한 항목입니다.
        </p>

        <Field id={fid("name")} label="이름" required error={errors.name}>
          <input
            id={fid("name")}
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={20}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? fid("name-error") : undefined}
            className={inputClass(!!errors.name)}
            placeholder="홍길동"
          />
        </Field>

        <Field id={fid("phone")} label="연락처" required error={errors.phone}>
          <input
            id={fid("phone")}
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={values.phone}
            onChange={(e) => set("phone", formatPhone(e.target.value))}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? fid("phone-error") : undefined}
            className={inputClass(!!errors.phone)}
            placeholder="010-1234-5678"
          />
        </Field>

        <fieldset aria-describedby={errors.interest ? fid("interest-error") : undefined}>
          <legend className="mb-3 text-[1.0625rem] font-semibold text-navy">
            가장 궁금한 영역 <span className="text-green" aria-hidden="true">*</span>
            <span className="sr-only">(필수)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((o, i) => {
              const checked = interest === o.value;
              return (
                <label
                  key={o.value}
                  className={cx(
                    "relative flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-base font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-green",
                    checked ? "border-navy bg-navy text-white" : "border-navy/20 bg-white text-ink hover:border-navy/50",
                  )}
                >
                  <input
                    id={i === 0 ? fid("interest") : undefined}
                    type="radio"
                    name="interest"
                    value={o.value}
                    checked={checked}
                    onChange={() => set("interest", o.value)}
                    className="sr-only"
                  />
                  {o.label}
                </label>
              );
            })}
          </div>
          {errors.interest && <ErrorText id={fid("interest-error")}>{errors.interest}</ErrorText>}
        </fieldset>

        <div className="grid gap-7 sm:grid-cols-2 sm:gap-5">
          <Field id={fid("age")} label="연령대" optional>
            <div className="relative">
              <select
                id={fid("age")}
                name="ageRange"
                value={values.ageRange}
                onChange={(e) => set("ageRange", e.target.value)}
                className={inputClass(false, "appearance-none pr-10")}
              >
                <option value="">선택 안 함</option>
                {AGE_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <Chevron />
            </div>
          </Field>
          <Field id={fid("time")} label="편한 연락 시간" optional>
            <div className="relative">
              <select
                id={fid("time")}
                name="contactTime"
                value={values.contactTime}
                onChange={(e) => set("contactTime", e.target.value)}
                className={inputClass(false, "appearance-none pr-10")}
              >
                <option value="">선택 안 함</option>
                {TIME_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <Chevron />
            </div>
          </Field>
        </div>

        <Field id={fid("concern")} label="간단한 고민" optional error={errors.concern}>
          <textarea
            id={fid("concern")}
            name="concern"
            rows={4}
            maxLength={CONCERN_MAX}
            value={values.concern}
            onChange={(e) => set("concern", e.target.value)}
            aria-describedby={fid("concern-help")}
            className={inputClass(!!errors.concern, "min-h-32 py-3 leading-relaxed")}
            placeholder="예) 아이가 생기면서 보험을 한번 정리하고 싶어요."
          />
          <div id={fid("concern-help")} className="mt-2 flex justify-between gap-4 text-base text-muted">
            <span>계좌번호·주민번호 같은 정보는 적지 말아주세요.</span>
            <span className="shrink-0 tabular-nums">
              {values.concern.length}/{CONCERN_MAX}
            </span>
          </div>
        </Field>

        {result && (
          <div className="rounded-[10px] border border-line bg-paper px-5 py-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={attachResult}
                onChange={(e) => setAttachResult(e.target.checked)}
                className="mt-1 size-5 shrink-0 accent-green"
              />
              <span>
                <span className="block font-semibold text-navy">1분 점검 결과 함께 보내기</span>
                <span className="mt-1 block text-base text-muted">
                  {resultCopy[result.type].title.replace("\n", " ")} · 관심: {interestLabels[result.interest]}
                  {result.tags.length > 0 && ` · 먼저 볼 영역: ${result.tags.map((t) => priorityLabels[t].split(" / ")[0]).join(", ")}`}
                </span>
              </span>
            </label>
          </div>
        )}

        {/* 스팸 방지용 숨김 필드 */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            웹사이트
            <input tabIndex={-1} autoComplete="off" name="website" value={values.website} onChange={(e) => set("website", e.target.value)} />
          </label>
        </div>

        <div className="space-y-3 border-t border-line pt-6">
          <Consent
            id={fid("privacyConsent")}
            checked={values.privacyConsent}
            onChange={(c) => set("privacyConsent", c)}
            tag="필수"
            label="개인정보 수집 및 이용 동의"
            onView={() => setSheet("privacy")}
            error={errors.privacyConsent}
            errorId={fid("privacyConsent-error")}
          />
          <Consent
            id={fid("marketingConsent")}
            checked={values.marketingConsent}
            onChange={(c) => set("marketingConsent", c)}
            tag="선택"
            label="마케팅 정보 수신 동의"
            onView={() => setSheet("marketing")}
          />
        </div>

        {serverMessage && (
          <p role="alert" className="rounded-[8px] border border-[#c9533f]/30 bg-[#fbefec] px-4 py-3 text-base text-[#8a2f20]">
            {serverMessage}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={status === "submitting"}>
          {status === "submitting" ? "보내는 중…" : "뭐부터 볼지 물어보기"}
        </Button>
        <p className="text-center text-base text-muted">이야기해보고 원하지 않으시면 언제든 그만하셔도 됩니다.</p>
      </form>

      <Modal open={sheet === "privacy"} onClose={() => setSheet(null)} title="개인정보 수집 및 이용 동의 (필수)" labelId={fid("privacy-sheet")}>
        <PrivacyConsentSummary />
      </Modal>
      <Modal open={sheet === "marketing"} onClose={() => setSheet(null)} title="마케팅 정보 수신 동의 (선택)" labelId={fid("marketing-sheet")}>
        <MarketingConsentSummary />
      </Modal>
    </>
  );
}

function Chevron() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-navy" fill="none">
      <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function inputClass(invalid: boolean, extra?: string) {
  return cx(
    "block min-h-[3.25rem] w-full rounded-[10px] border bg-white px-4 text-[1.0625rem] text-ink placeholder:text-[#8b8f8d] transition-colors focus:border-navy focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-green",
    invalid ? "border-[#c9533f]" : "border-navy/20",
    extra,
  );
}

function Field({
  id,
  label,
  required,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-baseline gap-1.5 text-[1.0625rem] font-semibold text-navy">
        {label}
        {required && (
          <>
            <span className="text-green" aria-hidden="true">
              *
            </span>
            <span className="sr-only">(필수)</span>
          </>
        )}
        {optional && <span className="text-base font-normal text-muted">(선택)</span>}
      </label>
      {children}
      {error && <ErrorText id={`${id}-error`}>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-2 text-base font-medium text-[#a63b28]">
      {children}
    </p>
  );
}

function Consent({
  id,
  checked,
  onChange,
  tag,
  label,
  onView,
  error,
  errorId,
}: {
  id: string;
  checked: boolean;
  onChange: (c: boolean) => void;
  tag: "필수" | "선택";
  label: string;
  onView: () => void;
  error?: string;
  errorId?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className="size-5 shrink-0 accent-green"
          />
          <span className="text-base text-ink">
            <span className={cx("mr-1.5 font-semibold", tag === "필수" ? "text-green" : "text-muted")}>[{tag}]</span>
            {label}
          </span>
        </label>
        <button type="button" onClick={onView} className="flex min-h-11 shrink-0 items-center px-2 text-base text-muted underline underline-offset-4 hover:text-navy">
          내용 보기
        </button>
      </div>
      {error && errorId && <ErrorText id={errorId}>{error}</ErrorText>}
    </div>
  );
}
