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
  Thoughts,
  Work,
} from "@/components/home/sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Work />
      <Principle />
      <About />
      <Cases />
      <Process />
      <NotSaid />
      <Thoughts />
      <CheckInvite />
      <Referral />
      <FinalCta />
    </>
  );
}
