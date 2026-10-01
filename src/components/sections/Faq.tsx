import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { LinkedText } from "@/components/LinkedText";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Acordeão em parede (MASTER §8.10). No desktop, título e chamada para o
 * WhatsApp ficam à esquerda e as perguntas à direita; no celular, a chamada
 * vem depois das perguntas.
 */
export function Faq() {
  const { title, items, closing, button } = landingContent.faq;

  return (
    <section id="duvidas" className="section section--seam surface-paper" aria-labelledby="duvidas-title">
      <div className="container">
        <div className="faq">
          <Reveal className="faq__head">
            <h2 id="duvidas-title" className="section-title">
              {title}
            </h2>
          </Reveal>

          <Reveal className="faq__list">
            <div className="wall">
              {items.map((item) => (
                <details key={item.question} className="faq__item">
                  <summary>
                    {item.question}
                    <span className="faq__plus" aria-hidden="true" />
                  </summary>
                  <p className="faq__answer">
                    {"answerLinkLabel" in item && item.answerLinkLabel ? (
                      <LinkedText text={item.answer} linkLabel={item.answerLinkLabel} href="/privacidade" />
                    ) : (
                      item.answer
                    )}
                  </p>
                </details>
              ))}
            </div>
          </Reveal>

          <Reveal className="faq__cta section-actions" style={{ marginTop: 0 }}>
            <p className="body-muted">{closing}</p>
            <WhatsAppButton message={landingContent.whatsappMessages.general}>{button}</WhatsAppButton>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
