import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { landingContent } from "@/content/landing";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = landingContent.seo.ogImageAlt;

// Imagem gerada no build. Cores e símbolo do design system v2
// (design-system/strukti-solucoes/MASTER.md): fundo "espaço", texto branco
// e navy-200, símbolo na versão para fundo escuro.
const symbol = readFileSync(join(process.cwd(), "public/brand/strukti-simbolo-fundo-escuro.svg"));
const symbolSrc = `data:image/svg+xml;base64,${symbol.toString("base64")}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: "#08121d",
          padding: "80px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse só aceita <img> */}
        <img src={symbolSrc} width={98} height={120} alt="" style={{ marginBottom: 40 }} />
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: 24,
          }}
        >
          {siteConfig.brand}
        </div>
        <div
          style={{
            fontSize: 34,
            color: "#bfcedc",
            maxWidth: 880,
            lineHeight: 1.35,
          }}
        >
          {landingContent.rodape.tagline}
        </div>
      </div>
    ),
    { ...size },
  );
}
