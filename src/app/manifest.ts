import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "황진 개인금융",
    description: site.description,
    start_url: "/",
    display: "browser",
    background_color: "#f8f6f1",
    theme_color: "#17243a",
    lang: "ko",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
