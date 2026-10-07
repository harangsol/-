import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@/components/layout/analytics";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { StickyCta } from "@/components/layout/sticky-cta";
import { site, siteUrl, social } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: site.title, template: `%s | ${site.name}` },
  description: site.description,
  keywords: [...site.keywords],
  applicationName: site.name,
  authors: [{ name: site.person }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: site.locale,
    url: "/",
    siteName: site.name,
    title: site.title,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#f8f6f1",
  width: "device-width",
  initialScale: 1,
};


const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: site.name,
      description: site.description,
      inLanguage: "ko-KR",
    },
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: site.person,
      description: "보험, 연금, 퇴직연금, 투자를 하나의 그림으로 정리하도록 돕는 개인금융 상담",
      knowsAbout: ["개인 금융", "보험 점검", "연금", "퇴직연금", "노후 준비", "자산관리"],
      url: siteUrl,
      ...(social.instagram || social.threads
        ? { sameAs: [social.instagram, social.threads].filter(Boolean) }
        : {}),
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <head>
        {/* 사이트 문구 전용 폰트 서브셋 하나만 미리 불러온다 (scripts/build-site-font.py) */}
        <link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/pretendard-site.woff2" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      </head>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only z-50 rounded bg-navy px-4 py-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          본문으로 바로가기
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <StickyCta />
        <Analytics />
      </body>
    </html>
  );
}
