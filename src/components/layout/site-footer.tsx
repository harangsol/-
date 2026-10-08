import Link from "next/link";
import { AffiliationRows } from "@/components/home/affiliations";
import { Container } from "@/components/ui/primitives";
import { compliance, site, social } from "@/config/site";

/*
 * 푸터 — 업무영역, 업무 기반(회사·등록 정보), 면책 문구.
 * ⚠️ 모집인·상담사·투자권유 관련 법적·회사별 표시 의무는 공개 전 최종 컴플라이언스 검토가 필요하다.
 * 마지막 CTA(네이비)와 이어지므로 네이비가 연달아 보이지 않게 밝은 배경을 쓴다.
 */
export function SiteFooter() {
  return (
    <footer id="site-footer" className="border-t border-line bg-paper pb-32 pt-14 text-ink sm:pb-16">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-[1.375rem] font-bold tracking-[-0.03em] text-navy">{site.name}</p>
            <p className="mt-2 text-base font-medium text-navy/85">{site.areasLabel}</p>
            <p className="mt-1 text-base text-muted">{site.tagline}</p>

            <nav aria-label="하단 메뉴" className="-mx-2 mt-6 flex flex-wrap gap-x-2 text-base">
              <Link href="/check" className="flex min-h-11 items-center px-2 text-navy hover:underline">
                1분 금융점검
              </Link>
              <Link href="/contact" className="flex min-h-11 items-center px-2 text-navy hover:underline">
                문의하기
              </Link>
              <Link href="/privacy" className="flex min-h-11 items-center px-2 font-bold text-navy hover:underline">
                개인정보처리방침
              </Link>
              <Link href="/terms" className="flex min-h-11 items-center px-2 text-navy hover:underline">
                이용안내
              </Link>
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center px-2 text-navy hover:underline">
                  Instagram
                </a>
              )}
              {social.threads && (
                <a href={social.threads} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center px-2 text-navy hover:underline">
                  Threads
                </a>
              )}
            </nav>
          </div>

          <div>
            <p className="text-base font-semibold text-navy">업무 기반</p>
            <AffiliationRows audience="personal" tone="footer" className="mt-2" />
            <AffiliationRows audience="business" tone="footer" />
          </div>
        </div>

        <div className="mt-8 space-y-2 border-t border-line pt-7 text-base leading-relaxed text-muted">
          {compliance.pageNotice.map((t) => (
            <p key={t}>{t}</p>
          ))}
          {compliance.affiliation && <p>{compliance.affiliation}</p>}
          <p className="pt-2">© 황진. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
