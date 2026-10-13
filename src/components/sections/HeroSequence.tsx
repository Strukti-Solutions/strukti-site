import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { HeroSequenceScroller } from "./HeroSequenceScroller";

export type HeroOpcao = "a" | "b" | "c";

/**
 * PRÉVIA v2.2 [S1-B] (spike): hero de marca, com as 3 opções do Verbo
 * (landing-copy-v2.2 §2) escolhidas por ?hero=a|b|c (sem a chave, a B). O
 * visual é o símbolo montado pelo fio (?fio=costura). Botão "Ver os
 * produtos" (âncora #produtos) e o link do WhatsApp com a mensagem geral.
 */
export function HeroSequence({ opcao = "b" }: { opcao?: HeroOpcao }) {
  const { primaryCta, whatsappCta, illustrationBadge } = landingContent.heroEstudio;
  const { eyebrow, headline, body } = landingContent.heroOpcoes[opcao];

  return (
    <HeroSequenceScroller
      badge={illustrationBadge}
      stepsTitle=""
      steps={[]}
      opening={
        <>
          <p className="hero-estudio__eyebrow">{eyebrow}</p>
          <h1 id="hero-title" className="hero-estudio__title">
            {headline}
          </h1>
          <p className="lead">{body}</p>
          <div className="hero-estudio__actions">
            <a href="#produtos" className="btn btn--primary">
              {primaryCta}
            </a>
            <a
              href={siteConfig.whatsapp.linkWithMessage(landingContent.whatsappMessages.general)}
              className="hero-estudio__link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {whatsappCta}
            </a>
          </div>
        </>
      }
    />
  );
}
