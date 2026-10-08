import {
  About,
  Cases,
  CheckInvite,
  FinalCta,
  Hero,
  NotSaid,
  Principle,
  Process,
  Referral,
  Work,
} from "@/components/home/sections";

/** 홈 10개 섹션 — 순서와 의도는 src/components/home/sections.tsx 상단 주석 참고 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Work />
      <Principle />
      <About />
      <Cases />
      <Process />
      <CheckInvite />
      <NotSaid />
      <Referral />
      <FinalCta />
    </>
  );
}
