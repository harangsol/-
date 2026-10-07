import Link from "next/link";
import { Container } from "@/components/ui/primitives";
import { compliance, site, social } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="on-navy border-t border-navy-line bg-navy pb-32 pt-14 text-on-navy-muted sm:pb-16">
      <Container>
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[1.25rem] font-bold tracking-[-0.03em] text-on-navy">{site.name}</p>
            <p className="mt-2 text-base">{site.tagline}</p>
          </div>
          <nav aria-label="하단 메뉴" className="-mx-2 flex flex-wrap gap-x-2 gap-y-1 text-base">
            <Link href="/check" className="flex min-h-11 items-center px-2 hover:text-on-navy">
              1분 금융점검
            </Link>
            <Link href="/contact" className="flex min-h-11 items-center px-2 hover:text-on-navy">
              문의하기
            </Link>
            <Link href="/privacy" className="flex min-h-11 items-center px-2 font-semibold text-on-navy hover:underline">
              개인정보처리방침
            </Link>
            <Link href="/terms" className="flex min-h-11 items-center px-2 hover:text-on-navy">
              이용안내
            </Link>
            {social.instagram && (
              <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center px-2 hover:text-on-navy">
                Instagram
              </a>
            )}
            {social.threads && (
              <a href={social.threads} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center px-2 hover:text-on-navy">
                Threads
              </a>
            )}
          </nav>
        </div>

        <div className="mt-10 space-y-2 border-t border-navy-line pt-8 text-base leading-relaxed">
          <p>{compliance.pageNotice}</p>
          <p>최종 결정은 언제나 본인의 몫이며, 금융상품 가입 전에는 상품설명서와 약관을 반드시 확인하시기 바랍니다.</p>
          {compliance.affiliation && <p>{compliance.affiliation}</p>}
          <p className="pt-2">© 황진. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
