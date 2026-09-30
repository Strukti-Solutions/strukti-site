import { siteConfig } from "@/config/site";
import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export function Header() {
  const { nav, whatsappButton } = landingContent.header;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          paddingBlock: "0.85rem",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--color-petrol-900)" }}>
          {siteConfig.brand}
        </span>

        <nav aria-label="Principal" className="header-nav">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{ color: "var(--color-ink-muted)", fontWeight: 500, textDecoration: "none" }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <WhatsAppButton message={landingContent.whatsappMessages.general}>
          {whatsappButton}
        </WhatsAppButton>
      </div>
    </header>
  );
}
