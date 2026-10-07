import Image from "next/image";
import { photos } from "@/config/site";
import { cx } from "@/components/ui/primitives";

/**
 * HERO 오른쪽(모바일은 아래) 비주얼.
 * 실제 사진(src/config/site.ts → photos.hero)이 있으면 사진 + 메모 카드,
 * 없으면 '지금 · 다음 · 나중' 메모 카드만 단독으로 보여준다.
 */
export function HeroVisual() {
  const photo = photos.hero;
  return (
    <div className="relative mx-auto w-full max-w-[460px] lg:max-w-[480px]">
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
    { when: "다음", what: "겹치는 보장이 있는지 확인", done: false },
    { when: "나중", what: "퇴직연금 담긴 곳 점검", done: false },
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

/** 황진 소개 섹션 비주얼. 사진이 없으면 브랜드 문장을 담은 패널. */
export function AboutVisual() {
  const photo = photos.about;
  if (photo.src) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[6px] bg-paper">
        <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 440px, 90vw" className="object-cover" loading="lazy" />
      </div>
    );
  }
  return (
    <div className="on-navy flex aspect-[5/4] w-full flex-col justify-between rounded-[6px] bg-navy p-7 text-on-navy sm:aspect-[4/5] sm:p-10">
      <svg aria-hidden="true" viewBox="0 0 120 40" className="h-8 w-auto self-start text-[#9fd0a7]" fill="none">
        <path d="M2 30c14 0 18-20 32-20s18 20 32 20 18-20 32-20 14 10 20 10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <p className="text-[1.5rem] font-bold leading-[1.45] tracking-[-0.03em] sm:text-[1.75rem]">
        잘 벌고,
        <br />
        잘 쓰고,
        <br />
        오래 잘 살기.
      </p>
      <p className="text-base text-on-navy-muted">황진이 금융을 바라보는 기준</p>
    </div>
  );
}
