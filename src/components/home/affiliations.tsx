import { cx } from "@/components/ui/primitives";
import { displayValue, profileAffiliations, type Affiliation } from "@/config/profileAffiliations";

/**
 * 업무 기반 (회사 · 등록 정보) — 로고 없이 텍스트로만, 담백하게.
 * 관계 표현(위촉·소속·등록 등)은 src/config/profileAffiliations.ts 에서만 정한다. 여기서 임의로 덧붙이지 않는다.
 * 노출 위치는 홈 '하는 일' 섹션과 푸터, 두 곳뿐이다.
 */

function lines(a: Affiliation) {
  const reg = displayValue(a.registrationNumber);
  return {
    // 회사명(굵게)과 관계(아래 줄)를 따로 보여준다. 예) 키움에셋플래너 / 소속 보험설계사
    main: a.companyName || displayValue(a.relationshipLabel),
    relation: a.companyName ? displayValue(a.relationshipLabel) : "",
    reg: reg ? `${a.registrationLabel ?? "등록번호"} ${reg}` : "",
    disclaimer: displayValue(a.disclaimer),
  };
}

export function AffiliationRows({
  audience,
  tone = "light",
  className,
}: {
  audience: Affiliation["audience"];
  tone?: "light" | "footer";
  className?: string;
}) {
  const rows = profileAffiliations.filter((a) => a.audience === audience).map((a) => ({ a, ...lines(a) })).filter((r) => r.main);
  if (rows.length === 0) return null;

  return (
    <dl className={cx(tone === "light" ? "border-t border-navy/15" : "", className)}>
      {rows.map(({ a, main, relation, reg, disclaimer }) => (
        <div
          key={a.id}
          className={cx(
            "grid gap-1",
            tone === "light"
              ? "border-b border-navy/15 py-3.5 sm:grid-cols-[10rem_1fr] sm:gap-6"
              : "grid-cols-[8.5rem_1fr] gap-3 py-1.5 sm:grid-cols-[9rem_1fr] sm:gap-4",
          )}
        >
          <dt className={cx("text-base", tone === "light" ? "text-muted" : "text-muted")}>{a.category}</dt>
          <dd className={cx(tone === "light" ? "font-semibold text-navy" : "text-ink")}>
            {main}
            {relation && <span className="block font-normal text-ink">{relation}</span>}
            {reg && <span className={cx("block font-normal", tone === "light" ? "text-ink/80" : "text-muted")}>{reg}</span>}
            {disclaimer && <span className="mt-1 block text-base font-normal text-muted">{disclaimer}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * 업무 기반을 본문 텍스트가 아닌 '신뢰 정보 블록'으로 — 작은 카드 2열(모바일 1~2열).
 * 로고 없이 텍스트만, 관계 표현은 config 값 그대로.
 */
export function AffiliationCards({ audience, className }: { audience: Affiliation["audience"]; className?: string }) {
  const rows = profileAffiliations.filter((a) => a.audience === audience).map((a) => ({ a, ...lines(a) })).filter((r) => r.main);
  if (rows.length === 0) return null;
  return (
    <ul className={cx("grid gap-2.5", rows.length > 1 && "min-[400px]:grid-cols-2", className)}>
      {rows.map(({ a, main, relation, reg, disclaimer }) => (
        <li key={a.id} className="rounded-[8px] border border-line bg-white px-4 py-3.5">
          <p className="text-base text-muted">{a.category}</p>
          <p className="mt-0.5 font-bold leading-snug text-navy">{main}</p>
          {relation && <p className="mt-0.5 text-base leading-snug text-ink">{relation}</p>}
          {reg && <p className="mt-0.5 text-base text-ink">{reg}</p>}
          {disclaimer && <p className="mt-1 text-base text-muted">{disclaimer}</p>}
        </li>
      ))}
    </ul>
  );
}
