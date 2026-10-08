import Link from "next/link";
import { ShareButton } from "@/components/ui/share-button";
import { Arrow, buttonClass, Container, cx, Eyebrow, Section, SectionTitle } from "@/components/ui/primitives";
import { TrackView } from "@/components/ui/track-view";
import { TrackedLink } from "@/components/ui/tracked-link";
import { profile } from "@/config/site";
import { AffiliationRows } from "./affiliations";
import { ConsultCases } from "./consult-cases";
import { AboutPhotoMobile, HeroVisual, LifePhoto, ProfileCard } from "./visuals";

/*
 * 홈 화면 (10개 섹션 + 푸터) — 방문자가 이 순서로 생각하게 만든다.
 *  01 Hero          황진? 어떤 사람이지? / 금융 현장에서 오래 일했구나
 *  02 Work          보험만 하는 게 아니네. 대출·연금·퇴직연금·투자, 사업자 정책자금까지
 *  03 Principle     상품부터 권하지 않는 방식이네              (네이비)
 *  04 About         왜 황진인가 — 13년, 실제 업무 기반
 *  05 Cases         실제 상담도 전체 상황부터 보는구나
 *  06 Process       상품 이야기는 맨 마지막
 *  07 CheckInvite   나도 한번 정리해볼까?
 *  08 NotSaid       황진한테 물어봐도 부담 없겠네              (네이비)
 *  09 Referral      내 주변 누구한테 한번 보내줘야겠다
 *  10 FinalCta      상품을 고르기 전에, 순서부터              (네이비)
 * 네이비 섹션이 연달아 붙지 않게 배경을 번갈아 둔다.
 */

/* 01 — HERO */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-ivory pb-14 pt-24 sm:pb-28 sm:pt-36">
      <Container className="grid items-center gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        <div>
          <Eyebrow>금융 현장 {profile.careerYears}년</Eyebrow>
          <h1
            id="hero-title"
            className="text-[clamp(2.125rem,9.4vw,4rem)] font-extrabold leading-[1.22] tracking-[-0.045em] text-navy"
          >
            잘 벌고, 잘 쓰고,
            <br />
            오래 잘 살기.
          </h1>
          <p className="mt-7 text-[1.1875rem] font-semibold leading-relaxed text-ink sm:text-[1.375rem]">
            돈은 상품 하나보다
            <br />
            순서가 더 중요할 때가 많습니다.
          </p>
          <p className="mt-5 text-base font-semibold tracking-[0.01em] text-navy sm:text-[1.0625rem]">
            대출 · 보험 · 연금 · 퇴직연금 · 투자
          </p>
          <p className="mt-1 max-w-[30rem] text-muted sm:text-[1.1875rem]">
            지금 내 상황에서
            <br />
            무엇부터 볼지 한번 정리해보세요.
          </p>

          <div className="mt-9 max-w-[26rem]">
            <TrackedLink
              id="hero-cta"
              href="/check"
              event="hero_cta_click"
              params={{ location: "hero" }}
              className={buttonClass("primary", "w-full text-[1.125rem] sm:w-auto sm:px-8")}
            >
              1분 금융점검 하기
              <Arrow />
            </TrackedLink>
            <a
              href="#work"
              className="mt-3 flex min-h-11 w-fit items-center gap-1.5 text-base font-semibold text-navy underline decoration-navy/30 underline-offset-[6px] hover:decoration-navy"
            >
              황진은 어떤 일을 하나요?
              <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none">
                <path d="M10 4v11m-4.5-4.5L10 15l4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <p className="mt-3 text-base leading-relaxed text-muted">
              가입 권유부터 하지 않습니다.
              <br />
              먼저 지금 상황부터 봅니다.
            </p>
          </div>
        </div>
        <HeroVisual />
      </Container>
    </section>
  );
}

/* 02 — 황진은 이런 일을 합니다 + 업무 기반 */
const WORK = [
  {
    no: "01",
    name: "대출 · 부채관리",
    body: "새로운 대출부터 찾기보다 현재 금리, 월 상환부담, 만기, 전체 부채 구조부터 확인합니다.",
    note: "대출은 더 받는 것보다 현재 구조를 먼저 보는 것이 중요할 때가 있습니다.",
    loan: true,
  },
  {
    no: "02",
    name: "보험 · 절세",
    body: "많이 가입하는 것보다 현재 보험이 어떤 위험을 막고 있는지, 부담은 적절한지부터 봅니다.",
  },
  {
    no: "03",
    name: "연금",
    body: "상품 이름보다 은퇴 이후 필요한 생활비와 현재 준비된 현금흐름부터 확인합니다.",
  },
  {
    no: "04",
    name: "퇴직연금",
    body: "회사에서 만들어준 계좌로만 두지 않고 현재 유형과 운용 상태부터 확인합니다.",
  },
  {
    no: "05",
    name: "투자 · 자산관리",
    body: "수익률보다 이 돈을 언제, 무엇을 위해 사용할 것인지부터 정리합니다.",
  },
];

export function Work() {
  return (
    <Section id="work" tone="paper" labelledBy="work-title">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Eyebrow>하는 일</Eyebrow>
          <SectionTitle id="work-title" className="text-navy">
            {"황진은\n이런 일을 합니다."}
          </SectionTitle>
          <p className="mt-5 max-w-[26rem] text-[1.0625rem] text-ink/90 sm:text-[1.1875rem]">
            돈과 관련된 고민이 생겼을 때
            <br />
            무엇부터 볼지 함께 정리합니다.
          </p>
        </div>

        <div>
          <ol className="border-t border-navy/15">
            {WORK.map((w) => (
              <li key={w.no} className="reveal border-b border-navy/15 py-6 sm:py-8">
                {w.loan && <TrackView event="loan_section_view" params={{ location: "home_work" }} />}
                <div className="flex items-baseline gap-3">
                  <span className="text-base font-bold tabular-nums text-green">{w.no}</span>
                  <h3 className="text-[1.3125rem] font-bold text-navy sm:text-[1.5rem]">{w.name}</h3>
                </div>
                <p className="mt-2 text-ink/90">{w.body}</p>
                {w.note && <p className="mt-4 border-l-[3px] border-green pl-4 font-semibold leading-[1.6] text-navy">{w.note}</p>}
              </li>
            ))}
          </ol>

          {/* 업무 기반 — 홈에서는 여기서 한 번만 자세히 보여준다 (그 외에는 푸터) */}
          <div className="mt-10">
            <TrackView event="profile_affiliation_view" params={{ location: "home_work" }} />
            <h3 className="text-[1.125rem] font-bold text-navy">업무 기반</h3>
            <AffiliationRows audience="personal" className="mt-4" />
          </div>

          <div className="mt-8 rounded-[8px] border border-line bg-ivory px-5 py-5 sm:px-7 sm:py-6">
            <h3 className="font-bold text-navy">사업을 하시는 경우</h3>
            <p className="mt-2 text-ink/90">
              개인의 보험·대출·연금·투자와 별도로 사업자 정책자금과 사업의 자금 흐름도 함께 살펴볼 수 있습니다.
            </p>
            <AffiliationRows audience="business" className="mt-4" />
          </div>
        </div>
      </div>
    </Section>
  );
}

/* 03 — 상품보다 상황을 먼저 봅니다 (대표 메시지) */
export function Principle() {
  return (
    <Section tone="navy" labelledBy="principle-title">
      <h2
        id="principle-title"
        className="text-[clamp(2.25rem,10vw,4.25rem)] font-extrabold leading-[1.2] tracking-[-0.045em] text-white"
      >
        상품보다
        <br />
        상황을 먼저 봅니다.
      </h2>

      <div className="mt-10 grid gap-6 border-t border-navy-line pt-8 sm:mt-16 sm:grid-cols-2 sm:gap-12 sm:pt-10">
        <p className="text-[1.25rem] leading-[1.65] text-on-navy-muted sm:text-[1.5rem]">
          보험을 문의하셔도
          <br />
          <span className="font-semibold text-on-navy">대출 부담이 먼저</span>일 수 있고,
        </p>
        <p className="text-[1.25rem] leading-[1.65] text-on-navy-muted sm:text-[1.5rem]">
          투자를 고민하셔도
          <br />
          <span className="font-semibold text-on-navy">비상자금이 먼저</span>일 수 있습니다.
        </p>
      </div>

      <div className="mt-10 sm:mt-20">
        <p className="text-[1.125rem] text-on-navy-muted sm:text-[1.25rem]">그래서 상담은</p>
        <p className="mt-4 text-[1.375rem] font-medium text-on-navy-muted line-through decoration-on-navy-muted/60 decoration-2 sm:text-[1.75rem]">
          “무엇을 가입할까요?”
        </p>
        <p className="mt-2 text-[1.125rem] text-on-navy-muted sm:text-[1.25rem]">보다</p>
        <p className="mt-2 text-[1.75rem] font-bold tracking-[-0.03em] text-[#9fd0a7] sm:text-[2.5rem]">
          “지금 무엇이 필요한가요?”
        </p>
        <p className="mt-3 text-[1.125rem] text-on-navy sm:text-[1.25rem]">에서 시작합니다.</p>
      </div>
    </Section>
  );
}

/* 04 — 왜 황진인가 */
export function About() {
  return (
    <Section id="about" labelledBy="about-title">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-start lg:gap-20">
        <div className="hidden lg:sticky lg:top-24 lg:block">
          <ProfileCard />
        </div>
        <div>
          <Eyebrow>왜 황진인가</Eyebrow>
          <SectionTitle id="about-title" className="text-navy">
            {"돈과 사람 사이에서\n깨지고 배우며 컸습니다."}
          </SectionTitle>

          {/* 모바일은 프로필 카드 대신 사진만 (13년·영역 정보가 본문과 겹치지 않게) */}
          <AboutPhotoMobile />

          <p className="mt-10 text-[1.5rem] font-bold tracking-[-0.03em] text-navy sm:text-[1.75rem]">
            금융 현장에서 {profile.careerYears}년.
          </p>
          <div className="mt-5 space-y-5 text-ink/90">
            <p>보험, 대출, 연금, 퇴직연금, 투자와 다양한 사람들의 돈 고민을 가까이에서 봐왔습니다.</p>
            <p>좋은 선택도 봤고, 조금 더 일찍 알았으면 좋았을 선택도 봤습니다.</p>
            <p>저 역시 돈과 일, 사람 사이에서 여러 시행착오를 겪었습니다.</p>
            <p>
              그래서 지금은 상품 하나를 먼저 설명하기보다
              <strong className="font-semibold text-navy"> 그 사람의 전체 상황부터 보는 방식</strong>으로 상담합니다.
            </p>
          </div>

          <div className="mt-12 border-t border-navy/15 pt-8">
            <LifePhoto className="mb-8" />
            <p className="text-[1.25rem] font-semibold leading-[1.7] text-navy sm:text-[1.375rem]">
              잘 벌고,
              <br />
              잘 쓰고,
              <br />
              가족과 오래 건강하게 살기.
            </p>
            <p className="mt-4 text-muted">
              제가 생각하는 금융의 목적도
              <br />
              여기에서 크게 벗어나지 않습니다.
            </p>
            <p className="mt-6 text-[1.125rem] font-bold text-navy">— 황진</p>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* 05 — 실제 상담은 이렇게 생각합니다 */
export function Cases() {
  return (
    <Section id="cases" tone="paper" labelledBy="cases-title">
      <div className="max-w-[40rem]">
        <Eyebrow>실제 상담은 이렇게 생각합니다</Eyebrow>
        <SectionTitle id="cases-title" className="text-navy">
          {"처음 질문과\n먼저 보는 문제가\n다를 때가 많습니다."}
        </SectionTitle>
      </div>
      <ConsultCases />
    </Section>
  );
}

/* 06 — 상담 과정 */
const STEPS = [
  {
    no: "01",
    title: "현재 상황 확인",
    body: "대출 · 보험 · 연금 · 퇴직연금 · 투자, 그리고 앞으로 필요한 돈을 한번에 펼쳐봅니다.",
  },
  {
    no: "02",
    title: "우선순위 정리",
    body: "모든 걸 한꺼번에 하지 않고 시기별로 나눕니다.",
    order: true,
  },
  {
    no: "03",
    title: "유지할 것부터 찾기",
    body: "바꾸는 것보다 잘 가지고 있는 것을 먼저 찾습니다.",
  },
  {
    no: "04",
    title: "필요한 경우에만 대안 검토",
    body: "정리 후에도 비어 있는 부분이 있을 때만 가능한 방법을 함께 살펴봅니다.",
  },
];

export function Process() {
  return (
    <Section id="process" labelledBy="process-title">
      <div className="max-w-[40rem]">
        <Eyebrow>상담 과정</Eyebrow>
        <SectionTitle id="process-title" className="text-navy">
          {"상품 이야기는\n맨 마지막입니다."}
        </SectionTitle>
      </div>
      <ol className="mt-10 grid gap-0 sm:mt-16 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {STEPS.map((s) => (
          <li key={s.no} className="reveal relative border-l-2 border-green/25 pb-8 pl-6 last:pb-0 lg:border-l-0 lg:border-t-2 lg:pb-0 lg:pl-0 lg:pt-7">
            <span aria-hidden="true" className="absolute -left-[7px] top-1 size-3 rounded-full bg-green lg:-top-[7px] lg:left-0" />
            <p className="text-base font-bold tracking-[0.04em] text-green">STEP {s.no}</p>
            <h3 className="mt-2 text-[1.3125rem] font-bold text-navy">{s.title}</h3>
            <p className="mt-3 text-muted">{s.body}</p>
            {s.order && (
              <ul className="mt-4 flex gap-2" aria-label="우선순위 구분">
                {["지금", "다음", "나중"].map((o, i) => (
                  <li
                    key={o}
                    className={cx(
                      "rounded-full px-3 py-1 text-base font-semibold",
                      i === 0 ? "bg-green text-white" : "bg-green-soft text-green-deep",
                    )}
                  >
                    {o}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-10 border-t border-navy/15 pt-7 text-[1.25rem] font-semibold leading-[1.6] text-navy sm:mt-14 sm:text-[1.5rem]">
        최종 결정은 언제나
        <br />
        본인의 몫입니다.
      </p>
    </Section>
  );
}

/* 08 — 제가 드리지 않는 것 */
const NOT_SAID = ["무조건 바꾸라는 말", "무조건 투자해야 한다는 말", "무조건 이 상품이 좋다는 말", "당장 결정해야 한다는 말"];

export function NotSaid() {
  return (
    <Section tone="navy" labelledBy="notsaid-title">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <Eyebrow onNavy>약속</Eyebrow>
          <SectionTitle id="notsaid-title">{"제가 드리지\n않는 것"}</SectionTitle>
        </div>
        <div>
          <ul className="border-t border-navy-line">
            {NOT_SAID.map((n) => (
              <li key={n} className="flex items-center gap-4 border-b border-navy-line py-5 sm:py-6">
                <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5 shrink-0 text-on-navy-muted" fill="none">
                  <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span className="text-[1.1875rem] font-medium text-on-navy sm:text-[1.3125rem]">{n}</span>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-[1.25rem] font-semibold leading-[1.6] text-[#9fd0a7] sm:text-[1.5rem]">
            사람마다
            <br />
            필요한 답이 다르기 때문입니다.
          </p>
          <p className="mt-6 text-on-navy-muted">
            필요한 것이 없다면
            <br />
            아무것도 하지 않는 것도 답일 수 있습니다.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* 07 — 1분 금융점검 */
export function CheckInvite() {
  const facts = [
    { k: "9개", v: "질문" },
    { k: "약 1분", v: "소요" },
    { k: "없음", v: "개인정보 입력" },
  ];
  return (
    <Section id="check" tone="paper" labelledBy="check-title">
      <div className="mx-auto max-w-[44rem] text-center">
        <Eyebrow>1분 금융점검</Eyebrow>
        <SectionTitle id="check-title" className="text-navy">
          {"돈 정리는 아무 일 없을 때가\n가장 편합니다."}
        </SectionTitle>
        <p className="mx-auto mt-6 max-w-[34rem] text-muted">
          급한 일이 생긴 뒤에는 선택지가 줄어듭니다. 지금 1분만 써서 내 돈에서 먼저 볼 곳이 어디인지 확인해보세요.
        </p>
        <dl className="mx-auto mt-10 grid max-w-[30rem] grid-cols-3 border-y border-navy/15 py-6">
          {facts.map((f, i) => (
            <div key={f.v} className={cx("flex flex-col-reverse", i > 0 && "border-l border-navy/15")}>
              <dt className="mt-1 text-base text-muted">{f.v}</dt>
              <dd className="text-[1.5rem] font-bold tracking-[-0.03em] text-navy">{f.k}</dd>
            </div>
          ))}
        </dl>
        <TrackedLink
          href="/check"
          event="hero_cta_click"
          params={{ location: "check_section" }}
          className={buttonClass("primary", "mt-10 w-full sm:w-auto sm:px-10")}
        >
          1분 금융점검 시작하기
          <Arrow />
        </TrackedLink>
        <p className="mt-4 text-base text-muted">결과는 이 브라우저에만 잠시 저장되고, 서버로 보내지 않습니다.</p>
      </div>
    </Section>
  );
}

/* 09 — 주변에 이런 분이 떠오른다면 */
const FRIENDS = [
  "보험은 많은데 내용을 잘 모르는 친구",
  "대출 부담 때문에 고민하는 가족",
  "퇴직연금을 거의 확인하지 않는 직장동료",
  "투자와 노후 준비가 막막한 지인",
  "결혼·출산 이후 돈 관리를 다시 정리하고 싶은 사람",
  "사업자 자금 문제로 고민하는 대표님",
];

export function Referral() {
  return (
    <Section id="referral" labelledBy="referral-title">
      <TrackView event="referral_section_view" params={{ location: "home" }} />
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div>
          <Eyebrow>소개</Eyebrow>
          <SectionTitle id="referral-title" className="text-navy">
            {"주변에 이런 분이\n떠오른다면"}
          </SectionTitle>
          <ul className="mt-8 grid border-t border-navy/15 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-1">
            {FRIENDS.map((f) => (
              <li key={f} className="flex items-start gap-3.5 border-b border-navy/15 py-3.5">
                <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-[0.25em] size-5 shrink-0 text-green" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <circle cx="10" cy="7" r="3.2" />
                  <path d="M4 17c.8-3.2 3.2-5 6-5s5.2 1.8 6 5" strokeLinecap="round" />
                </svg>
                <span className="pre-line text-[1.0625rem] font-medium leading-[1.55] sm:text-[1.125rem]">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:pt-24">
          <p className="text-[1.125rem] leading-[1.7] text-ink/90 sm:text-[1.25rem]">
            상품을 권하려고
            <br />
            소개하지 않으셔도 됩니다.
          </p>
          <p className="mt-6 text-[2rem] font-bold tracking-[-0.04em] text-navy sm:text-[2.5rem]">“한번 정리해봐.”</p>
          <p className="mt-4 text-[1.125rem] leading-[1.7] text-ink/90 sm:text-[1.25rem]">
            이 한마디와 함께
            <br />
            이 페이지 하나만 보내주세요.
          </p>
          <ShareButton location="home_referral" label="필요한 분께 이 페이지 보내기" className="mt-8 w-full sm:w-auto sm:px-8" />
          <p className="text-base leading-relaxed text-muted">
            받은 분께 먼저 연락드리지 않습니다.
            <br />
            받은 분이 원할 때만 이야기를 시작합니다.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* 10 — 최종 CTA */
export function FinalCta() {
  return (
    <section id="final-cta" aria-labelledby="final-title" className="on-navy bg-navy py-16 text-on-navy sm:py-28">
      <Container className="max-w-[48rem] text-center">
        <h2 id="final-title" className="pre-line text-[1.75rem] font-bold sm:text-[2.5rem]">
          {"상품을 고르기 전에,\n순서부터 정해보세요."}
        </h2>
        <p className="mx-auto mt-5 max-w-[30rem] text-on-navy-muted">
          급한 일이 생기고 나면 선택지가 줄어듭니다.
          <br />
          지금 1분만 써서 내 돈에서 먼저 볼 곳이 어디인지 확인해보세요.
        </p>
        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <TrackedLink
            href="/check"
            event="hero_cta_click"
            params={{ location: "final" }}
            className={buttonClass("primary", "sm:px-8")}
          >
            1분 금융점검 하기
            <Arrow />
          </TrackedLink>
          <Link href="/contact" className={buttonClass("outlineOnNavy", "sm:px-8")}>
            황진에게 한번 물어보기
          </Link>
        </div>
        <p className="mt-8 text-base leading-relaxed text-on-navy-muted">
          정리된 질문이 없어도 괜찮습니다.
          <br />
          지금 상황부터 편하게 이야기하면 됩니다.
        </p>
      </Container>
    </section>
  );
}
