import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";

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
                  <AnswerWithPrivacyLink text={item.answer} linkLabel={item.answerLinkLabel} />
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

function AnswerWithPrivacyLink({ text, linkLabel }: { text: string; linkLabel: string }) {
  const index = text.indexOf(linkLabel);
  if (index === -1) {
    return <>{text}</>;
  }

  const before = text.slice(0, index);
  const after = text.slice(index + linkLabel.length);

  return (
    <>
      {before}
      <a href="/privacidade" style={{ color: "var(--color-petrol-700)", textDecoration: "underline" }}>
        {linkLabel}
      </a>
      {after}
    </>
  );
}
