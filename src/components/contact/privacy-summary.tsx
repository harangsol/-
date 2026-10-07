import Link from "next/link";
import { privacyConfig, retentionLabel } from "@/config/privacy";

/** 상담 폼 동의 모달에 들어가는 요약. 문구는 src/config/privacy.ts 에서 관리한다. */
export function PrivacyConsentSummary() {
  const rows = [
    { k: "수집 목적", v: privacyConfig.purposes.join(", ") },
    { k: "수집 항목", v: `[필수] ${privacyConfig.requiredItems.join(", ")}\n[선택] ${privacyConfig.optionalItems.join(", ")}` },
    { k: "보유 기간", v: `상담 신청일로부터 ${retentionLabel()} (요청 시 즉시 파기)` },
  ];
  return (
    <div>
      <Table rows={rows} />
      <p className="mt-4 text-base text-muted">
        동의하지 않으실 수 있습니다. 다만 동의하지 않으시면 연락을 드릴 수 없어 상담 신청이 어렵습니다. 카카오톡이나 전화로는 언제든 문의하실 수 있어요.
      </p>
      <p className="mt-3 text-base text-muted">
        주민등록번호, 계좌번호, 보험증권번호, 카드정보, 상세 자산금액은 받지 않습니다.
      </p>
      <Link href="/privacy" target="_blank" className="mt-4 inline-flex min-h-11 items-center font-medium text-green underline underline-offset-4">
        개인정보처리방침 전체 보기
      </Link>
    </div>
  );
}

export function MarketingConsentSummary() {
  const rows = [
    { k: "이용 목적", v: privacyConfig.marketingPurposes.join(", ") },
    { k: "이용 항목", v: "이름, 연락처" },
    { k: "보유 기간", v: `동의 철회 시 또는 상담 신청일로부터 ${retentionLabel()} 중 먼저 도래하는 때까지` },
  ];
  return (
    <div>
      <Table rows={rows} />
      <p className="mt-4 text-base text-muted">
        선택 항목입니다. 동의하지 않아도 상담 신청은 그대로 가능하며, 동의 후에도 언제든 철회할 수 있습니다.
      </p>
    </div>
  );
}

function Table({ rows }: { rows: { k: string; v: string }[] }) {
  return (
    <dl className="border-t border-line">
      {rows.map((r) => (
        <div key={r.k} className="grid gap-1 border-b border-line py-3 sm:grid-cols-[6rem_1fr] sm:gap-4">
          <dt className="text-base font-semibold text-navy">{r.k}</dt>
          <dd className="pre-line text-base text-ink/90">{r.v}</dd>
        </div>
      ))}
    </dl>
  );
}
