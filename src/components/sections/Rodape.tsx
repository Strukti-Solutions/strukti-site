import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";

export function Rodape() {
  const { tagline, whatsappLabel, emailLabel, location, privacyLinkLabel } = landingContent.rodape;
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
          gap: "1.5rem",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <p style={{ fontWeight: 700, color: "var(--color-petrol-900)", margin: "0 0 0.35rem" }}>
            {siteConfig.brand}
          </p>
          <p style={{ margin: 0, color: "var(--color-ink-muted)", fontSize: "0.9rem", maxWidth: "40ch" }}>
            {tagline}
          </p>
        </div>

        <div style={{ fontSize: "0.9rem", color: "var(--color-ink-muted)" }}>
          <p style={{ margin: "0 0 0.35rem" }}>
            {whatsappLabel}{" "}
            <a
              href={siteConfig.whatsapp.linkWithMessage(landingContent.whatsappMessages.general)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--color-petrol-700)", textDecoration: "underline" }}
            >
              {siteConfig.whatsapp.number}
            </a>
          </p>
          <p style={{ margin: "0 0 0.35rem" }}>
            {emailLabel}{" "}
            <a href={`mailto:${siteConfig.email}`} style={{ color: "var(--color-petrol-700)", textDecoration: "underline" }}>
              {siteConfig.email}
            </a>
          </p>
          <p style={{ margin: 0 }}>{location}</p>
        </div>

        <div>
          <a
            href="/privacidade"
            style={{ color: "var(--color-petrol-700)", fontSize: "0.9rem", textDecoration: "underline" }}
          >
            {privacyLinkLabel}
          </a>
          <p style={{ margin: "0.75rem 0 0", color: "var(--color-ink-muted)", fontSize: "0.85rem" }}>
            © {year} {siteConfig.brand}
          </p>
        </div>
      </div>
    </footer>
  );
}
