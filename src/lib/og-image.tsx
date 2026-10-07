import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { profile } from "@/config/site";

/**
 * 공유용 OG 이미지 렌더러.
 * - 홈: src/app/opengraph-image.tsx, 점검: src/app/check/opengraph-image.tsx
 * - 미리보기/다운로드: /og-image?preset=home|check
 * 문구를 바꾸려면 OG_PRESETS 만 수정한다. (폰트는 KS X 1001 한글 2,350자 서브셋)
 */

export const OG_SIZE = { width: 1200, height: 630 };

export const OG_PRESETS = {
  home: {
    eyebrow: `금융 현장 ${profile.careerYears}년, 황진`,
    title: "잘 벌고, 잘 쓰고,\n오래 잘 살기.",
    sub: "대출 · 보험 · 연금 · 퇴직연금 · 투자\n뭐부터 볼지 함께 정리합니다.",
    alt: "황진 — 잘 벌고, 잘 쓰고, 오래 잘 살기.",
  },
  check: {
    eyebrow: "황진의 1분 금융점검",
    title: "내 돈, 무엇부터\n봐야 할까?",
    sub: "질문 9개 · 약 1분 · 이름과 연락처 없이\n지금 먼저 확인해볼 영역을 알려드려요.",
    alt: "1분 금융점검 — 내 돈, 무엇부터 봐야 할까?",
  },
} as const;

export type OgPreset = keyof typeof OG_PRESETS;

const fontsPromise = Promise.all([
  readFile(join(process.cwd(), "src/assets/fonts/Pretendard-Bold-ksx.otf")),
  readFile(join(process.cwd(), "src/assets/fonts/Pretendard-Medium-ksx.otf")),
]);

export async function renderOgImage(preset: OgPreset) {
  const p = OG_PRESETS[preset];
  const [bold, medium] = await fontsPromise;
  const rows = [
    { when: "지금", what: "비상자금부터", on: true },
    { when: "다음", what: "대출 금리·만기", on: false },
    { when: "나중", what: "보장 겹침 정리", on: false },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f8f6f1",
          fontFamily: "Pretendard",
          padding: "72px 80px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 700 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 500, color: "#3e7c49" }}>{p.eyebrow}</div>
            <div
              style={{
                marginTop: 28,
                fontSize: 82,
                fontWeight: 700,
                color: "#17243a",
                lineHeight: 1.2,
                letterSpacing: "-0.04em",
                whiteSpace: "pre-wrap",
              }}
            >
              {p.title}
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 500, color: "#4a4f4d", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{p.sub}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 300,
              background: "#ffffff",
              border: "2px solid #e2ddd2",
              borderRadius: 10,
              padding: "26px 28px",
              boxShadow: "0 30px 50px -30px rgba(23,36,58,0.5)",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: "#17243a", paddingBottom: 14, borderBottom: "2px solid #e2ddd2" }}>
              내 돈, 순서 정리
            </div>
            {rows.map((r) => (
              <div key={r.when} style={{ display: "flex", alignItems: "center", padding: "16px 0", borderBottom: "1px dashed #e2ddd2" }}>
                <div style={{ width: 64, fontSize: 24, fontWeight: 700, color: r.on ? "#3e7c49" : "#5b6578" }}>{r.when}</div>
                <div style={{ fontSize: 22, fontWeight: 500, color: "#232323" }}>{r.what}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Pretendard", data: bold, weight: 700, style: "normal" },
        { name: "Pretendard", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
