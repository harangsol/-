import Link from "next/link";
import { ShareButton } from "@/components/ui/share-button";
import { Arrow, buttonClass, Container, cx, Eyebrow, Section, SectionTitle } from "@/components/ui/primitives";
import { TrackView } from "@/components/ui/track-view";
import { TrackedLink } from "@/components/ui/tracked-link";
import { profile } from "@/config/site";
import { AffiliationCards } from "./affiliations";
import { AreaIcons, CredentialSummary, HeroVisual, PhotoFrame } from "./visuals";

/*
 * 홈 화면 (7개 섹션 + 짧은 푸터) — 방문자가 이 순서로 생각하게 만든다.
 *  01 Hero          황진? 어떤 사람이지? / 금융 현장에서 오래 일했구나
 *  02 Work          보험만 하는 게 아니네. 대출·연금·퇴직연금·투자, 사업자 정책자금까지
 *  03 About         왜 황진인가 — 금융 현장 15년, 걸어온 길, 실제 강의 사진
 *  04 Process       상품 이야기는 맨 마지막
 *  05 Referral      내 주변 누구한테 한번 보내줘야겠다
 *  06 FinalCta      상품을 고르기 전에, 순서부터              (네이비)
 *  07 Closing       아버지와 천왕봉 — 잘 벌고, 잘 쓰고, 가족과 오래 건강하게 살기
 */

/* 01 — HERO — 문구가 주인공, 사진(PHOTO 01)은 약 35% 비중.
 * 모바일: 제목·핵심 문장 → 사진 → 업무영역·CTA 순서로 첫 화면 안에서 사람이 보이게 한다. */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-ivory pb-14 pt-24 sm:pb-28 sm:pt-36">
      <Container className="grid items-center gap-x-16 gap-y-7 lg:grid-cols-[1.75fr_1fr] lg:grid-rows-[auto_auto]">
        <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
          <Eyebrow>금융 현장 {profile.careerYears}년</Eyebrow>
          <h1
            id="hero-title"
            className="text-[clamp(2.125rem,9.4vw,4rem)] font-extrabold leading-[1.22] tracking-[-0.045em] text-navy"
          >
            잘 벌고, 잘 쓰고,
            <br />
            오래 잘 살기.
          </h1>
          <p className="mt-6 text-[1.1875rem] font-semibold leading-relaxed text-navy sm:text-[1.375rem]">
            돈은 상품 하나보다
            <br />
            <span className="text-green">순서</span>가 더 중요할 때가 많습니다.
          </p>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <HeroVisual />
        </div>

        <div className="lg:col-start-1 lg:row-start-2 lg:self-start">
          <p className="text-base font-semibold tracking-[0.01em] text-navy sm:text-[1.0625rem]">대출 · 보험 · 연금 · 퇴직연금 · 투자</p>
          <p className="mt-1 max-w-[30rem] sm:text-[1.1875rem]">
            지금 내 상황에서
            <br />
            무엇부터 볼지 한번 정리해보세요.
          </p>

          <div className="mt-8 max-w-[26rem]">
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
            <p className="mt-2 text-base leading-relaxed text-muted">
              가입 권유부터 하지 않습니다.
              <br />
              먼저 지금 상황부터 봅니다.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* 02 — 황진은 이런 일을 합니다 + 업무 기반
 * 텍스트만 이어지지 않게 영역마다 라인 아이콘 + 핵심 키워드 한 줄을 둔다. */
const WORK = [
  {
    icon: AreaIcons.loan,
    name: "대출 · 부채관리",
    body: "새 대출을 찾기 전에 지금 대출의 구조부터 확인합니다.",
    keys: ["월 부담", "금리", "만기", "부채 구조"],
    loan: true,
  },
  {
    icon: AreaIcons.insurance,
    name: "보험 · 절세",
    body: "많이 가입하기보다 어떤 위험을 막고 있는지부터 봅니다.",
    keys: ["위험 대비", "중복", "보험료 부담"],
  },
  {
    icon: AreaIcons.pension,
    name: "연금",
    body: "상품 이름보다 은퇴 후 필요한 생활비부터 확인합니다.",
    keys: ["은퇴 후 현금흐름"],
  },
  {
    icon: AreaIcons.retirement,
    name: "퇴직연금",
    body: "회사가 만들어준 계좌로만 두지 않고 지금 상태를 확인합니다.",
    keys: ["DB · DC · IRP", "현재 운용 상태"],
  },
  {
    icon: AreaIcons.investment,
    name: "투자 · 자산관리",
    body: "수익률보다 언제, 무엇에 쓸 돈인지부터 정리합니다.",
    keys: ["목적", "기간", "언제 쓸 돈인지"],
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
        </div>

        <div>
          <ul className="border-t border-navy/15">
            {WORK.map((w) => (
              <li key={w.name} className="reveal flex gap-4 border-b border-navy/15 py-6 sm:gap-5 sm:py-7">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ivory text-navy">{w.icon}</span>
                <div className="min-w-0 flex-1">
                  {w.loan && <TrackView event="loan_section_view" params={{ location: "home_work" }} />}
                  <h3 className="text-[1.25rem] font-bold text-navy sm:text-[1.4375rem]">{w.name}</h3>
                  <p className="mt-1.5">{w.body}</p>
                  <p className="mt-3 text-base font-medium text-navy/75">
                    {w.keys.map((k, i) => (
                      <span key={k}>
                        {i > 0 && <span aria-hidden="true" className="mx-2 text-navy/25">|</span>}
                        {k}
                      </span>
                    ))}
                  </p>
                  {w.loan && (
                    <p className="mt-4 border-l-[3px] border-green pl-4 font-semibold leading-[1.6] text-navy">
                      새로운 대출보다 <span className="text-green">현재 구조</span>를 먼저 봅니다.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* 업무 기반 — 홈에서는 여기서 한 번만 보여준다 */}
          <div className="mt-10">
            <TrackView event="profile_affiliation_view" params={{ location: "home_work" }} />
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[1.125rem] font-bold text-navy">업무 기반</h3>
            </div>
            <AffiliationCards audience="personal" className="mt-4" />
          </div>

          <div className="mt-8 rounded-[8px] border border-line bg-ivory px-5 py-5 sm:px-7 sm:py-6">
            <h3 className="font-bold text-navy">사업을 하시는 경우</h3>
            <p className="mt-2">개인 금융과 따로, 사업자 정책자금과 사업 자금 흐름도 함께 봅니다.</p>
            <AffiliationCards audience="business" className="mt-4" />
          </div>
        </div>
      </div>
    </Section>
  );
}

/* 03 — 왜 황진인가 — PHOTO 02(세미나) + 핵심 3줄 + 걸어온 길 */
export function About() {
  return (
    <Section id="about" labelledBy="about-title">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-start lg:gap-20">
        <div className="lg:col-start-2 lg:row-start-1">
          <Eyebrow>왜 황진인가</Eyebrow>
          <SectionTitle id="about-title" className="text-navy">
            {"돈과 사람 사이에서\n깨지고 배우며 컸습니다."}
          </SectionTitle>
        </div>

        <div className="lg:sticky lg:top-24 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <PhotoFrame
            slot="about"
            sizes="(min-width: 1024px) 460px, 92vw"
            className="mb-3 aspect-[4/3] w-full"
          />
          <CredentialSummary />
        </div>

        <div className="lg:col-start-2 lg:row-start-2">
          <ol className="border-l-2 border-navy/15" aria-label="걸어온 길">
            {profile.path.map((p, i) => (
              <li key={p.year} className="relative pb-5 pl-6 last:pb-0">
                <span
                  aria-hidden="true"
                  className={cx(
                    "absolute -left-[7px] top-[0.55em] size-3 rounded-full",
                    i === profile.path.length - 1 ? "bg-green" : "border-2 border-navy/30 bg-ivory",
                  )}
                />
                <p className="text-base font-bold tabular-nums text-navy">{p.year}</p>
                <p className="mt-0.5">{p.text}</p>
              </li>
            ))}
          </ol>

          <p className="mt-8">
            좋은 선택도, 조금 더 일찍 알았으면 좋았을 선택도 가까이에서 봐왔습니다. 그래서 상품 하나보다
            <strong className="font-semibold text-navy"> 그 사람의 전체 상황부터</strong> 봅니다.
          </p>

        </div>
      </div>
    </Section>
  );
}

/* 04 — 상담 과정 */
const STEPS = [
  {
    no: "01",
    title: "현재 상황 확인",
    body: "지금 가진 것과 앞으로 필요한 돈을 한번에 펼쳐봅니다.",
  },
  {
    no: "02",
    title: "우선순위 정리",
    body: "",
    order: true,
  },
  {
    no: "03",
    title: "유지할 것부터 찾기",
    body: "바꿀 것보다 잘 가진 것을 먼저 찾습니다.",
  },
  {
    no: "04",
    title: "필요한 경우에만 대안 검토",
    body: "비어 있는 부분이 있을 때만 방법을 살펴봅니다.",
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
            <p className="text-base font-bold tracking-[0.04em] text-muted">STEP {s.no}</p>
            <h3 className="mt-2 text-[1.3125rem] font-bold text-navy">{s.title}</h3>
            {s.body && <p className="mt-2">{s.body}</p>}
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
        <span className="text-green">본인의 몫</span>입니다.
      </p>
    </Section>
  );
}

/* 05 — 주변에 이런 분이 떠오른다면 */
const FRIENDS = [
  "보험은 많은데 내용을 모르는 친구",
  "대출 부담이 큰 가족",
  "퇴직연금을 그냥 둔 직장동료",
  "노후 준비가 막막한 지인",
  "결혼·출산 후 돈 관리를 다시 잡고 싶은 사람",
  "자금 문제로 고민하는 사업자 대표님",
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
          <p className="mb-10 border-l-[3px] border-navy/20 pl-4 text-[1.0625rem] leading-[1.7] text-navy sm:text-[1.125rem]">
            복잡한 금융 이야기는 쉽게 정리하고,
            <br />
            필요 없는 것은 굳이 권하지 않으려 합니다.
          </p>
          <p className="text-[1.125rem] leading-[1.7] text-ink sm:text-[1.25rem]">
            상품을 권하려고
            <br />
            소개하지 않으셔도 됩니다.
          </p>
          <p className="mt-6 text-[2rem] font-bold tracking-[-0.04em] text-green sm:text-[2.5rem]">“한번 정리해봐.”</p>
          <p className="mt-4 text-[1.125rem] leading-[1.7] text-ink sm:text-[1.25rem]">
            이 한마디와 함께
            <br />
            이 페이지 하나만 보내주세요.
          </p>
          <ShareButton location="home_referral" label="필요한 분께 이 페이지 보내기" className="mt-8 w-full sm:w-auto sm:px-8" />
          <p className="text-base leading-relaxed text-muted">받은 분께 먼저 연락드리지 않습니다.</p>
        </div>
      </div>
    </Section>
  );
}

/* 06 — 최종 CTA */
export function FinalCta() {
  return (
    <section id="final-cta" aria-labelledby="final-title" className="on-navy bg-navy py-16 text-on-navy sm:py-28">
      <Container className="max-w-[48rem] text-center">
        <h2 id="final-title" className="pre-line text-[1.75rem] font-bold sm:text-[2.5rem]">
          {"상품을 고르기 전에,\n순서부터 정해보세요."}
        </h2>
        <p className="mx-auto mt-5 max-w-[30rem] text-on-navy-muted">급한 일이 생기고 나면 선택지가 줄어듭니다.</p>
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
        </p>
      </Container>
    </section>
  );
}

/* 07 — 마무리: PHOTO 03(아버지와 천왕봉) + 철학 한 줄 */
export function Closing() {
  return (
    <section id="closing" aria-label="마무리" className="bg-ivory pb-10 pt-16 sm:pb-14 sm:pt-28">
      <Container className="max-w-[48rem]">
        <figure>
          <PhotoFrame slot="life" sizes="(min-width: 768px) 720px, 92vw" className="aspect-[4/3] w-full" />
          <blockquote className="mt-9 text-[1.3125rem] font-semibold leading-[1.65] text-navy sm:text-[1.625rem]">
            잘 벌고,
            <br />
            잘 쓰고,
            <br />
            <span className="text-green">가족과 오래 건강하게</span> 살기.
          </blockquote>
          <p className="mt-4">
            돈을 관리하는 이유도
            <br />
            결국 잘 살기 위해서라고 생각합니다.
          </p>
          <figcaption className="mt-5 text-[1.0625rem] font-bold text-navy">— 황진</figcaption>
        </figure>
      </Container>
    </section>
  );
}
