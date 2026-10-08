import Image from "next/image";
import { photos, profile } from "@/config/site";
import { cx } from "@/components/ui/primitives";

/**
 * HERO 오른쪽(모바일은 아래) 비주얼.
 * 실제 사진(src/config/site.ts → photos.hero)이 있으면 사진 + 메모 카드,
 * 없으면 '지금 · 다음 · 나중' 메모 카드만 단독으로 보여준다.
 */
export function HeroVisual() {
  const photo = photos.hero;
  return (
    // 실제 사진이 없을 때 모바일에서는 메모 카드를 숨겨 첫 화면 다음 스크롤을 줄인다(데스크톱만 표시).
    <div className={cx("relative mx-auto w-full max-w-[460px] lg:max-w-[480px]", !photo.src && "hidden lg:block")}>
      {photo.src ? (
        <div className="relative aspect-[4/5] overflow-hidden rounded-[6px] bg-paper">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            priority
            sizes="(min-width: 1024px) 460px, 90vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div aria-hidden="true" className="absolute inset-0 -z-0 translate-x-3 translate-y-3 rounded-[6px] bg-navy/[0.06]" />
      )}
      <OrderNote className={photo.src ? "absolute -bottom-8 -left-4 w-[78%] sm:-left-10" : "relative"} />
      {!photo.src && (
        <p className="relative mt-5 text-base text-muted lg:mt-6">상담에서는 이렇게 ‘지금 · 다음 · 나중’ 순서부터 함께 정리합니다.</p>
      )}
    </div>
  );
}

function OrderNote({ className }: { className?: string }) {
  const rows = [
    { when: "지금", what: "비상자금 3개월치부터", done: true },
    { when: "다음", what: "대출 금리·만기 확인", done: false },
    { when: "나중", what: "겹치는 보장 정리", done: false },
  ];
  return (
    <figure
      className={cx(
        "rounded-[6px] border border-line bg-white px-6 pb-6 pt-5 shadow-[0_24px_48px_-28px_rgba(23,36,58,0.45)] sm:px-7 lg:px-9 lg:pb-8 lg:pt-7",
        className,
      )}
    >
      <figcaption className="flex items-baseline justify-between border-b border-line pb-3">
        <span className="text-base font-semibold text-navy lg:text-[1.125rem]">내 돈, 순서 정리</span>
        <span className="text-base text-muted">예시</span>
      </figcaption>
      <ol className="mt-1">
        {rows.map((r) => (
          <li key={r.when} className="flex items-center gap-4 border-b border-dashed border-line py-3.5 last:border-0 lg:py-5">
            <span
              className={cx(
                "w-11 shrink-0 text-base font-bold",
                r.when === "지금" ? "text-green" : "text-navy/70",
              )}
            >
              {r.when}
            </span>
            <span className="flex-1 text-base leading-snug text-ink lg:text-[1.0625rem]">{r.what}</span>
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

/** 황진 소개 — 프로필 카드(사진이 있으면 사진 아래에 붙는다). 경력은 신뢰 근거로만 담백하게 보여준다. */
export function ProfileCard() {
  const photo = photos.about;
  return (
    <div>
      {photo.src && (
        <div className="relative mb-4 aspect-[4/5] w-full overflow-hidden rounded-[6px] bg-paper">
          <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 440px, 90vw" className="object-cover" loading="lazy" />
        </div>
      )}
      <div className="on-navy rounded-[6px] bg-navy px-7 py-8 text-on-navy sm:px-9 sm:py-10">
        <p className="text-[1.75rem] font-bold tracking-[-0.03em] text-white">황진</p>
        <dl className="mt-6 space-y-5 border-t border-navy-line pt-6">
          <div>
            <dt className="text-base text-on-navy-muted">경력</dt>
            <dd className="mt-1 text-[1.25rem] font-semibold">금융 현장 {profile.careerYears}년</dd>
          </div>
          <div>
            <dt className="text-base text-on-navy-muted">함께 보는 영역</dt>
            <dd className="mt-2">
              <ul className="flex flex-wrap gap-2">
                {profile.areas.map((a) => (
                  <li key={a} className="rounded-full border border-navy-line px-3 py-1 text-base">
                    {a}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          {profile.credentials.length > 0 && (
            <div>
              <dt className="text-base text-on-navy-muted">자격·등록</dt>
              <dd className="mt-1">{profile.credentials.join(" · ")}</dd>
            </div>
          )}
          <div>
            <dt className="text-base text-on-navy-muted">상담 방식</dt>
            <dd className="mt-1">상품보다 상황을 먼저 봅니다.</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/** PHOTO 02 — 모바일 '왜 황진인가' 사진. 사진이 없으면 그리지 않는다(데스크톱은 ProfileCard 가 사진을 함께 보여준다). */
export function AboutPhotoMobile() {
  const photo = photos.about;
  if (!photo.src) return null;
  return (
    <div className="relative mt-8 aspect-[4/5] w-full overflow-hidden rounded-[6px] bg-paper lg:hidden">
      <Image src={photo.src} alt={photo.alt} fill sizes="90vw" className="object-cover" loading="lazy" />
    </div>
  );
}

/** PHOTO 03 — 감성 메시지 구간 라이프컷. 사진이 없으면 아무것도 그리지 않는다. */
export function LifePhoto({ className }: { className?: string }) {
  const photo = photos.life;
  if (!photo.src) return null;
  return (
    <div className={cx("relative aspect-[16/10] w-full overflow-hidden rounded-[6px] bg-paper", className)}>
      <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 600px, 90vw" className="object-cover" loading="lazy" />
    </div>
  );
}
