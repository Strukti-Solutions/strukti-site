import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export function Hero() {
  const { eyebrow, headline, subheadline, primaryCta, secondaryCta } = landingContent.hero;

  return (
    <section className="section" aria-labelledby="hero-title">
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
            maxWidth: "20ch",
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
          {subheadline}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <a
            href="#diagnostico"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.85rem 1.5rem",
              borderRadius: "999px",
              backgroundColor: "var(--color-petrol-800)",
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none",
              minHeight: "48px",
            }}
          >
            {primaryCta}
          </a>
          <WhatsAppButton
            variant="outline"
            message="Olá! Vim pelo site da Strukti Soluções e gostaria de falar sobre o diagnóstico gratuito."
          >
            {secondaryCta}
          </WhatsAppButton>
        </div>
      </div>
    </section>
  );
}
