import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";

export function Rodape() {
  const { privacyNotice, privacyLinkLabel } = landingContent.rodape;
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: "1px solid var(--color-border)",
        backgroundColor: "var(--color-petrol-50)",
      }}
    >
      <div
        className="container"
        style={{
          paddingBlock: "2rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <p style={{ fontWeight: 700, color: "var(--color-petrol-900)", margin: "0 0 0.35rem" }}>
            {siteConfig.brand}
          </p>
          <p style={{ margin: 0, color: "var(--color-ink-muted)", fontSize: "0.9rem" }}>
            {siteConfig.email}
          </p>
        </div>

        <div style={{ maxWidth: "48ch" }}>
          <p style={{ margin: "0 0 0.35rem", color: "var(--color-ink-muted)", fontSize: "0.9rem" }}>
            {privacyNotice}
          </p>
          <a
            href="/privacidade"
            style={{ color: "var(--color-petrol-700)", fontSize: "0.9rem", textDecoration: "underline" }}
          >
            {privacyLinkLabel}
          </a>
        </div>

        <p style={{ margin: 0, color: "var(--color-ink-muted)", fontSize: "0.85rem" }}>
          © {year} {siteConfig.brand}
        </p>
      </div>
    </footer>
  );
}
