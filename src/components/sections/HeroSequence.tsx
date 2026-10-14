import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { HeroTextos } from "@/components/spike/HeroOpcao";
import { HeroSequenceScroller } from "./HeroSequenceScroller";

/**
 * PRÉVIA v2.2 [S1-B] (spike): hero de marca, com as 3 opções do Verbo
 * (landing-copy v2.2 §2): a B no servidor; ?hero=a|c troca depois de montar. O
 * visual é o símbolo montado pelo fio (?fio=costura). Botão "Ver os
 * produtos" (âncora #produtos) e o link do WhatsApp com a mensagem geral.
 */
export function HeroSequence() {
  const { primaryCta, whatsappCta, illustrationBadge } = landingContent.heroEstudio;

  return (
    <HeroSequenceScroller
      badge={illustrationBadge}
      stepsTitle=""
      steps={[]}
      opening={
        <>
          <HeroTextos />
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
