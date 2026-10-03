import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

// `/api/` fica fora da indexação (inclui `/api/diagnostico`): é rota de
// API, não página de conteúdo.
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
