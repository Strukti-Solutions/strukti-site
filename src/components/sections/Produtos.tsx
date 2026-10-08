import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { Palco } from "@/components/ui/Palco";
import { SeloStatus } from "@/components/ui/SeloStatus";
import { FichaTecnica } from "@/components/ui/FichaTecnica";
import { Reveal } from "@/components/motion/Reveal";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ReplayVideo } from "./ReplayVideo";

/**
 * Produtos de hardware (spec 2026-10-03 §4, seção 3): o replay em destaque,
 * com o vídeo de demonstração no palco (mesmo padrão dos aplicativos), e o
 * estacionamento em desenvolvimento.
 *
 * "Como funciona" e os 3 passos do replay (spec §4, linha 3) ficam no hero
 * "estudio", ao lado do giro (MASTER §9.7). Com os heros "video" e "classic",
 * que não têm os passos, eles voltam para o cartão do replay.
 */
export function Produtos() {
  const { title, intro, replay, estacionamento } = landingContent.produtos;
  const stepsInCard = siteConfig.heroVariant !== "estudio";

  return (
    <section id="produtos" className="section surface-space" aria-labelledby="produtos-title">
      <div className="container">
        <Reveal className="section-head">
          <h2 id="produtos-title" className="section-title">
            {title}
          </h2>
          <p className="lead">{intro}</p>
        </Reveal>

        <div className="produtos">
          <article className="produto" aria-labelledby="produto-replay-title">
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
                {/* O vídeo é animação do conceito: a spec §10 manda identificá-lo. */}
                <span className="selo selo--conceito">{landingContent.heroEstudio.illustrationBadge}</span>
              </div>
              <h3 id="produto-replay-title" className="block-title">
                {replay.name}
              </h3>
              <p className="body-muted">{replay.oneLiner}</p>
              {stepsInCard && (
                <>
                  {/* Só nos heros "video" e "classic", que saem na limpeza dos heros:
                      o estilo vai em linha para não trazer de volta CSS só deles. */}
                  <h4 id="produto-replay-passos-title" style={{ marginTop: "var(--space-5)", fontWeight: 600 }}>
                    {replay.stepsTitle}
                  </h4>
                  <ol
                    className="body-muted"
                    aria-labelledby="produto-replay-passos-title"
                    style={{ display: "grid", gap: "var(--space-2)", paddingLeft: "1.25em" }}
                  >
                    {replay.steps.map((step) => (
                      <li key={step.lead}>
                        <strong>{step.lead}</strong> {step.rest}
                      </li>
                    ))}
                  </ol>
                </>
              )}
              <FichaTecnica items={replay.specs} />
              <div className="produto__acoes">
                <WhatsAppButton message={landingContent.whatsappMessages.replay}>{replay.cta}</WhatsAppButton>
                {replay.siteUrl && (
                  <a href={replay.siteUrl} className="btn btn--outline">
                    {replay.siteLinkLabel}
                  </a>
                )}
              </div>
            </div>
          </article>

          <article className="produto" aria-labelledby="produto-estacionamento-title">
            <div className="produto__corpo">
              <SeloStatus status="desenvolvimento" />
              <h3 id="produto-estacionamento-title" className="block-title">
                {estacionamento.name}
              </h3>
              <p className="body-muted">{estacionamento.oneLiner}</p>
              <div className="produto__acoes">
                <WhatsAppButton message={landingContent.whatsappMessages.estacionamento}>
                  {estacionamento.cta}
                </WhatsAppButton>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
