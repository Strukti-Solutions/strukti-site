import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { Palco } from "@/components/ui/Palco";
import { SeloStatus } from "@/components/ui/SeloStatus";
import { FichaTecnica } from "@/components/ui/FichaTecnica";
import { Reveal } from "@/components/motion/Reveal";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { posterUrl } from "@/lib/heroSequence";

/**
 * Produtos de hardware (spec 2026-10-03 §4, seção 3): o replay em destaque,
 * num palco com o mesmo render do hero, e o estacionamento em desenvolvimento.
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
            <Palco className="produto__palco">
              <picture>
                <source type="image/avif" srcSet={posterUrl("desktop", "avif")} />
                <img src={posterUrl("desktop", "jpg")} alt="" width={1600} height={1000} loading="lazy" decoding="async" />
              </picture>
              <p className="selo selo--ilustracao">{landingContent.heroEstudio.illustrationBadge}</p>
            </Palco>
            <div className="produto__corpo">
              <SeloStatus status="piloto" />
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
