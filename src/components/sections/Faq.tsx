import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { LinkedText } from "@/components/LinkedText";

export function Faq() {
  const { title, items, closing, button } = landingContent.faq;

  return (
    <section id="duvidas" className="section" aria-labelledby="duvidas-title">
      <div className="container" style={{ maxWidth: "760px" }}>
        <h2 id="duvidas-title" className="section-title">
          {title}
        </h2>

        <div style={{ display: "grid", gap: "0.75rem", marginBottom: "2rem" }}>
          {items.map((item) => (
            <details
              key={item.question}
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "0.5rem",
                padding: "0.9rem 1.1rem",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 600,
                  color: "var(--color-petrol-900)",
                }}
              >
                {item.question}
              </summary>
              <p style={{ margin: "0.75rem 0 0", color: "var(--color-ink-muted)" }}>
                {"answerLinkLabel" in item && item.answerLinkLabel ? (
                  <LinkedText text={item.answer} linkLabel={item.answerLinkLabel} href="/privacidade" />
                ) : (
                  item.answer
                )}
              </p>
            </details>
          ))}
        </div>

        <p style={{ color: "var(--color-ink-muted)", marginBottom: "1.25rem" }}>{closing}</p>
        <WhatsAppButton message={landingContent.whatsappMessages.general}>{button}</WhatsAppButton>
      </div>
    </section>
  );
}
