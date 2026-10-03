import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { siteConfig } from "@/config/site";

// `/api/diagnostico` fica de fora de propósito: é rota de API, não página
// (robots.ts já bloqueia a indexação dela).
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/privacidade`,
      lastModified: siteConfig.privacyPolicyVersion,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
