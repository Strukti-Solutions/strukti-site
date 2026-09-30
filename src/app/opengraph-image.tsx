import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { landingContent } from "@/content/landing";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = landingContent.seo.ogImageAlt;

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
          backgroundColor: "#0b2e38",
          padding: "80px",
        }}
      >
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
            color: "#e6eef0",
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
