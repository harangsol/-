import { About, Closing, FinalCta, Hero, Process, Referral, Work } from "@/components/home/sections";

/** 홈 7개 섹션 — 순서와 의도는 src/components/home/sections.tsx 상단 주석 참고 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Work />
      <About />
      <Process />
      <Referral />
      <FinalCta />
      <Closing />
    </>
  );
}
