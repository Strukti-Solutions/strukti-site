import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Reveal, RevealStaggerList, RevealStaggerItem } from "@/components/motion/Reveal";

/** Parede de blocos (MASTER §8.4): sem ícone e sem número — não é sequência. */
export function Problemas() {
  const { title, items, closing, button } = landingContent.problemas;

  return (
    <section id="problemas" className="section surface-paper" aria-labelledby="problemas-title">
      <div className="container">
        <Reveal className="section-head">
          <h2 id="problemas-title" className="section-title">
            {title}
          </h2>
        </Reveal>
        <RevealStaggerList className="wall wall--3">
          {items.map((item) => (
            <RevealStaggerItem key={item.title} className="block">
              <h3 className="block-title">{item.title}</h3>
              <p className="body-muted">{item.description}</p>
            </RevealStaggerItem>
          ))}
        </RevealStaggerList>
        <Reveal className="section-actions">
          <p className="body-muted">{closing}</p>
          <WhatsAppButton message={landingContent.whatsappMessages.general}>{button}</WhatsAppButton>
        </Reveal>
      </div>
    </section>
  );
}
