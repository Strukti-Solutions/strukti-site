import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ScrollExpandMedia } from "@/components/ui/scroll-expansion-hero";
import { HeroOpcaoTexto } from "@/components/spike/HeroOpcao";
import { HeroVideoClip, HeroVideoProvider, HeroVideoToggle } from "./HeroVideoMedia";

/**
 * Hero "expansao" (MASTER §9.8, ADR-010), o padrão: o `ScrollExpandMedia`
 * (componente MIT adaptado, src/components/ui/scroll-expansion-hero.tsx) com
 * a mídia "Fim de expediente" (siteConfig.heroExpansao) e o texto do
 * `landingContent.heroExpansao`. Com a roda ou o toque, o quadro do vídeo
 * cresce até quase a tela inteira, o fundo se apaga e o título se abre para
 * os lados; com a expansão completa, aparece o conteúdo (o texto aprovado do
 * hero de marca da v2.2 e os dois botões) e a página volta a rolar. Sem
 * JavaScript ou com reduced motion, fica a composição parada, com o conteúdo
 * logo abaixo.
 *
 * O vídeo segue o mecanismo do hero "video" (MASTER §9.6): sem `autoplay`,
 * toca só pelo `HeroVideoProvider` e tem o controle de pausar (WCAG 2.2.2).
 * Os dois botões estão no HTML do servidor: sem JavaScript, o menu da barra
 * não abre abaixo de 75em, e o WhatsApp daqui é o caminho.
 *
 * A linha de apoio, o H2 e a frase são os da opção B do hero de marca
 * (landing-copy v2.2 §2); como no hero "estudio", ?hero=a ou ?hero=c troca
 * os três depois de montar (HeroOpcaoTexto), sem divergir na hidratação.
 */
export function HeroExpansao() {
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
