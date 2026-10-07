import Link from "next/link";
import { Container } from "@/components/ui/primitives";
import { HeaderCta } from "./header-cta";

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <Container className="flex h-16 items-center justify-between sm:h-20">
        <Link
          href="/"
          className="-mx-2 flex min-h-11 items-center gap-2 px-2 text-navy"
        >
          <span className="text-[1.1875rem] font-bold tracking-[-0.03em]">황진</span>
          <span className="h-3.5 w-px bg-navy/25" aria-hidden="true" />
          <span className="text-base font-medium text-muted">개인금융</span>
        </Link>
        <nav aria-label="주요 메뉴" className="flex items-center gap-1 text-base font-medium">
          <Link href="/#about" className="hidden min-h-11 items-center px-3 text-navy/80 hover:text-navy sm:flex">
            황진 소개
          </Link>
          <Link href="/#process" className="hidden min-h-11 items-center px-3 text-navy/80 hover:text-navy sm:flex">
            상담 과정
          </Link>
          <HeaderCta />
        </nav>
      </Container>
    </header>
  );
}
