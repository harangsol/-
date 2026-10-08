import { OG_PRESETS, renderOgImage, type OgPreset } from "@/lib/og-image";

/** OG 이미지 미리보기·다운로드용. 예: /og-image?preset=check  (정해진 프리셋만 허용) */
export async function GET(request: Request) {
  const preset = new URL(request.url).searchParams.get("preset") ?? "home";
  if (!(preset in OG_PRESETS)) {
    return Response.json({ error: "unknown preset", presets: Object.keys(OG_PRESETS) }, { status: 404 });
  }
  return renderOgImage(preset as OgPreset);
}
