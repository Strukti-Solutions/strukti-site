"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { landingContent } from "@/content/landing";
import { useCanAnimate } from "@/lib/motion";
import { isUserVideoPlaying, subscribeToVideoPlayback } from "@/lib/videoCoordination";
import type { HeroVideoSource } from "@/config/site";

/** O que a pessoa escolheu no controle do vídeo; "auto" segue as regras abaixo. */
type Choice = "auto" | "play" | "pause";

interface HeroVideoState {
  videoRef: RefObject<HTMLVideoElement | null>;
  mounted: boolean;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  setChoice: (choice: Choice) => void;
}

const HeroVideoContext = createContext<HeroVideoState | null>(null);

function useHeroVideo() {
  const state = useContext(HeroVideoContext);
  if (!state) throw new Error("HeroVideoBackground e HeroVideoToggle ficam dentro de HeroVideoProvider.");
  return state;
}

/** `navigator.connection.saveData`: a pessoa pediu para economizar dados. */
function prefersSavingData() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

/**
 * Decide quando o vídeo de fundo toca (MASTER §9.6). A árvore é a mesma no
 * servidor e no cliente, com ou sem reduced motion (ADR-004): o `<video>`
 * sempre existe, sem `autoplay` e com `preload="none"`, e só o JavaScript
 * chama `play()`, depois de montar. Toca sozinho só com as cinco condições:
 * sem prefers-reduced-motion, sem "economizar dados", hero na tela, aba
 * visível e nenhum vídeo com `controls` (Rota de Vendas, Fleet Analytics BI)
 * tocando — só um vídeo toca por vez (MASTER §8.8), e quem a pessoa está
 * ouvindo não é interrompido pelo autoplay do hero (videoCoordination.ts).
 * `useSyncExternalStore` reavalia assim que um vídeo do portfólio começa ou
 * para (play/pause não borbulham, por isso a captura no documento); o
 * retrato do servidor é `false` (sem vídeo tocando), sem divergência de
 * hidratação. Com reduced motion, sem JavaScript ou antes de tocar, fica o
 * pôster. O controle (WCAG 2.2.2) manda acima disso: "Pausar" para de vez;
 * "Tocar" toca mesmo com reduced motion, porque foi a pessoa que pediu — o
 * vídeo é mudo, então pode tocar junto com um vídeo do portfólio.
 */
export function HeroVideoProvider({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canAnimate = useCanAnimate();
  const userVideoPlaying = useSyncExternalStore(subscribeToVideoPlayback, isUserVideoPlaying, () => false);
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [choice, setChoice] = useState<Choice>("auto");
  const [onScreen, setOnScreen] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    setMounted(true);
    const video = videoRef.current;
    if (!video) return;
    // Sem som, sempre. Vai por propriedade, não pelo atributo `muted` do
    // React: o atributo diverge entre o HTML do servidor e o cliente
    // (achado do teste de hidratação) e não vale para a política de autoplay.
    video.defaultMuted = true;
    video.muted = true;

    const onVisibility = () => setPageVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    const observer =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver((entries) => setOnScreen(entries.some((entry) => entry.isIntersecting)), {
            threshold: 0.05,
          })
        : null;
    if (observer) observer.observe(video);
    else setOnScreen(true);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const wanted =
      choice === "play" || (choice === "auto" && canAnimate && !prefersSavingData() && !userVideoPlaying);
    if (wanted && onScreen && pageVisible) {
      video.muted = true;
      video.play().catch(() => {
        // Navegador recusou (economia de energia, política): fica o pôster.
      });
    } else if (!video.paused) {
      video.pause();
    }
  }, [canAnimate, choice, onScreen, pageVisible, userVideoPlaying]);

  return (
    <HeroVideoContext.Provider value={{ videoRef, mounted, playing, setPlaying, setChoice }}>
      {children}
    </HeroVideoContext.Provider>
  );
}

/**
 * Pôster e vídeo, um sobre o outro, cobrindo a área do visual. O pôster é
 * um `<picture>` (AVIF com JPG de reserva, recorte em pé ou deitado), porque
 * o atributo `poster` do `<video>` não escolhe formato nem recorte. O vídeo
 * só aparece quando de fato está tocando; como o 1º quadro do loop é o
 * pôster, a troca não se nota.
 */
export function HeroVideoBackground({ video }: { video: HeroVideoSource }) {
  const { videoRef, playing, setPlaying } = useHeroVideo();
  const { landscape, portrait } = video;
  const portraitQuery = "(orientation: portrait)";

  return (
    <>
      <picture>
        <source media={portraitQuery} type="image/avif" srcSet={portrait.posterAvif} />
        <source media={portraitQuery} type="image/jpeg" srcSet={portrait.posterJpg} />
        <source type="image/avif" srcSet={landscape.posterAvif} />
        <img
          className="hero-video__poster"
          src={landscape.posterJpg}
          alt=""
          width={landscape.width}
          height={landscape.height}
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <video
        ref={videoRef}
        className="hero-video__video"
        data-playing={playing ? "true" : "false"}
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        disableRemotePlayback
        tabIndex={-1}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source media={portraitQuery} src={portrait.mp4} type="video/mp4" />
        <source src={landscape.mp4} type="video/mp4" />
      </video>
    </>
  );
}

/**
 * Controle do vídeo de fundo (WCAG 2.2.2: movimento automático de mais de
 * 5 s precisa poder parar). Só aparece depois de montar: sem JavaScript o
 * vídeo nem toca. O nome acessível diz o que o clique faz.
 */
export function HeroVideoToggle() {
  const { mounted, playing, setChoice } = useHeroVideo();
  const { videoPause, videoPlay } = landingContent.hero;
  const label = playing ? videoPause : videoPlay;

  return (
    <button
      type="button"
      className="hero-video__toggle"
      hidden={!mounted}
      aria-label={label}
      title={label}
      data-playing={playing ? "true" : "false"}
      onClick={() => setChoice(playing ? "pause" : "play")}
    >
      <span className="hero-video__toggle-icon" aria-hidden="true" />
    </button>
  );
}
