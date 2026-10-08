import { cx } from "@/components/ui/primitives";
import { displayValue, profileAffiliations, type Affiliation } from "@/config/profileAffiliations";

/**
 * 업무 기반 (회사 · 등록 정보) — 로고 없이 텍스트로만, 담백하게.
 * 관계 표현(위촉·소속·등록 등)은 src/config/profileAffiliations.ts 에서만 정한다. 여기서 임의로 덧붙이지 않는다.
 * 노출 위치는 홈 '하는 일' 섹션 한 곳이다.
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
