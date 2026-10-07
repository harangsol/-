import { OG_PRESETS, OG_SIZE, renderOgImage } from "@/lib/og-image";

export const alt = OG_PRESETS.check.alt;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage("check");
}
