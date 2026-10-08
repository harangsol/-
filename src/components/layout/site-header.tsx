import Link from "next/link";
import { Container } from "@/components/ui/primitives";
import { site } from "@/config/site";
import { HeaderCta } from "./header-cta";

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <Container className="flex h-16 items-center justify-between gap-4 sm:h-20">
        <Link href="/" className="-mx-2 flex min-h-11 items-center gap-3 px-2 text-navy">
          <span className="text-[1.25rem] font-bold tracking-[-0.03em]">{site.name}</span>
          <span className="hidden text-base font-medium text-muted sm:inline">{site.areasLabel}</span>
        </Link>
        <nav aria-label="주요 메뉴" className="flex items-center gap-1 text-base font-medium">
          <Link href="/#work" className="hidden min-h-11 items-center px-3 text-navy/80 hover:text-navy lg:flex">
            하는 일
          </Link>
          <Link href="/#about" className="hidden min-h-11 items-center px-3 text-navy/80 hover:text-navy lg:flex">
            황진 소개
          </Link>
          <Link href="/#process" className="hidden min-h-11 items-center px-3 text-navy/80 hover:text-navy lg:flex">
            상담 방식
          </Link>
          <HeaderCta />
        </nav>
      </Container>
    </header>
  );
}
