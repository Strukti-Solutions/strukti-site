import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export function Hero() {
  const { eyebrow, headline, body, primaryCta, secondaryCta, supportLine } = landingContent.hero;

  return (
    <section id="inicio" className="section" aria-labelledby="hero-title">
      <div className="container">
        <p
          style={{
            color: "var(--color-petrol-700)",
            fontWeight: 600,
            marginBottom: "0.75rem",
          }}
        >
          {eyebrow}
        </p>
        <h1
          id="hero-title"
          style={{
            fontSize: "2.25rem",
            lineHeight: 1.15,
            margin: "0 0 1rem",
            color: "var(--color-petrol-900)",
            maxWidth: "22ch",
          }}
        >
          {headline}
        </h1>
        <p
          style={{
            fontSize: "1.1rem",
            color: "var(--color-ink-muted)",
            maxWidth: "62ch",
            margin: "0 0 2rem",
          }}
        >
          {body}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <WhatsAppButton message={landingContent.whatsappMessages.general}>
            {primaryCta}
          </WhatsAppButton>
          <a
            href="#diagnostico"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.85rem 1.5rem",
              borderRadius: "999px",
              border: "2px solid var(--color-petrol-800)",
              color: "var(--color-petrol-800)",
              fontWeight: 600,
              textDecoration: "none",
              minHeight: "48px",
            }}
          >
            {secondaryCta}
          </a>
        </div>
        <p style={{ color: "var(--color-ink-muted)", fontSize: "0.95rem" }}>{supportLine}</p>
      </div>
    </section>
  );
}
