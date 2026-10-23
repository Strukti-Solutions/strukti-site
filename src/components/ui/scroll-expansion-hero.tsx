"use client";

/**
 * Componente de terceiro, licença MIT (ADR-005 e ADR-010, docs/DECISOES.md).
 * Origem: "Scroll Expansion Hero" (`ScrollExpandMedia`), de Arunachalam
 * (@arunachalam), 21st.dev.
 * https://21st.dev/@arunachalam/components/scroll-expansion-hero
 * Licença conferida em 15/10/2026. A página de origem publica a licença MIT
 * e o autor (nome e perfil), sem ano nem arquivo de licença; o aviso abaixo
 * usa o nome e o perfil do autor como estão lá. Cópia também em
 * THIRD_PARTY_NOTICES.md.
 *
 * MIT License
 *
 * Copyright (c) Arunachalam (@arunachalam, 21st.dev)
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
 * a do original, com os números dele menos os ganhos (ver "Mais lenta" e
 * "Roda de mouse suave" abaixo): progresso p de 0 a 1; a roda soma deltaY ×
 * 0,0007 (o original: 0,0009); o toque soma deltaY × 0,0039 para expandir e
 * × 0,0062 para recolher (o original: 0,005 e 0,008); expandido, roda para
 * cima (ou arrasto de mais de 20 px para baixo) com scrollY ≤ 5 recolhe; o
 * conteúdo aparece em p = 1 e some abaixo de 0,75; o quadro vai de 300 × 400 a 1550 × 800 px (950 × 600 abaixo de
 * 768 px), até 95vw × 85vh (e nunca sob a barra fixa, ver abaixo); o fundo
 * some (1 − p); o título e as legendas se abrem p × 150vw (180vw abaixo de
 * 768 px). Mudanças:
 * - Mais lenta (23/10/2026, a pedido do dono, para o hero durar mais na
 *   tela): os ganhos da roda e do toque divididos por 1,3, ~30% mais rolagem
 *   para expandir em todos os meios: 1429 px de roda em vez de 1111 (15
 *   cliques de 100 px em vez de 12), 256 px de arrasto em vez de 200. O
 *   recolher do toque segue 1,6 × mais rápido que o expandir, como no
 *   original. O teclado não mudou (seta 0,1, página 0,34): são passos
 *   discretos, com transição, e já pedem 10 setas ou 3 páginas.
 * - Roda de mouse suave (23/10/2026): um clique de roda (deltaY de ~100 px)
 *   pulava 9 a 11% do progresso num quadro só, enquanto o trackpad e o toque
 *   mandam passos pequenos e já pareciam contínuos. O clique agora move um
 *   progresso-alvo, e um requestAnimationFrame leva o progresso desenhado
 *   até ele por suavização exponencial no tempo (fator 1 − e^(−dt/τ), τ =
 *   120 ms: ~2/3 do caminho em 120 ms e 95% em 360 ms, perto do que a
 *   rolagem suave do navegador faz com um clique, e curto o bastante para
 *   uma roda girada depressa, com cliques a cada 30 a 80 ms, virar um
 *   movimento só). Cada clique novo redireciona do ponto atual. Trackpad e
 *   toque seguem diretos, somando ao desenhado e ao alvo ao mesmo tempo (sem
 *   salto ao alternar no meio de uma animação). Expandir (e soltar a
 *   página), mostrar e esconder o conteúdo seguem o desenhado, não o alvo:
 *   a página não rola com o quadro ainda crescendo. Teclado e saltos ("key"
 *   e "auto", com a transição do CSS) cancelam a animação da roda.
 * - Sem framer-motion (ADR-002) e sem motion: tudo o que mudava com p virou
 *   CSS. O p vai para a propriedade `--hx-p` da seção, escrita num
 *   requestAnimationFrame (com `data-progress`, 2 casas), e as fórmulas do
 *   original (largura, altura, deslize, opacidade do fundo e da sombra)
 *   ficam em `calc()` no globals.css ("Hero expansao"); as transições do
 *   original (0,1 s no fundo, 0,2 s na sombra, 0,7 s no conteúdo) são
 *   `transition` do CSS, e os números do celular vêm de uma media query
 *   (`max-width: 47.99em`), sem `innerWidth` em estado nem ouvinte de resize.
 *   As legendas (linha de apoio e dica) descem com `translate` (a altura do
 *   quadro + 16 px) em vez de seguir o quadro no fluxo: os mesmos pixels,
 *   sem deslocamento de layout (CLS) a cada passo da roda.
 * - Altura máxima do quadro: min(85svh, 100svh − 2 × a barra do topo) no
 *   lugar de 85vh, para o quadro nunca passar sob a barra fixa (que o
 *   original não tinha). Age nas telas com menos de ~787 px de altura
 *   (abaixo de 1200 px de largura, barra de 56 + 3 px) ou de ~840 px (de
 *   1200 px para cima, 60 + 3 px): a 1366 × 768, o quadro expandido fica com
 *   642 px de altura em vez de 653; a 740 × 360, com 242 em vez de 306 (o
 *   cartão de p = 0 também).
 * - Ouvintes registrados uma vez, lendo refs (o original os recriava a cada
 *   mudança do progresso e lia valores velhos); eventos do DOM tipados, sem
 *   `as unknown as EventListener`; `touches[0]` conferido
 *   (noUncheckedIndexedAccess). A roda e o `touchmove`, os únicos não
 *   passivos (por causa do `preventDefault`), saem da window com a página
 *   expandida e rolada além de uma tela e voltam antes de ela chegar ao topo
 *   (o original os deixava a visita inteira, atrasando toda rolagem).
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
 *   O portão acompanha o prefers-reduced-motion ao vivo: ligar no meio da
 *   visita solta a página na hora, e a roda, o toque e as teclas ainda
 *   conferem a preferência na hora do evento.
 * - Teclado enquanto preso (foco no body ou dentro do hero, fora de campos):
 *   seta ±0,1, Page Down/Up e Espaço ±0,34 (Shift + Espaço sobe), End/Home;
 *   expandido no topo, as teclas para cima recolhem, como a roda. Com Alt,
 *   Ctrl, Meta ou Shift (seleção de texto, navegação por cursor) e com o
 *   painel do menu da barra aberto, as teclas ficam com o navegador. Foco em
 *   qualquer coisa do hero, menos o controle do vídeo e a própria mídia,
 *   completa a expansão; a mídia não recebe clique (`pointer-events: none`,
 *   como no original), então um clique no quadro não a foca nem expande.
 * - Roda: `deltaMode` normalizado (linhas × 16 px, páginas × innerHeight),
 *   Ctrl + roda (zoom) e roda só de lado (deltaY 0: o gesto de voltar e
 *   avançar do trackpad) ignorados, `preventDefault` só quando cancelável e o
 *   painel aberto do menu da barra rola normalmente. Toque: um dedo só
 *   (pinça é zoom), `touchstart` passivo, `touchcancel` tratado; a rolagem
 *   que o navegador fizer durante uma pinça (e até 300 ms depois) não
 *   completa a expansão. Com a página ampliada (`visualViewport.scale` > 1),
 *   roda e toque são do navegador.
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
import { REDUCED_MOTION_QUERY, useCanAnimate } from "@/lib/motion";

/** Roda: progresso por pixel de deltaY (original: 0,0009; ÷ 1,3, mais lenta). */
const WHEEL_GAIN = 0.0007;
/** Toque: progresso por pixel arrastado para expandir e para recolher (original: 0,005 e 0,008; ÷ 1,3). */
const TOUCH_GAIN_FORWARD = 0.0039;
const TOUCH_GAIN_BACK = 0.0062;
/**
 * Roda de mouse: um passo de |deltaY| a partir disto (em px) é um clique, e
 * anima; abaixo, é trackpad, e anda na hora. Chrome e Edge mandam 100 a 120
 * px por clique (mais com escala de tela), o Firefox manda linhas (deltaMode
 * 1, ver `isWheelNotch`); o trackpad manda muitos passos de 1 a ~30 px. Um
 * arremesso rápido no trackpad pode passar de 40 px e ganhar a suavização:
 * só um atraso curto, sem salto.
 */
const WHEEL_NOTCH_PX = 40;
/** Roda de mouse: constante de tempo da suavização (o desenhado anda 1 − e^(−dt/τ) do que falta). */
const WHEEL_SMOOTH_TAU_MS = 120;
/**
 * Mais perto do alvo do que isto, o desenhado encosta nele e a animação para
 * (0,004 ≈ 5 px de crescimento, invisível). Encurta a cauda exponencial: de
 * 0,99 a 1 são ~110 ms, e não ~360 ms com a página presa e o quadro já pronto.
 */
const WHEEL_SMOOTH_SNAP = 0.004;
/** O 1º quadro de uma animação (sem quadro anterior para medir) vale 1/60 s. */
const FIRST_FRAME_MS = 1000 / 60;
/** Um quadro mais longo do que isso (aba em segundo plano, engasgo) conta só isto. */
const MAX_FRAME_MS = 100;
/** O conteúdo aparece em p = 1 e some abaixo disto (original). */
const CONTENT_HIDE_BELOW = 0.75;
/** "No topo", para recolher (original: scrollY ≤ 5). */
const TOP_SLOP_PX = 5;
/** Arrasto para baixo, no topo, que recolhe (original: mais de 20 px). */
const TOUCH_COLLAPSE_PX = 20;
/** Teclado: uma seta e uma página. */
const KEY_LINE = 0.1;
const KEY_PAGE = 0.34;
/** `deltaMode` 1 (linhas, Firefox): px por linha. */
const WHEEL_LINE_PX = 16;
/** Depois de uma pinça, a rolagem que o navegador fizer ainda é dele por este tempo. */
const MULTI_TOUCH_GRACE_MS = 300;
/** Página ampliada (pinça) acima desta escala: roda e toque são do navegador. */
const ZOOMED_SCALE = 1.01;

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

/** Progresso válido: de 0 a 1, arredondado na 6ª casa (sem a deriva do ponto flutuante). */
function clampProgress(value: number) {
  // 10 × 0,1 dá 0,999…, e a 10ª seta não expandiria. Imperceptível na roda e no toque.
  return Math.min(Math.max(Math.round(value * 1e6) / 1e6, 0), 1);
}

/**
 * Clique de roda de mouse (anda em degraus, e anima) ou passo de trackpad
 * (contínuo, direto)? Em linhas ou páginas (`deltaMode` 1 ou 2: o Firefox
 * com mouse) é clique; em pixels, a partir de `WHEEL_NOTCH_PX`.
 */
function isWheelNotch(deltaMode: number, deltaYPx: number) {
  return deltaMode !== 0 || Math.abs(deltaYPx) >= WHEEL_NOTCH_PX;
}

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

/** A página está ampliada (pinça)? Aí a roda e o toque movem a lupa, não o hero. */
function pageZoomed() {
  return (window.visualViewport?.scale ?? 1) > ZOOMED_SCALE;
}

/** Passo da tecla: ± fração, ±Infinity (End/Home) ou `null` (não é nossa). */
function keyStep(event: KeyboardEvent): number | null {
  // Shift + seta, Home ou End estende a seleção (e move o cursor da
  // navegação por cursor, F7); só o Shift + Espaço é "subir uma página".
  if (event.shiftKey && event.key !== " ") return null;
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
  /**
   * Linha de apoio abaixo do quadro (o `date` do original); vai para a
   * esquerda. Aceita um nó: o hero da home troca o texto pela opção do ?hero=.
   */
  date?: ReactNode;
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
  // O progresso desenhado (o que está no --hx-p e manda nos estados) e o
  // alvo da roda de mouse, que o desenhado persegue. Parados, são iguais.
  const progressRef = useRef(0);
  const targetRef = useRef(0);
  // A animação da roda de mouse: o quadro pedido e a hora do último.
  const smoothFrameRef = useRef<number | null>(null);
  const smoothLastTimeRef = useRef<number | null>(null);
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

  /**
   * Muda o progresso desenhado: pinta (no próximo quadro, ou já, de dentro
   * de um) e faz os efeitos de estado, que seguem o desenhado. Em p = 1 o
   * alvo também vai a 1: expandido, nada mais puxa o quadro de volta.
   */
  const draw = useCallback(
    (next: number, paintNow = false) => {
      const progress = clampProgress(next);
      progressRef.current = progress;
      if (paintNow) paint();
      else if (!paintScheduled.current) {
        paintScheduled.current = true;
        requestAnimationFrame(paint);
      }
      if (progress >= 1) {
        targetRef.current = 1;
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

  /** Para a animação da roda de mouse (o desenhado fica onde está). */
  const stopSmooth = useCallback(() => {
    if (smoothFrameRef.current !== null) cancelAnimationFrame(smoothFrameRef.current);
    smoothFrameRef.current = null;
    smoothLastTimeRef.current = null;
  }, []);

  /** Teclado e saltos: desenhado e alvo vão juntos ao valor (a transição é do CSS). */
  const setProgress = useCallback(
    (next: number, input: Extract<ProgressInput, "key" | "auto">) => {
      stopSmooth();
      const section = sectionRef.current;
      if (section) section.dataset.input = input;
      const progress = clampProgress(next);
      targetRef.current = progress;
      draw(progress);
    },
    [draw, stopSmooth],
  );

  /**
   * Trackpad e toque: soma na hora ao desenhado e ao alvo. Parado, é o
   * passo direto; no meio de uma animação da roda, o que faltava continua
   * faltando (sem salto e sem atraso).
   */
  const nudgeProgress = useCallback(
    (delta: number, input: Extract<ProgressInput, "wheel" | "touch">) => {
      const section = sectionRef.current;
      if (section) section.dataset.input = input;
      targetRef.current = clampProgress(targetRef.current + delta);
      draw(progressRef.current + delta);
    },
    [draw],
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

    // A preferência na hora do evento: entre a pessoa ligar o reduced motion
    // e o React desligar a expansão (o useCanAnimate acompanha ao vivo), nada
    // é segurado.
    const reduceQuery = typeof window.matchMedia === "function" ? window.matchMedia(REDUCED_MOTION_QUERY) : null;
    const motionReduced = () => reduceQuery?.matches === true;
    // Dedos na tela agora e até quando a rolagem ainda é da pinça.
    let touchCount = 0;
    let multiTouchUntil = 0;
    // A roda e o touchmove (não passivos) estão na window?
    let holding = false;

    /** Um quadro da animação da roda de mouse: anda 1 − e^(−dt/τ) do que falta. */
    const smoothStep = (time: number) => {
      smoothFrameRef.current = null;
      if (!armedRef.current) {
        smoothLastTimeRef.current = null;
        return;
      }
      const last = smoothLastTimeRef.current;
      const dt = last === null ? FIRST_FRAME_MS : Math.min(Math.max(time - last, 0), MAX_FRAME_MS);
      smoothLastTimeRef.current = time;
      const target = targetRef.current;
      const gap = target - progressRef.current;
      const factor = 1 - Math.exp(-dt / WHEEL_SMOOTH_TAU_MS);
      draw(Math.abs(gap) <= WHEEL_SMOOTH_SNAP ? target : progressRef.current + gap * factor, true);
      if (progressRef.current === targetRef.current) smoothLastTimeRef.current = null;
      else smoothFrameRef.current = requestAnimationFrame(smoothStep);
    };

    /** Clique de roda de mouse: move o alvo; o desenhado segue do ponto em que está. */
    const aimProgress = (delta: number) => {
      section.dataset.input = "wheel";
      targetRef.current = clampProgress(targetRef.current + delta);
      if (smoothFrameRef.current === null) smoothFrameRef.current = requestAnimationFrame(smoothStep);
    };

    armedRef.current = true;
    expandedRef.current = false;
    setArmed(true);

    const onWheel = (event: WheelEvent) => {
      // deltaY antes do deltaMode: o Firefox passa a medir em linhas se o
      // deltaMode for lido primeiro.
      const deltaY = event.deltaY;
      // Só de lado (o gesto de voltar e avançar do trackpad) ou zoom: é do navegador.
      if (deltaY === 0 || event.ctrlKey || insideOpenMenu(event.target) || motionReduced() || pageZoomed()) return;
      const deltaMode = event.deltaMode;
      const scale = deltaMode === 1 ? WHEEL_LINE_PX : deltaMode === 2 ? window.innerHeight : 1;
      const delta = deltaY * scale;
      if (expandedRef.current) {
        if (delta < 0 && window.scrollY <= TOP_SLOP_PX) {
          if (event.cancelable) event.preventDefault();
          unexpand();
        }
        return;
      }
      // Segura até o desenhado chegar a 1 (expandedRef): com o quadro ainda
      // crescendo para o alvo, a página não rola.
      if (event.cancelable) event.preventDefault();
      if (isWheelNotch(deltaMode, delta)) aimProgress(delta * WHEEL_GAIN);
      else nudgeProgress(delta * WHEEL_GAIN, "wheel");
    };

    /** Conta os dedos; com dois ou mais (pinça), a rolagem fica com o navegador por um tempo. */
    const noteTouches = (event: TouchEvent) => {
      const count = event.touches.length;
      if (count >= 2 || touchCount >= 2) multiTouchUntil = performance.now() + MULTI_TOUCH_GRACE_MS;
      touchCount = count;
    };

    const onTouchStart = (event: TouchEvent) => {
      noteTouches(event);
      const touch = event.touches.length === 1 ? event.touches[0] : undefined;
      touchStartRef.current = touch && !insideOpenMenu(event.target) ? touch.clientY : null;
    };

    const onTouchMove = (event: TouchEvent) => {
      noteTouches(event);
      const start = touchStartRef.current;
      const touch = event.touches[0];
      if (start === null || !touch || event.touches.length !== 1 || motionReduced() || pageZoomed()) return;
      const delta = start - touch.clientY;
      if (expandedRef.current) {
        if (delta < -TOUCH_COLLAPSE_PX && window.scrollY <= TOP_SLOP_PX) {
          if (event.cancelable) event.preventDefault();
          unexpand();
        }
        return;
      }
      if (event.cancelable) event.preventDefault();
      nudgeProgress(delta * (delta < 0 ? TOUCH_GAIN_BACK : TOUCH_GAIN_FORWARD), "touch");
      touchStartRef.current = touch.clientY;
    };

    const onTouchEnd = (event: TouchEvent) => {
      noteTouches(event);
      touchStartRef.current = null;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
      // Com o painel do menu aberto, a página fica com o navegador (como a roda).
      if (motionReduced() || document.querySelector(OPEN_MENU_SELECTOR)) return;
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
      // Do alvo: no meio de uma animação da roda, a tecla parte de onde ela ia.
      setProgress(step === Infinity ? 1 : step === -Infinity ? 0 : targetRef.current + step, "key");
    };

    /**
     * A roda e o touchmove só ficam na window enquanto podem agir: preso, ou
     * expandido até uma tela abaixo do topo. Recolher pede scrollY ≤ 5, e a
     * rolagem até lá passa por aqui antes (o scroll é passivo e fica sempre).
     */
    const syncHoldListeners = () => {
      const needed = !expandedRef.current || window.scrollY <= window.innerHeight;
      if (needed === holding) return;
      holding = needed;
      if (needed) {
        window.addEventListener("wheel", onWheel, { passive: false });
        window.addEventListener("touchmove", onTouchMove, { passive: false });
      } else {
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("touchmove", onTouchMove);
      }
    };

    // Preso, roda e toque não rolam a página: uma rolagem aqui veio de outra
    // coisa (âncora, barra de rolagem, busca, foco). Completa, sem voltar.
    // Menos durante uma pinça (e logo depois): o zoom arrasta a página uns
    // pixels, e o título que a pessoa amplia não pode sair de lado.
    const onScroll = () => {
      const pinching = touchCount >= 2 || performance.now() < multiTouchUntil;
      if (!expandedRef.current && window.scrollY > 0 && !pinching) setProgress(1, "auto");
      syncHoldListeners();
    };

    const onHashChange = () => {
      if (!expandedRef.current && hashTargetOutside(section)) setProgress(1, "auto");
    };

    // Página já rolada (posição restaurada) ou âncora fora do hero: começa
    // expandido, sem prender.
    setProgress(window.scrollY > 0 || hashTargetOutside(section) ? 1 : 0, "auto");
    syncHoldListeners();
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onHashChange);
      // De volta ao estado parado (ex.: a pessoa ligou o reduced motion).
      stopSmooth();
      armedRef.current = false;
      expandedRef.current = false;
      progressRef.current = 0;
      targetRef.current = 0;
      touchStartRef.current = null;
      section.style.removeProperty("--hx-p");
      section.dataset.progress = "0.00";
      delete section.dataset.input;
      setArmed(false);
      setExpanded(false);
      setContentShown(true);
    };
  }, [canAnimate, draw, nudgeProgress, setProgress, stopSmooth, unexpand]);

  // Foco dentro do hero (Tab até um botão do conteúdo, leitor de tela):
  // completa a expansão, para nada focado ficar invisível. Ficam de fora o
  // controle do vídeo (dá para pausar sem expandir) e a própria mídia (o
  // `<video tabindex="-1">`, que está à vista em p = 0).
  const onFocus = (event: FocusEvent<HTMLElement>) => {
    if (!armedRef.current || expandedRef.current) return;
    const target = event.target;
    if (target instanceof HTMLMediaElement || (target instanceof Element && target.closest(CONTROL_SELECTOR))) return;
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
