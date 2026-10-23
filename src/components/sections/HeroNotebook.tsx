import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ScrollExpandMedia } from "@/components/ui/scroll-expansion-hero";
import { HeroOpcaoTexto } from "@/components/spike/HeroOpcao";
import { AparelhoCinza } from "./AparelhoCinza";
import { HeroVideoClip, HeroVideoProvider, HeroVideoToggle } from "./HeroVideoMedia";

/**
 * Hero "notebook" (protótipo da entrada pelo notebook, spec
 * 2026-10-23-hero-entrada-notebook-design.md): o `HeroExpansao` com o modo
 * `entrada` do `ScrollExpandMedia` ligado. Depois da expansão até a tela
 * cheia, há uma pausa e a câmera se aproxima da tela de um aparelho (aqui as
 * caixas cinza do `AparelhoCinza`, notebook deitado ou celular em pé) até
 * ela virar a página; a rolagem para cima desfaz o caminho.
 *
 * Mesmas props, mesma mídia, mesmo provedor de vídeo, mesmos filhos (o h2, a
 * frase, "Ver produtos" e o WhatsApp) e o mesmo `id="inicio"` do
 * `HeroExpansao`: a tela do aparelho é o bloco de chamada de sempre
 * (`.hero-expansao__conteudo`), então o texto e os botões não mudam. Fica
 * como cópia, e não como prop do `HeroExpansao`, para a variante "expansao"
 * (em produção) seguir intacta enquanto o dono afina os números da cena; a
 * fase de arte decide se as duas viram uma só.
 */
export function HeroNotebook() {
  const { titleLines, hint, mediaAlt, videoPause, videoPlay, primaryCta, whatsappCta } = landingContent.heroExpansao;
  const { fundo, midia } = siteConfig.heroExpansao;
  const portrait = "(orientation: portrait)";

  return (
    <HeroVideoProvider>
      <ScrollExpandMedia
        id="inicio"
        className="surface-space"
        titleId="hero-title"
        title={titleLines}
        date={<HeroOpcaoTexto campo="eyebrow" />}
        scrollToExpand={hint}
        mediaLabel={mediaAlt}
        entrada={{ aparelho: <AparelhoCinza /> }}
        background={
          <picture>
            <source media={portrait} type="image/avif" srcSet={fundo.retratoAvif} />
            <source media={portrait} type="image/jpeg" srcSet={fundo.retratoJpg} />
            <source type="image/avif" srcSet={fundo.avif} />
            {/* Sem fetchpriority: o fundo cobre a tela inteira e não conta
                para o LCP; o LCP é o pôster do quadro (posterPriority), que
                não pode disputar banda com ele. */}
            <img
              className="hero-expansao__fundo-img"
              src={fundo.jpg}
              alt=""
              width={fundo.width}
              height={fundo.height}
              decoding="async"
            />
          </picture>
        }
        media={
          <HeroVideoClip
            clip={midia}
            posterClassName="hero-expansao__poster"
            videoClassName="hero-expansao__video"
            posterPriority
          />
        }
        mediaControl={<HeroVideoToggle labels={{ videoPause, videoPlay }} className="hero-expansao__toggle" />}
      >
        <h2 className="hero-expansao__chamada">
          <HeroOpcaoTexto campo="headline" />
        </h2>
        <p className="lead">
          <HeroOpcaoTexto campo="body" />
        </p>
        <div className="hero-expansao__acoes">
          <a href="#produtos" className="btn btn--primary">
            {primaryCta}
          </a>
          <WhatsAppButton message={landingContent.whatsappMessages.general}>{whatsappCta}</WhatsAppButton>
        </div>
      </ScrollExpandMedia>
    </HeroVideoProvider>
  );
}
