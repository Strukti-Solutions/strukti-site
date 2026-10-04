import { landingContent } from "@/content/landing";
import { Reveal } from "@/components/motion/Reveal";

/**
 * "Como trabalhamos": título fixo + lista com régua (MASTER §8.5). Os itens
 * são etapas, em ordem (docs/landing-copy.md v2.0), por isso a lista é
 * ordenada; a régua continua sem números à mostra.
 */
export function ComoResolvemos() {
  const { title, intro, items } = landingContent.comoTrabalhamos;

  return (
    <section
      id="como-trabalhamos"
      className="section section--seam surface-paper"
      aria-labelledby="como-trabalhamos-title"
    >
      <div className="container">
        <div className="split">
          <Reveal className="split__aside">
            <h2 id="como-trabalhamos-title" className="section-title">
              {title}
            </h2>
            <p className="lead" style={{ marginTop: "var(--space-4)" }}>
              {intro}
            </p>
          </Reveal>
          <Reveal>
            <ol className="ruled-list">
              {items.map((item) => (
                <li key={item.title}>
                  <h3 className="block-title">{item.title}</h3>
                  <p className="body-muted">{item.description}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
