import { landingContent } from "@/content/landing";
import { Palco } from "@/components/ui/Palco";
import { SeloStatus } from "@/components/ui/SeloStatus";
import { FichaTecnica } from "@/components/ui/FichaTecnica";
import { Reveal } from "@/components/motion/Reveal";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Rascunho } from "@/components/spike/Rascunho";
import { ReplayVideo } from "./ReplayVideo";

/**
 * PRÉVIA [S1-B] (spike, sem portões): o capítulo do replay da PROPOSTA.md
 * §2.3–2.4. Só o replay (o estacionamento saiu); vídeo em 7 colunas e, em 5,
 * os selos, a frase, "Como funciona" (os 3 passos voltam, decisão do
 * Thiago), a ficha, o "Em breve" e o botão do piloto. Abaixo, o bloco
 * "Piloto gratuito", com as marcações de rascunho visíveis.
 */
export function Produtos() {
  const { title, replay } = landingContent.produtos;
  const { piloto } = replay;

  return (
    <section id="replay" className="section surface-space" aria-labelledby="replay-title">
      <div className="container">
        <Reveal className="section-head">
          <h2 id="replay-title" className="section-title">
            {title}
          </h2>
        </Reveal>

        <div className="produtos">
          <article className="produto" aria-labelledby="replay-title">
            <div>
              <Palco className="project-card__palco">
                <ReplayVideo video={replay.video} />
              </Palco>
              <div className="portfolio__meta">
                <p className="caption">{replay.video.caption}</p>
                <details>
                  <summary>{landingContent.aplicativos.videoDescriptionLinkLabel}</summary>
                  <p>{replay.video.description}</p>
                </details>
              </div>
            </div>
            <div className="produto__corpo">
              <div className="produto__selos">
                <SeloStatus status="piloto" />
                <span className="selo selo--conceito">{landingContent.heroEstudio.illustrationBadge}</span>
              </div>
              <p className="body-muted">{replay.oneLiner}</p>
              <h3 id="replay-passos-title" className="produto__passos-titulo">
                {replay.stepsTitle}
              </h3>
              <ol className="produto__passos" role="list" aria-labelledby="replay-passos-title">
                {replay.steps.map((step, index) => (
                  <li key={step.lead}>
                    <span className="produto__passo-num" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p>
                      <strong>{step.lead}</strong> {step.rest}
                    </p>
                  </li>
                ))}
              </ol>
              <FichaTecnica items={replay.specs} />
              <p className="produto__embreve">
                <SeloStatus status="emBreve" /> <span>{replay.emBreve}</span>
              </p>
              {/* v2.1 do Verbo: um botão só no capítulo, no fim do bloco do piloto. */}
            </div>
          </article>

          <article className="piloto" aria-labelledby="piloto-title">
            <h3 id="piloto-title" className="block-title">
              {piloto.title}
            </h3>
            <p className="body-muted piloto__intro">{piloto.intro}</p>
            <div className="piloto__listas">
              {[piloto.leva, piloto.precisa].map((lista) => (
                <div key={lista.title}>
                  <h4 className="piloto__lista-titulo">{lista.title}</h4>
                  <ul className="ruled-list" role="list">
                    {lista.items.map((item) => (
                      <li key={item}>
                        <Rascunho text={item} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="piloto__status">{piloto.status}</p>
            <p className="body-muted">
              <Rascunho text={piloto.fim} />
            </p>
            <div className="piloto__acao">
              <WhatsAppButton message={landingContent.whatsappMessages.replay}>{piloto.cta}</WhatsAppButton>
              <p className="caption">{piloto.ctaNote}</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
