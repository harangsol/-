import type { Metadata } from "next";
import { Bullets, LegalPage, LegalSection } from "@/components/ui/legal";
import { privacyConfig, retentionLabel } from "@/config/privacy";

// ⚠️ 문구 초안. 실제 운영 전 법률/컴플라이언스 검토 후 src/config/privacy.ts 에서 확정한다.

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "황진 개인금융 상담 신청 시 개인정보를 어떻게 수집하고 이용하며 언제 파기하는지 안내합니다.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const c = privacyConfig;
  const contactLine = [c.controller.contactEmail && `이메일 ${c.controller.contactEmail}`, c.controller.contactPhone && `전화 ${c.controller.contactPhone}`]
    .filter(Boolean)
    .join(" · ");
  return (
    <LegalPage
      title="개인정보처리방침"
      intro={
        <p>
          {c.controller.name}(이하 ‘운영자’)은 상담 신청에 필요한 최소한의 정보만 받습니다. 1분 금융점검은 개인정보 없이 이용할 수 있으며, 점검
          답변은 서버에 저장하지 않습니다.
        </p>
      }
    >
      <LegalSection title="1. 수집하는 항목">
        <p className="font-semibold text-navy">필수</p>
        <Bullets items={c.requiredItems} />
        <p className="pt-2 font-semibold text-navy">선택</p>
        <Bullets items={c.optionalItems} />
        <p className="pt-2 font-semibold text-navy">자동 수집</p>
        <Bullets items={c.autoItems} />
        <p className="pt-2 font-semibold text-navy">받지 않는 정보</p>
        <Bullets items={c.neverCollected} />
      </LegalSection>

      <LegalSection title="2. 이용 목적">
        <Bullets items={c.purposes} />
        <p className="pt-2">마케팅 정보 수신에 별도로 동의하신 경우에 한해 아래 목적으로도 이용합니다.</p>
        <Bullets items={c.marketingPurposes} />
      </LegalSection>

      <LegalSection title="3. 보유 및 이용 기간">
        <p>
          상담 신청일로부터 <strong className="font-semibold text-navy">{retentionLabel()}</strong> 동안 보관한 뒤 파기합니다. 그 전에 삭제를 요청하시면
          지체 없이 파기합니다. 다만 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
        </p>
      </LegalSection>

      <LegalSection title="4. 파기 절차와 방법">
        <p>{c.destruction}</p>
      </LegalSection>

      <LegalSection title="5. 제3자 제공">
        <p>{c.thirdParty}</p>
      </LegalSection>

      <LegalSection title="6. 처리 위탁">
        <ul className="space-y-1.5">
          {c.processors.map((p) => (
            <li key={p.name}>
              <span className="font-semibold text-navy">{p.name}</span> — {p.task}
            </li>
          ))}
        </ul>
        <p className="pt-2">{c.overseasTransfer}</p>
      </LegalSection>

      <LegalSection title="7. 방문 통계 도구">
        <p>{c.analyticsNotice}</p>
      </LegalSection>

      <LegalSection title="8. 정보주체의 권리">
        <p>{c.rights}</p>
      </LegalSection>

      <LegalSection title="9. 문의처">
        <p>개인정보 보호책임자: {c.controller.name}</p>
        {contactLine && <p>{contactLine}</p>}
      </LegalSection>

      <p className="border-t border-line pt-6 text-base text-muted">
        시행일: {c.effectiveDate} (버전 {c.version})
      </p>
    </LegalPage>
  );
}
