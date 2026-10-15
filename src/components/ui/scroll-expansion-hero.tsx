"use client";

/**
 * Componente de terceiro, licença MIT (ADR-005 e ADR-010, docs/DECISOES.md).
 * Origem: "Scroll Expansion Hero" (`ScrollExpandMedia`), de @arunachalam,
 * 21st.dev.
 * https://21st.dev/@arunachalam/components/scroll-expansion-hero
 * Licença conferida em 15/10/2026. A página de origem publica a licença MIT
 * e o autor, sem ano nem arquivo de licença; o aviso abaixo usa o nome do
 * autor como está lá. Cópia também em THIRD_PARTY_NOTICES.md.
 *
 * MIT License
 *
 * Copyright (c) @arunachalam
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Adaptado ao projeto (MASTER §9.8). A animação para quem usa roda ou toque é
 * a do original, com os mesmos números: progresso p de 0 a 1; a roda soma
 * deltaY × 0,0009; o toque soma deltaY × 0,005 para expandir e × 0,008 para
 * recolher; expandido, roda para cima (ou arrasto de mais de 20 px para
 * baixo) com scrollY ≤ 5 recolhe; o conteúdo aparece em p = 1 e some abaixo
 * de 0,75; o quadro vai de 300 × 400 a 1550 × 800 px (950 × 600 abaixo de
 * 768 px), até 95vw × 85vh; o fundo some (1 − p); o título e as legendas se
 * abrem p × 150vw (180vw abaixo de 768 px). Mudanças:
 * - Sem framer-motion (ADR-002) e sem motion: tudo o que mudava com p virou
 *   CSS. O p vai para a propriedade `--hx-p` da seção, escrita num
 *   requestAnimationFrame (com `data-progress`, 2 casas), e as fórmulas do
 *   original (largura, altura, deslize, opacidade do fundo e da sombra)
 *   ficam em `calc()` no globals.css ("Hero expansao"); as transições do
 *   original (0,1 s no fundo, 0,2 s na sombra, 0,7 s no conteúdo) são
 *   `transition` do CSS, e os números do celular vêm de uma media query
 *   (`max-width: 47.99em`), sem `innerWidth` em estado nem ouvinte de resize.
 * - Ouvintes registrados uma vez, lendo refs (o original os recriava a cada
 *   mudança do progresso e lia valores velhos); eventos do DOM tipados, sem
 *   `as unknown as EventListener`; `touches[0]` conferido
 *   (noUncheckedIndexedAccess).
 * - Sem o `window.scrollTo(0, 0)` a cada rolagem: uma rolagem que o hero não
 *   causou (âncora da barra do topo, barra de rolagem, busca na página, foco
 *   num controle abaixo) completa a expansão em vez de voltar ao topo. Âncora
 *   na URL ao montar ou no `hashchange` também começa ou fica expandido. O
 *   único scroll programático é o do recolher, com `behavior: "instant"` (o
 *   html tem scroll-behavior: smooth).
 * - Estado parado (servidor, sem JavaScript, reduced motion, antes de
 *   montar): a composição de p = 0 (fundo, quadro de 300 × 400 com o pôster,
 *   título e linha de apoio) e o conteúdo logo abaixo, à vista; nada fica
 *   preso. Mesma árvore com e sem animação (ADR-004); só prende depois de
 *   montar, com `useCanAnimate()`, em scrollY = 0 e sem âncora fora do hero.
 * - Teclado enquanto preso (foco no body ou dentro do hero, fora de campos):
 *   seta ±0,1, Page Down/Up e Espaço ±0,34, End/Home; expandido no topo, as
 *   teclas para cima recolhem, como a roda. Foco em qualquer coisa do hero,
 *   menos o controle do vídeo, completa a expansão.
 * - Roda: `deltaMode` normalizado (linhas × 16 px, páginas × innerHeight),
 *   Ctrl + roda (zoom) ignorado, `preventDefault` só quando cancelável e o
 *   painel aberto do menu da barra rola normalmente. Toque: um dedo só
 *   (pinça é zoom), `touchstart` passivo, `touchcancel` tratado.
 * - Título: um H1 com as duas partes em `<span>` (o original tinha dois
 *   `<h2>`); sem `mix-blend-mode` (o `textBlend` saiu); cores do DS. O `date`
 *   é a linha de apoio; o `scrollToExpand` é a dica, `aria-hidden`, que só
 *   aparece quando a expansão de fato anda.
 * - Mídia por slots (`background`, `media`, `mediaControl`): sem next/image,
 *   sem o `<iframe>` do YouTube (CSP), sem `autoplay` (o vídeo segue a §9.6,
 *   `HeroVideoProvider`), sem a troca de `mediaType`; o quadro pode ter nome
 *   acessível (`mediaLabel`).
 * - A seção é o próprio hero (`id`, `aria-labelledby`, `data-hides-fab`) e
 *   expõe `data-pin`, `data-expanded`, `data-progress` e `data-content` para
 *   o CSS, os testes e o check:browser; `overflow-x: clip` no lugar de
 *   `overflow-x-hidden` (que vira caixa de rolagem); classes BEM do site no
 *   lugar das do Tailwind (sem preflight aqui); sem bloco de conteúdo vazio;
 *   export nomeado.
 */

import { useCallback, useEffect, useRef, useState, type FocusEvent, type ReactNode } from "react";
import { useCanAnimate } from "@/lib/motion";

/** Roda: progresso por pixel de deltaY (original: 0,0009). */
const WHEEL_GAIN = 0.0009;
/** Toque: progresso por pixel arrastado para expandir e para recolher (original). */
const TOUCH_GAIN_FORWARD = 0.005;
const TOUCH_GAIN_BACK = 0.008;
/** O conteúdo aparece em p = 1 e some abaixo disto (original). */
const CONTENT_HIDE_BELOW = 0.75;
/** "No topo", para recolher (original: scrollY ≤ 5). */
const TOP_SLOP_PX = 5;
/** Arrasto para baixo, no topo, que recolhe (original: 20 px). */
const TOUCH_COLLAPSE_PX = 20;
/** Teclado: uma seta e uma página. */
const KEY_LINE = 0.1;
const KEY_PAGE = 0.34;
/** `deltaMode` 1 (linhas, Firefox): px por linha. */
const WHEEL_LINE_PX = 16;

/** O que mudou o progresso por último (`data-input`: o CSS anima "key" e "auto"). */
type ProgressInput = "wheel" | "touch" | "key" | "auto";

/** Onde a tecla é da própria página: campos, controles que usam setas, mídia com controles. */
const FIELD_SELECTOR = [
  "input",
  "textarea",
  "select",
  "[contenteditable='']",
  "[contenteditable='true']",
  "[role='textbox']",
  "[role='combobox']",
  "[role='listbox']",
  "[role='slider']",
  "[role='spinbutton']",
  "video[controls]",
  "audio[controls]",
].join(", ");

/** Onde o Espaço aciona o controle em foco (não rola). */
const SPACE_ACTIVATES_SELECTOR =
  "button, summary, [role='button'], [role='checkbox'], [role='switch'], [role='tab'], [role='menuitem']";

/** O painel aberto do menu da barra do topo rola sozinho (abaixo de 75em). */
const OPEN_MENU_SELECTOR = ".topbar[data-open='true'] .topbar__nav";

/** Fica de fora do "foco completa a expansão": o controle do vídeo. */
const CONTROL_SELECTOR = ".hero-expansao__controle";

/** O alvo da âncora da URL (ex.: /#contato) existe e fica fora do hero? */
function hashTargetOutside(section: HTMLElement) {
  const hash = window.location.hash.slice(1);
  if (!hash) return false;
  let id = hash;
  try {
    id = decodeURIComponent(hash);
  } catch {
    // Âncora mal codificada: procura como veio.
  }
  const target = document.getElementById(id);
  return target !== null && !section.contains(target);
}

function insideOpenMenu(target: EventTarget | null) {
  return target instanceof Element && target.closest(OPEN_MENU_SELECTOR) !== null;
}

/** Passo da tecla: ± fração, ±Infinity (End/Home) ou `null` (não é nossa). */
function keyStep(event: KeyboardEvent): number | null {
  switch (event.key) {
    case "ArrowDown":
      return KEY_LINE;
    case "ArrowUp":
      return -KEY_LINE;
    case "PageDown":
      return KEY_PAGE;
    case "PageUp":
      return -KEY_PAGE;
    case " ":
      return event.shiftKey ? -KEY_PAGE : KEY_PAGE;
    case "End":
      return Infinity;
    case "Home":
      return -Infinity;
    default:
      return null;
  }
}

/** A tecla vale para o hero: foco no body ou dentro dele, fora de campos. */
function keyBelongsToHero(event: KeyboardEvent, section: HTMLElement) {
  const target = event.target;
  if (!(target instanceof Element) || target === document.body || target === document.documentElement) return true;
  if (!section.contains(target) || target.closest(FIELD_SELECTOR)) return false;
  return !(event.key === " " && target.closest(SPACE_ACTIVATES_SELECTOR));
}

export interface ScrollExpandMediaProps {
  /** id da seção (o hero da home usa "inicio"). */
  id?: string;
  /** Classes a mais na seção (ex.: a superfície "surface-space"). */
  className?: string;
  /** id do H1, para o `aria-labelledby` da seção. */
  titleId: string;
  /** As duas partes do H1: a 1ª se abre para a esquerda, a 2ª para a direita. */
  title: readonly [string, string];
  /** Linha de apoio abaixo do quadro (o `date` do original); vai para a esquerda. */
  date?: string;
  /** Dica abaixo do quadro (o `scrollToExpand` do original); vai para a direita. */
  scrollToExpand?: string;
  /** Fundo decorativo, que some com a expansão (ex.: um `<picture>` com alt=""). */
  background: ReactNode;
  /** O que fica dentro do quadro que cresce (ex.: pôster e vídeo). */
  media: ReactNode;
  /** Nome acessível do quadro (role="img"); sem ele, o quadro é decorativo. */
  mediaLabel?: string;
  /** Controle do vídeo, no canto do palco; focar nele não expande. */
  mediaControl?: ReactNode;
  /** O conteúdo que aparece com a expansão completa (o `children` do original). */
  children?: ReactNode;
}

export function ScrollExpandMedia({
  id,
  className,
  titleId,
  title,
  date,
  scrollToExpand,
  background,
  media,
  mediaLabel,
  mediaControl,
  children,
}: ScrollExpandMediaProps) {
  const canAnimate = useCanAnimate();
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const armedRef = useRef(false);
  const expandedRef = useRef(false);
  const touchStartRef = useRef<number | null>(null);
  // Há pintura agendada? Uma flag, e não o id: o stub dos testes chama o
  // callback antes de o requestAnimationFrame devolver (como no
  // HeroSequenceScroller).
  const paintScheduled = useRef(false);
  // Ligado = a expansão anda com roda, toque e teclado (só depois de montar).
  const [armed, setArmed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [contentShown, setContentShown] = useState(true);

  const paint = useCallback(() => {
    paintScheduled.current = false;
    const section = sectionRef.current;
    if (!section || !armedRef.current) return;
    const progress = progressRef.current;
    section.style.setProperty("--hx-p", String(progress));
    // Duas casas; "1.00" só com a expansão completa.
    section.dataset.progress = (progress >= 1 ? 1 : Math.min(progress, 0.99)).toFixed(2);
  }, []);

  const setProgress = useCallback(
    (next: number, input: ProgressInput) => {
      const section = sectionRef.current;
      if (section) section.dataset.input = input;
      const progress = Math.min(Math.max(next, 0), 1);
      progressRef.current = progress;
      if (!paintScheduled.current) {
        paintScheduled.current = true;
        requestAnimationFrame(paint);
      }
      if (progress >= 1) {
        if (!expandedRef.current) {
          expandedRef.current = true;
          setExpanded(true);
        }
        setContentShown(true);
      } else if (progress < CONTENT_HIDE_BELOW) {
        setContentShown(false);
      }
    },
    [paint],
  );

  /** Recolhe (o progresso fica em 1 até a próxima roda, como no original). */
  const unexpand = useCallback(() => {
    expandedRef.current = false;
    setExpanded(false);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (!canAnimate) return;
    const section = sectionRef.current;
    if (!section) return;

    armedRef.current = true;
    expandedRef.current = false;
    setArmed(true);
    // Página já rolada (posição restaurada) ou âncora fora do hero: começa
    // expandido, sem prender.
    setProgress(window.scrollY > 0 || hashTargetOutside(section) ? 1 : 0, "auto");

    const onWheel = (event: WheelEvent) => {
      // deltaY antes do deltaMode: o Firefox passa a medir em linhas se o
      // deltaMode for lido primeiro.
      const deltaY = event.deltaY;
      if (event.ctrlKey || insideOpenMenu(event.target)) return;
      const scale = event.deltaMode === 1 ? WHEEL_LINE_PX : event.deltaMode === 2 ? window.innerHeight : 1;
      const delta = deltaY * scale;
      if (expandedRef.current) {
        if (delta < 0 && window.scrollY <= TOP_SLOP_PX) {
          if (event.cancelable) event.preventDefault();
          unexpand();
        }
        return;
      }
      if (event.cancelable) event.preventDefault();
      setProgress(progressRef.current + delta * WHEEL_GAIN, "wheel");
    };

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches.length === 1 ? event.touches[0] : undefined;
      touchStartRef.current = touch && !insideOpenMenu(event.target) ? touch.clientY : null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const start = touchStartRef.current;
      const touch = event.touches[0];
      if (start === null || !touch || event.touches.length !== 1) return;
      const delta = start - touch.clientY;
      if (expandedRef.current) {
        if (delta < -TOUCH_COLLAPSE_PX && window.scrollY <= TOP_SLOP_PX) {
          if (event.cancelable) event.preventDefault();
          unexpand();
        }
        return;
      }
      if (event.cancelable) event.preventDefault();
      setProgress(progressRef.current + delta * (delta < 0 ? TOUCH_GAIN_BACK : TOUCH_GAIN_FORWARD), "touch");
      touchStartRef.current = touch.clientY;
    };

    const onTouchEnd = () => {
      touchStartRef.current = null;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
      const step = keyStep(event);
      if (step === null || !keyBelongsToHero(event, section)) return;
      if (expandedRef.current) {
        if (step < 0 && window.scrollY <= TOP_SLOP_PX) {
          event.preventDefault();
          unexpand();
        }
        return;
      }
      event.preventDefault();
      setProgress(step === Infinity ? 1 : step === -Infinity ? 0 : progressRef.current + step, "key");
    };

    // Preso, roda e toque não rolam a página: uma rolagem aqui veio de outra
    // coisa (âncora, barra de rolagem, busca, foco). Completa, sem voltar.
    const onScroll = () => {
      if (!expandedRef.current && window.scrollY > 0) setProgress(1, "auto");
    };

    const onHashChange = () => {
      if (!expandedRef.current && hashTargetOutside(section)) setProgress(1, "auto");
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onHashChange);
      // De volta ao estado parado (ex.: a pessoa ligou o reduced motion).
      armedRef.current = false;
      expandedRef.current = false;
      progressRef.current = 0;
      touchStartRef.current = null;
      section.style.removeProperty("--hx-p");
      section.dataset.progress = "0.00";
      delete section.dataset.input;
      setArmed(false);
      setExpanded(false);
      setContentShown(true);
    };
  }, [canAnimate, setProgress, unexpand]);

  // Foco dentro do hero (Tab até um botão do conteúdo, leitor de tela):
  // completa a expansão, para nada focado ficar invisível. O controle do
  // vídeo fica de fora: dá para pausar sem expandir.
  const onFocus = (event: FocusEvent<HTMLElement>) => {
    if (!armedRef.current || expandedRef.current) return;
    if (event.target instanceof Element && event.target.closest(CONTROL_SELECTOR)) return;
    setProgress(1, "auto");
  };

  const pinned = armed && !expanded;
  const frameA11y = mediaLabel ? { role: "img", "aria-label": mediaLabel } : { "aria-hidden": true };

  return (
    <section
      ref={sectionRef}
      id={id}
      className={className ? `hero-expansao ${className}` : "hero-expansao"}
      aria-labelledby={titleId}
      data-hides-fab=""
      data-pin={pinned ? "true" : "false"}
      data-expanded={expanded ? "true" : "false"}
      // Valor do servidor e do 1º render; depois de montar, quem escreve é o
      // requestAnimationFrame (o React não volta a mexer: o valor aqui não muda).
      data-progress="0.00"
      data-content={!armed || contentShown ? "visible" : "hidden"}
      onFocus={onFocus}
    >
      <div className="hero-expansao__palco">
        <div className="hero-expansao__fundo" aria-hidden="true">
          {background}
        </div>

        <div className="hero-expansao__titulo">
          <h1 id={titleId}>
            <span className="hero-expansao__linha hero-expansao__linha--1">{title[0]}</span>{" "}
            <span className="hero-expansao__linha hero-expansao__linha--2">{title[1]}</span>
          </h1>
        </div>

        <div className="hero-expansao__midia">
          <div className="hero-expansao__quadro" {...frameA11y}>
            {media}
            <div className="hero-expansao__sombra" />
          </div>
          {(date || scrollToExpand) && (
            <div className="hero-expansao__legendas">
              {date && <p className="hero-expansao__data">{date}</p>}
              {scrollToExpand && (
                <p className="hero-expansao__dica" aria-hidden="true">
                  {scrollToExpand}
                </p>
              )}
            </div>
          )}
        </div>

        {mediaControl && <div className="hero-expansao__controle">{mediaControl}</div>}
      </div>

      {children ? (
        <div className="hero-expansao__conteudo">
          <div className="container">{children}</div>
        </div>
      ) : null}
    </section>
  );
}
