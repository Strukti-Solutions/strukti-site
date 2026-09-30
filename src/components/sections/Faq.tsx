import { landingContent } from "@/content/landing";

export function Faq() {
  const { title, items } = landingContent.faq;

  return (
    <section id="faq" className="section" aria-labelledby="faq-title">
      <div className="container" style={{ maxWidth: "760px" }}>
        <h2 id="faq-title" className="section-title">
          {title}
        </h2>

        <div style={{ display: "grid", gap: "0.75rem" }}>
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
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
