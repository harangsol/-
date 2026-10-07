import Link from "next/link";
import { Arrow, buttonClass, Container, cx, Eyebrow, Section, SectionTitle } from "@/components/ui/primitives";
import { TrackedLink } from "@/components/ui/tracked-link";
import { AboutVisual, HeroVisual } from "./visuals";

/* SECTION 1 — HERO */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-ivory pb-20 pt-24 sm:pb-28 sm:pt-36">
      <Container className="grid items-center gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        <div>
          <Eyebrow>황진의 개인금융 안내</Eyebrow>
          <h1
            id="hero-title"
            className="text-[clamp(2.125rem,9.4vw,4rem)] font-extrabold leading-[1.22] tracking-[-0.045em] text-navy"
          >
            잘 벌고, 잘 쓰고,
            <br />
            오래 잘 살기.
          </h1>
          <p className="mt-7 text-[1.1875rem] font-semibold leading-relaxed text-ink sm:text-[1.375rem]">
            돈은 상품 하나로 관리되지 않습니다.
          </p>
          <p className="mt-3 max-w-[30rem] text-muted sm:text-[1.1875rem]">
            보험도, 연금도, 퇴직연금도, 투자도
            <br /> 지금 내 삶에 맞는 <strong className="font-semibold text-ink">순서</strong>가 먼저입니다.
          </p>

          <div className="mt-9 max-w-[26rem]">
            <p className="mb-3 text-base font-medium text-navy">
              보험 · 연금 · 퇴직연금 · 투자,
              <br />
              뭐부터 볼지 한번 정리해보세요.
            </p>
            <TrackedLink
              id="hero-cta"
              href="/check"
              event="hero_cta_click"
              params={{ location: "hero" }}
              className={buttonClass("primary", "w-full text-[1.125rem] sm:w-auto sm:px-8")}
            >
              1분 개인금융 점검하기
              <Arrow />
            </TrackedLink>
            <p className="mt-4 text-base leading-relaxed text-muted">
              가입 권유부터 하지 않습니다.
              <br />
              먼저 지금 상황부터 봅니다.
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-base text-navy/80" aria-label="점검 안내">
              <li>질문 8개</li>
              <li aria-hidden="true" className="text-line">|</li>
              <li>약 1분</li>
              <li aria-hidden="true" className="text-line">|</li>
              <li>이름·연락처 없이 결과 확인</li>
            </ul>
          </div>
        </div>
        <HeroVisual />
      </Container>
    </section>
  );
}

/* SECTION 2 — 이런 생각 해본 적 있나요? */
const THOUGHTS = [
  "보험료는 계속 나가는데\n필요한 보장이 맞는지 모르겠다.",
  "연금은 있지만\n노후에 충분한지는 모르겠다.",
  "투자는 하는데\n왜 이걸 갖고 있는지 애매하다.",
  "퇴직연금은\n거의 확인하지 않는다.",
  "아이, 부모님, 집, 노후까지\n한꺼번에 신경 쓰인다.",
];

export function Thoughts() {
  return (
    <Section tone="paper" labelledBy="thoughts-title">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <Eyebrow>혹시</Eyebrow>
          <SectionTitle id="thoughts-title" className="text-navy">
            {"이런 생각,\n해본 적 있나요?"}
          </SectionTitle>
        </div>
        <ul className="border-t border-navy/15">
          {THOUGHTS.map((t) => (
            <li key={t} className="reveal flex gap-4 border-b border-navy/15 py-6 sm:py-7">
              <span aria-hidden="true" className="mt-[0.2em] font-serif text-[1.75rem] leading-none text-green">
                “
              </span>
              <p className="pre-line text-[1.1875rem] font-medium leading-[1.6] text-ink sm:text-[1.3125rem]">{t}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-16 max-w-[40rem] sm:mt-24">
        <p className="text-[1.25rem] leading-[1.7] text-muted sm:text-[1.5rem]">
          필요한 건 상품 하나를 더 고르는 일이 아니라
        </p>
        <p className="mt-1 text-[1.5rem] font-bold leading-[1.5] tracking-[-0.03em] text-navy sm:text-[2rem]">
          내 돈의 전체 그림을 한번 보는 것입니다.
        </p>
      </div>
    </Section>
  );
}

/* SECTION 3 — 돈은 각각 역할이 다릅니다 */
const ROLES = [
  { name: "현금", role: "갑자기 필요한 순간을\n버티게 합니다." },
  { name: "보험", role: "큰 위험이 생겼을 때\n삶이 무너지지 않게 합니다." },
  { name: "연금", role: "일하지 않는 시기의\n현금흐름을 준비합니다." },
  { name: "투자", role: "긴 시간을 이용해\n자산의 성장을 추구합니다." },
];

export function Roles() {
  return (
    <Section tone="navy" labelledBy="roles-title">
      <Eyebrow onNavy>돈의 역할</Eyebrow>
      <SectionTitle id="roles-title">{"돈은 각각\n역할이 다릅니다."}</SectionTitle>
      <dl className="mt-12 grid border-t border-navy-line sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((r, i) => (
          <div
            key={r.name}
            className={cx(
              "reveal border-b border-navy-line py-7 sm:px-6 sm:py-9 lg:border-b-0",
              i % 2 === 1 && "sm:border-l",
              i > 0 && "lg:border-l",
              "sm:first:pl-0 lg:pl-6",
            )}
          >
            <dt className="text-[1.5rem] font-bold tracking-[-0.03em] text-white">{r.name}</dt>
            <dd className="pre-line mt-3 text-on-navy-muted">{r.role}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-14 max-w-[36rem] text-[1.3125rem] font-semibold leading-[1.6] tracking-[-0.02em] sm:mt-20 sm:text-[1.625rem]">
        무엇이 더 좋은가가 아니라
        <br />
        <span className="text-[#9fd0a7]">지금 나에게 무엇이 먼저인가</span>입니다.
      </p>
    </Section>
  );
}

/* SECTION 4 — 점검 4가지 */
const AREAS = [
  {
    no: "01",
    name: "보험",
    questions: [
      "지금 보험이 어떤 위험을 막고 있는지 말할 수 있나요?",
      "같은 보장이 여러 곳에 겹쳐 있지는 않나요?",
      "보험료가 매달 버는 돈에 비해 부담스럽지 않나요?",
    ],
  },
  {
    no: "02",
    name: "연금",
    questions: [
      "국민연금 예상 수령액을 확인해본 적이 있나요?",
      "개인연금은 언제부터, 얼마나 받게 되나요?",
      "은퇴 후 한 달 생활비와 비교하면 얼마나 차이가 나나요?",
    ],
  },
  {
    no: "03",
    name: "퇴직연금",
    questions: [
      "내 퇴직연금이 DB형인지 DC형인지 알고 있나요?",
      "DC형·IRP라면 지금 어디에 담겨 있나요?",
      "마지막으로 확인한 게 언제인가요?",
    ],
  },
  {
    no: "04",
    name: "투자·자산관리",
    questions: [
      "이 돈은 언제, 무엇을 위해 쓸 돈인가요?",
      "투자하는 이유와 기간이 정해져 있나요?",
      "보험·연금·투자가 같은 방향을 보고 있나요?",
    ],
  },
];

export function Areas() {
  return (
    <Section labelledBy="areas-title">
      <div className="max-w-[40rem]">
        <Eyebrow>점검 영역</Eyebrow>
        <SectionTitle id="areas-title" className="text-navy">
          {"황진 개인금융 점검\n4가지"}
        </SectionTitle>
        <p className="mt-5 text-muted">
          상품 이름보다 먼저, 스스로에게 던져볼 질문들입니다.
          <br className="hidden sm:inline" /> 답이 바로 나오지 않는 곳이 먼저 볼 곳입니다.
        </p>
      </div>
      <ol className="mt-12 grid gap-x-16 sm:mt-16 lg:grid-cols-2">
        {AREAS.map((a) => (
          <li key={a.no} className="reveal border-t border-navy/15 py-9">
            <div className="flex items-baseline gap-4">
              <span className="text-base font-bold tabular-nums text-green">{a.no}</span>
              <h3 className="text-[1.5rem] font-bold text-navy">{a.name}</h3>
            </div>
            <ul className="mt-5 space-y-3">
              {a.questions.map((q) => (
                <li key={q} className="flex gap-3 text-ink">
                  <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-navy/40" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* SECTION 5 — 이런 분이라면 */
const WHO = [
  "돈은 버는데 생각보다 남는 돈이 없는 분",
  "보험을 여러 개 갖고 있지만 내용을 잘 모르는 분",
  "노후가 현실적으로 느껴지기 시작한 분",
  "퇴직연금을 그냥 두고 있는 분",
  "투자·보험·연금을 따로따로 관리하는 분",
  "결혼이나 출산 이후 돈 관리 기준을 다시 잡고 싶은 분",
  "부모님과 아이를 동시에 생각해야 하는 분",
];

export function Who() {
  return (
    <Section tone="paper" labelledBy="who-title">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <Eyebrow>이런 분께</Eyebrow>
          <SectionTitle id="who-title" className="text-navy">
            {"이런 분이라면\n한번 점검해보세요."}
          </SectionTitle>
        </div>
        <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-1">
          {WHO.map((w) => (
            <li key={w} className="flex items-start gap-4 border-b border-navy/15 py-4.5">
              <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-[0.3em] size-5 shrink-0 text-green" fill="none">
                <path d="M4 10.5 8 14.5 16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[1.0625rem] font-medium sm:text-[1.125rem]">{w}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/* SECTION 6 — 상담 과정 */
const STEPS = [
  {
    no: "01",
    title: "현재 상황 확인",
    body: "가지고 있는 보험, 연금, 퇴직연금, 투자, 그리고 앞으로 필요한 돈을 한자리에 펼쳐봅니다.",
  },
  {
    no: "02",
    title: "우선순위 정리",
    body: "모든 걸 한꺼번에 하지 않습니다. 해야 할 일을 시기별로 나눕니다.",
    order: true,
  },
  {
    no: "03",
    title: "유지할 것부터 찾기",
    body: "바꿀 것보다 잘 갖고 있는 것을 먼저 찾습니다. 이미 가진 것 중에 좋은 것도 많습니다.",
  },
  {
    no: "04",
    title: "필요한 경우에만 대안 검토",
    body: "정리 후에도 비어 있는 곳이 있을 때만 대안을 함께 살펴봅니다.",
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
      <ol className="mt-12 grid gap-0 sm:mt-16 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {STEPS.map((s) => (
          <li key={s.no} className="reveal relative border-l-2 border-green/25 pb-10 pl-6 last:pb-0 lg:border-l-0 lg:border-t-2 lg:pb-0 lg:pl-0 lg:pt-7">
            <span aria-hidden="true" className="absolute -left-[7px] top-1 size-3 rounded-full bg-green lg:-top-[7px] lg:left-0" />
            <p className="text-base font-bold tracking-[0.04em] text-green">STEP {s.no}</p>
            <h3 className="mt-2 text-[1.3125rem] font-bold text-navy">{s.title}</h3>
            <p className="mt-3 text-muted">{s.body}</p>
            {s.order && (
              <ul className="mt-4 flex gap-2" aria-label="우선순위 구분">
                {["지금 할 것", "다음에 할 것", "나중에 할 것"].map((o, i) => (
                  <li
                    key={o}
                    className={cx(
                      "rounded-full px-3 py-1 text-base font-semibold",
                      i === 0 ? "bg-green text-white" : "bg-green-soft text-green-deep",
                    )}
                  >
                    {o.replace(" 할 것", "")}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-14 border-t border-navy/15 pt-8 text-[1.25rem] font-semibold text-navy sm:text-[1.5rem]">
        최종 결정은 언제나 본인의 몫입니다.
      </p>
    </Section>
  );
}

/* SECTION 7 — 황진 소개 */
export function About() {
  return (
    <Section id="about" tone="paper" labelledBy="about-title">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-start lg:gap-20">
        <div className="order-2 hidden lg:order-1 lg:sticky lg:top-24 lg:block">
          <AboutVisual />
        </div>
        <div className="order-1 lg:order-2">
          <Eyebrow>황진 소개</Eyebrow>
          <SectionTitle id="about-title" className="text-navy">
            {"돈과 사람 사이에서\n깨지고 배우며 컸습니다."}
          </SectionTitle>
          <div className="mt-8 space-y-5 text-ink/90">
            <p>금융 현장에서 오랜 시간, 다양한 사람들의 돈 고민을 만나왔습니다.</p>
            <p>
              좋은 선택으로 마음이 편해지는 경우도 봤고, 조금 더 일찍 알았으면 좋았을 일을 뒤늦게 알게 되는 경우도 많이
              봤습니다.
            </p>
            <p>저 역시 돈과 일, 사람 사이에서 많은 시행착오를 겪었습니다.</p>
            <p>그래서 지금은 상품부터 이야기하기보다,</p>
          </div>
          <blockquote className="my-7 border-l-[3px] border-green pl-5">
            <p className="text-[1.375rem] font-bold leading-[1.5] tracking-[-0.03em] text-navy sm:text-[1.625rem]">
              “그 사람이 어떤 삶을 원하는지”
            </p>
            <p className="mt-1 text-ink/90">를 먼저 봅니다.</p>
          </blockquote>

          <div className="mt-12 border-t border-navy/15 pt-8">
            <p className="text-[1.25rem] font-semibold leading-[1.7] text-navy sm:text-[1.375rem]">
              잘 벌고, 잘 쓰고,
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

/* SECTION 8 — 내가 드리지 않는 것 */
const NOT_SAID = ["무조건 바꾸라는 말.", "무조건 투자해야 한다는 말.", "무조건 이 상품이 좋다는 말.", "당장 결정해야 한다는 말."];

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
          <p className="mt-10 text-[1.25rem] font-semibold text-[#9fd0a7] sm:text-[1.5rem]">
            사람마다 필요한 답이 다르기 때문입니다.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* SECTION 9 — 1분 금융점검 안내 */
export function CheckInvite() {
  const facts = [
    { k: "8개", v: "질문" },
    { k: "약 1분", v: "소요" },
    { k: "없음", v: "개인정보 입력" },
  ];
  return (
    <Section id="check" labelledBy="check-title">
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
          1분 개인금융 점검 시작하기
          <Arrow />
        </TrackedLink>
        <p className="mt-4 text-base text-muted">결과는 이 브라우저에만 잠시 저장되고, 서버로 보내지 않습니다.</p>
      </div>
    </Section>
  );
}

/* SECTION 10 — 최종 CTA */
export function FinalCta() {
  return (
    <section id="final-cta" aria-labelledby="final-title" className="on-navy bg-navy-soft py-20 text-on-navy sm:py-28">
      <Container className="max-w-[48rem] text-center">
        <h2 id="final-title" className="pre-line text-[1.75rem] font-bold sm:text-[2.5rem]">
          {"상품을 고르기 전에,\n순서부터 정해보세요."}
        </h2>
        <p className="mx-auto mt-5 max-w-[30rem] text-on-navy-muted">
          점검 결과를 보고 더 이야기 나누고 싶으면 그때 편하게 물어보셔도 됩니다.
        </p>
        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <TrackedLink
            href="/check"
            event="hero_cta_click"
            params={{ location: "final" }}
            className={buttonClass("primary", "sm:px-8")}
          >
            1분 개인금융 점검하기
            <Arrow />
          </TrackedLink>
          <Link href="/contact" className={buttonClass("outlineOnNavy", "sm:px-8")}>
            바로 물어보기
          </Link>
        </div>
      </Container>
    </section>
  );
}
