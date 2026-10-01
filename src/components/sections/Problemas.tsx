import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Reveal, RevealStaggerList, RevealStaggerItem } from "@/components/motion/Reveal";

export function Problemas() {
  const { title, items, closing, button } = landingContent.problemas;

  return (
    <section id="problemas" className="section section--alt" aria-labelledby="problemas-title">
      <div className="container">
        <Reveal>
          <h2 id="problemas-title" className="section-title">
            {title}
          </h2>
        </Reveal>
        <RevealStaggerList
          style={{
            listStyle: "none",
            margin: "0 0 2rem",
            padding: 0,
            display: "grid",
            gap: "1.25rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          {items.map((item) => (
            <RevealStaggerItem
              key={item.title}
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "0.75rem",
                padding: "1.5rem",
              }}
            >
              <h3
                style={{
                  margin: "0 0 0.5rem",
                  fontSize: "1.1rem",
                  color: "var(--color-petrol-900)",
                }}
              >
                {item.title}
              </h3>
              <p style={{ margin: 0, color: "var(--color-ink-muted)" }}>{item.description}</p>
            </RevealStaggerItem>
          ))}
        </RevealStaggerList>
        <Reveal>
          <p style={{ color: "var(--color-ink-muted)", marginBottom: "1.25rem" }}>{closing}</p>
          <WhatsAppButton message={landingContent.whatsappMessages.general}>{button}</WhatsAppButton>
        </Reveal>
      </div>
    </section>
  );
}
