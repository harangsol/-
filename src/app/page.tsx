import {
  About,
  Areas,
  CheckInvite,
  FinalCta,
  Hero,
  NotSaid,
  Process,
  Roles,
  Thoughts,
  Who,
} from "@/components/home/sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Thoughts />
      <Roles />
      <Areas />
      <Who />
      <Process />
      <About />
      <NotSaid />
      <CheckInvite />
      <FinalCta />
    </>
  );
}
