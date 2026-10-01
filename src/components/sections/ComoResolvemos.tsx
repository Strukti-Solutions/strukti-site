import { landingContent } from "@/content/landing";
import { Reveal } from "@/components/motion/Reveal";

export function ComoResolvemos() {
  const { title, intro, items } = landingContent.comoResolvemos;

  return (
    <section id="como-trabalhamos" className="section" aria-labelledby="como-trabalhamos-title">
      <div className="container">
        <Reveal>
          <h2 id="como-trabalhamos-title" className="section-title">
            {title}
          </h2>
          <p className="section-subtitle">{intro}</p>
          <ol
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: "1.25rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            }}
          >
            {items.map((item, index) => (
              <li key={item.title} style={{ display: "flex", gap: "1rem" }}>
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-petrol-800)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  {index + 1}
                </span>
                <div>
                  <h3
                    style={{
                      margin: "0 0 0.35rem",
                      fontSize: "1.05rem",
                      color: "var(--color-petrol-900)",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p style={{ margin: 0, color: "var(--color-ink-muted)" }}>{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
