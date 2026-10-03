import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { landingContent } from "@/content/landing";

// Cor "espaço" (--color-navy-950, design-system/strukti-solucoes/MASTER.md
// §2) — a mesma do `viewport.themeColor` em layout.tsx e do fundo do
// opengraph-image. `icon.svg` já existe (app/icon.svg); como é vetorial,
// "any" serve para qualquer tamanho sem gerar PNGs novos.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.brand,
    short_name: siteConfig.brand,
    description: landingContent.seo.description,
    start_url: "/",
    display: "standalone",
    background_color: "#08121d",
    theme_color: "#08121d",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
