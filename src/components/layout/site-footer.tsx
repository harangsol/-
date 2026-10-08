import Link from "next/link";
import { Container } from "@/components/ui/primitives";
import { compliance } from "@/config/site";

/*
 * 짧은 푸터 — 개인정보처리방침·이용안내 링크와 고지 한 줄만.
 * 업무 기반(회사·등록번호)은 홈 '하는 일' 섹션에 표시한다.
 * ⚠️ 개인정보를 받는 사이트는 처리방침을 누구나 볼 수 있게 공개해야 하므로 링크는 지우지 않는다.
 */
export function SiteFooter() {
  return (
    <footer id="site-footer" className="bg-ivory pb-32 pt-2 text-base text-muted sm:pb-12">
      <Container>
        <div className="border-t border-line pt-5">
          <nav aria-label="하단 메뉴" className="-mx-2 flex flex-wrap gap-x-1">
            <Link href="/privacy" className="flex min-h-11 items-center px-2 font-bold text-navy hover:underline">
              개인정보처리방침
            </Link>
            <Link href="/terms" className="flex min-h-11 items-center px-2 text-navy hover:underline">
              이용안내
            </Link>
          </nav>
          <p className="mt-2 leading-relaxed">{compliance.footerNotice}</p>
          {compliance.affiliation && <p className="mt-1">{compliance.affiliation}</p>}
          <p className="mt-2">© 황진</p>
        </div>
      </Container>
    </footer>
  );
}
