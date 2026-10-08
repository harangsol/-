import Image from "next/image";
import type { ReactNode } from "react";
import { photos, profile, showPhotoSlots } from "@/config/site";
import { cx } from "@/components/ui/primitives";

type PhotoKey = keyof typeof photos;
const PHOTO_NO: Record<PhotoKey, string> = { hero: "PHOTO 01", about: "PHOTO 02", life: "PHOTO 03" };

/**
 * 황진 실제 사진 한 장. src(config/site.ts → photos)가 있으면 Next/Image 로 최적화해 보여준다.
 * 비어 있으면 개발 화면에서만 '사진 자리'를 표시하고, 배포 화면에서는 fallback(없으면 아무것도)을 그린다.
 */
export function PhotoFrame({
  slot,
  className,
  sizes,
  eager,
  fallback = null,
}: {
  slot: PhotoKey;
  className: string;
  sizes: string;
  eager?: boolean;
  fallback?: ReactNode;
}) {
  const p: { src: string; alt: string; focus: string; guide: string; zoom?: number } = photos[slot];
  if (p.src) {
    return (
      <div className={cx("relative overflow-hidden rounded-[6px] bg-paper", className)}>
        <Image
          src={p.src}
          alt={p.alt}
          fill
          sizes={sizes}
          quality={80}
          // HERO 사진은 첫 화면에 보이므로 미리 불러온다(preload). 나머지는 화면 근처에서 불러온다.
          preload={eager}
          loading={eager ? undefined : "lazy"}
          className="object-cover"
          // zoom: 넓은 사진에서 얼굴이 작아질 때 초점 위치를 기준으로 살짝 확대한다
          style={{ objectPosition: p.focus, transform: p.zoom ? `scale(${p.zoom})` : undefined, transformOrigin: p.focus }}
        />
      </div>
    );
  }
  if (!showPhotoSlots) return <>{fallback}</>;
  return (
    <div
      role="img"
      aria-label={`${PHOTO_NO[slot]} 사진 자리`}
      className={cx(
        "flex flex-col items-center justify-center gap-2 rounded-[6px] border-2 border-dashed border-navy/20 bg-paper/70 px-6 text-center",
        className,
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7 text-navy/35" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="12" cy="12" r="3.2" />
        <path d="M8 5l1.2-2h5.6L16 5" />
      </svg>
      <span className="text-base font-bold text-muted">{PHOTO_NO[slot]} · 황진 실제 사진</span>
      <span className="text-base text-muted">{p.guide}</span>
    </div>
  );
}

/**
 * HERO 비주얼 — 문구가 주인공, 사진은 30~35% 비중으로 보조.
 * 사진이 없는 배포 화면에서는 '지금 · 다음 · 나중' 메모 카드(데스크톱만)를 대신 보여준다.
 */
export function HeroVisual() {
  return (
    <PhotoFrame
      slot="hero"
      eager
      sizes="(min-width: 1024px) 400px, 92vw"
      className="mx-auto aspect-[16/10] w-full max-w-[420px] lg:aspect-[4/5] lg:max-w-[400px]"
      fallback={
        <div className="mx-auto hidden w-full max-w-[440px] lg:block">
          <OrderNote />
          <p className="mt-5 text-base text-muted">상담에서는 이렇게 ‘지금 · 다음 · 나중’ 순서부터 함께 정리합니다.</p>
        </div>
      }
    />
  );
}

function OrderNote() {
  const rows = [
    { when: "지금", what: "비상자금 3개월치부터", done: true },
    { when: "다음", what: "대출 금리·만기 확인", done: false },
    { when: "나중", what: "겹치는 보장 정리", done: false },
  ];
  return (
    <figure className="rounded-[6px] border border-line bg-white px-7 pb-7 pt-6 shadow-[0_24px_48px_-28px_rgba(24,38,61,0.45)] lg:px-9">
      <figcaption className="flex items-baseline justify-between border-b border-line pb-3">
        <span className="text-[1.0625rem] font-semibold text-navy">내 돈, 순서 정리</span>
        <span className="text-base text-muted">예시</span>
      </figcaption>
      <ol className="mt-1">
        {rows.map((r) => (
          <li key={r.when} className="flex items-center gap-4 border-b border-dashed border-line py-4 last:border-0">
            <span className={cx("w-11 shrink-0 font-bold", r.done ? "text-green" : "text-muted")}>{r.when}</span>
            <span className="flex-1 leading-snug text-ink">{r.what}</span>
            <span
              aria-hidden="true"
              className={cx(
                "grid size-5 shrink-0 place-items-center rounded-[4px] border",
                r.done ? "border-green bg-green text-white" : "border-navy/25",
              )}
            >
              {r.done && (
                <svg viewBox="0 0 12 12" className="size-3" fill="none">
                  <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

/** '왜 황진인가' 핵심 3줄 — 사진 아래(또는 사진 없이) 바로 읽히는 신뢰 정보 */
export function CredentialSummary({ className }: { className?: string }) {
  return (
    <dl className={cx("on-navy rounded-[6px] bg-navy px-6 py-6 text-on-navy sm:px-8 sm:py-7", className)}>
      <div>
        <dt className="sr-only">경력</dt>
        <dd className="text-[1.375rem] font-bold tracking-[-0.03em] text-white">금융 현장 {profile.careerYears}년</dd>
      </div>
      <div className="mt-2">
        <dt className="sr-only">함께 보는 영역</dt>
        <dd className="text-on-navy-muted">{profile.areas.join(" · ")}</dd>
      </div>
      {profile.credentials.length > 0 && (
        <div className="mt-4">
          <dt className="text-base text-mint-label">보유 자격</dt>
          <dd className="mt-2">
            <ul className="flex flex-wrap gap-1.5">
              {profile.credentials.map((c) => (
                <li key={c} className="rounded-full border border-navy-line px-2.5 py-0.5 text-base text-on-navy">
                  {c}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      )}
      <div className="mt-4 border-t border-navy-line pt-4">
        <dt className="sr-only">상담 방식</dt>
        <dd className="font-semibold text-mint">상품보다 상황을 먼저 봅니다.</dd>
      </div>
    </dl>
  );
}

/* ---------- 업무 영역 라인 아이콘 (24px, 1.6 stroke) — 금융 광고식 이미지 대신 개념만 ---------- */

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "size-6",
};

export const AreaIcons = {
  /** 대출: 매달 나가는 상환 일정 */
  loan: (
    <svg {...iconProps}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4M8 14h3M8 17h6" />
    </svg>
  ),
  /** 보험: 위험을 막는 방패 */
  insurance: (
    <svg {...iconProps}>
      <path d="M12 3.5 5 6v5.5c0 4.2 3 7.7 7 9 4-1.3 7-4.8 7-9V6l-7-2.5Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </svg>
  ),
  /** 연금: 은퇴 후 이어지는 시간 */
  pension: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  ),
  /** 퇴직연금: 회사에서 만든 계좌 */
  retirement: (
    <svg {...iconProps}>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M3.5 12.5h17" />
    </svg>
  ),
  /** 투자: 시간을 두고 자라는 것 */
  investment: (
    <svg {...iconProps}>
      <path d="M12 20.5v-8" />
      <path d="M12 12.5c0-3.5 2.5-6 6.5-6 0 3.8-2.6 6-6.5 6ZM12 15c0-2.8-2-4.8-5.5-4.8 0 3 2.2 4.8 5.5 4.8Z" />
      <path d="M7 20.5h10" />
    </svg>
  ),
};
