#!/usr/bin/env node
// Abre o site num navegador headless (Edge ou Chrome já instalados, sem
// dependência nova), em várias larguras, com prefers-reduced-motion ligado e
// desligado. Em cada caso rola a página do topo ao fim e falha (exit 1) se:
//   - em algum ponto da rolagem houver rolagem horizontal
//     (scrollWidth > clientWidth), ou
//   - o console do navegador registrar erro (ex.: hidratação divergente) ou
//     uma violação de Content-Security-Policy (fonte/imagem/mídia/script
//     bloqueado — revisão R1 do P3, achado da Crivo), ou
//   - a 360, 390, 1024, 1100 ou 1199px, o botão flutuante do WhatsApp (a.fab-whatsapp) cruzar a
//     caixa de um botão, campo ou qualquer controle focável visível, em
//     qualquer ponto da rolagem (regra aceita pelo Claudinho, proposta da
//     Crivo na revisão DS1 — 2ª vez que o FAB cobria conteúdo).
//
// Antes das larguras, um controle positivo (Q4) provoca de propósito uma
// violação de CSP e interrompe a checagem se o detector não a acusar — um
// detector cego também "passaria".
//
// Depois, lê a variante do hero no HTML servido (<main data-hero-variant>,
// de siteConfig.heroVariant). Com "estudio", confere a 1440×900 (lado a
// lado) e a 360×740 (celular, quadro em cima) que a rolagem troca o quadro
// do canvas (do 0 para outro) e que, com reduced motion, a animação não
// liga, nenhum quadro é desenhado e a seção fica com a mesma altura da
// página sem JavaScript (sem a altura extra de rolagem); falha se a seção
// .hero-estudio não existir. Com a animação, rola até #produtos (o destino
// de "Conhecer o replay") e falha se o fundo preso do hero ainda cobrir o
// topo de Produtos (pelo retângulo dele e pelo elementFromPoint, com o
// pointer-events do fundo ligado só durante a medida: o elementFromPoint
// ignora elementos com pointer-events: none). Com outra variante, avisa que
// pulou. Usa só os ganchos estáveis do hero (data-scrub, data-frame, o
// pôster e o fundo .hero-estudio__fundo), porque o desenho interno dele
// pode mudar.
//
// Com "expansao" (ScrollExpandMedia, MASTER §9.8, ADR-010), confere a
// 1440×900, 360×740 e 740×360 (celular deitado), em cinco passadas:
//   1. sem JavaScript: a composição parada (data-pin="false",
//      data-expanded="false", data-progress="0.00"), com fundo, quadro,
//      pôster e título à vista, sem a dica, e o conteúdo com os dois botões
//      legível e clicável; guarda a altura do hero;
//   2. roda do mouse (eventos de verdade do CDP, de 40 px, no meio da tela):
//      o progresso só sobe, o palco fica preso cobrindo a tela até expandir,
//      o quadro cresce de fato (área ≥ 1,3×; o atributo sozinho não basta),
//      as duas linhas do título e as legendas se abrem para os lados, o
//      fundo some, o conteúdo aparece, a altura do hero não muda; depois a
//      roda rola até Produtos (sem nada cobrindo o topo dela) e, de volta ao
//      topo, a roda para cima recolhe;
//   3. teclado com o foco no body: Page Down, Espaço (keyDown com texto " ")
//      e seta para baixo expandem e depois rolam a página; End expande e,
//      de novo, vai ao fim; Home recolhe;
//   4. âncoras: clica no link #produtos da barra fixa sem rolar antes (a
//      360, pelo Menu) e abre /#contato direto (passando por about:blank):
//      a página termina no alvo, sem voltar ao topo, e 1,5 s depois continua
//      lá;
//   5. reduced motion: nunca prende, a composição parada, a mesma altura da
//      página sem JavaScript, e a roda e o Page Down rolam a página.
// Só usa os ganchos estáveis do hero (data-pin, data-expanded,
// data-progress, data-content e as classes .hero-expansao__*).
//
// Com um hero que prende a rolagem, três conferências gerais poderiam
// "passar" sem conferir nada; por isso: a varredura das larguras falha se não
// chegar ao fim da página (um hero preso a deixaria no topo) — ela começa no
// topo com o hero preso e recolhido (a 1ª amostra) e segue pela regra do hero
// de que uma rolagem que ele não causou completa a expansão (e confere que
// completou); o foco num controle com opacidade efetiva abaixo de 0,5 conta
// como falha no Menu e no Tab pela página (o elementFromPoint acha elementos
// transparentes), depois de esperar as transições; e o 1.4.12 confere que a
// barra não cobre o quadro nem o título do hero "expansao". O Tab pela
// página passa pelo hero preso (o controle do vídeo, que não expande) e
// depende da regra de que o foco no conteúdo completa a expansão.
//
// Também roda, uma vez, num passo de interação (largura só do celular,
// onde o menu vira botão, reduced motion desligado): abre o menu do TopBar
// e sai com Tab, conferindo que o foco não fica coberto pelo painel; e toca
// os dois primeiros vídeos dos aplicativos (cartões 1 e 2 da grade),
// conferindo que só um toca por vez na página inteira (o vídeo do hero
// conta) e que o vídeo do hero ("video" ou "expansao", [data-hero-video]),
// se existir, nunca toca sozinho por cima (regra aceita pelo
// Claudinho, 2ª vez que um problema só aparecia depois de uma interação —
// MASTER §8.8, src/lib/videoCoordination.ts).
//
// E percorre a página inteira com Tab a 360, 390, 1024 e 1200px: a barra do
// topo é fixa e ocupa a largura toda (TB1), então nenhum controle focado pode
// parar embaixo dela, nem pela metade, nem coberto por outro elemento fixo.
// (No Chrome, a rolagem do foco centraliza o controle; o scroll-padding-top
// do globals.css cobre as âncoras do menu e os outros navegadores. A
// detecção foi conferida com um botão forçado para baixo da barra.)
//
// Por fim, aplica o espaçamento de texto da WCAG 1.4.12 (entrelinha 1,5,
// letras +0,12em, palavras +0,16em, parágrafo +2em) de 360 a 1440px —
// inclusive 1024–1110, onde o WhatsApp da barra ficava cortado (TB2) — e
// falha se um controle da barra (ou do painel do Menu aberto) sair da tela
// ou do container, se a barra cobrir a moldura do hero (ou o quadro e o
// título do hero "expansao", recolhido) ou se a página ganhar rolagem
// horizontal.
//
// Precisa do site no ar: `npm run dev` (ou `npm run start`) antes.
// Uso: npm run check:browser [-- http://localhost:3000]
// Navegador: detectado sozinho; ou defina BROWSER_PATH.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL_TO_CHECK = process.argv[2] ?? "http://localhost:3000/";
// 1199/1200: os dois lados do ponto da barra larga (75em, TB2).
const WIDTHS = [360, 390, 768, 950, 1024, 1100, 1145, 1199, 1200, 1280, 1440];
// 1024/1100/1199: desde a TB2 o FAB também existe entre 1024 e 1199px (abaixo
// do ponto da barra larga), ao lado das seções em duas e três colunas; 1024 é
// a primeira largura da grade de três colunas.
const FAB_CHECK_WIDTHS = new Set([360, 390, 1024, 1100, 1199]);
const VIEWPORT_HEIGHT = 900;
const STEP_TIMEOUT_MS = 90_000;
const INTERACTION_WIDTH = 360;
// 360/390: celular (regra do elemento fixo); 1024: hero lado a lado com o
// Menu; 1200: a barra larga, com os links.
const TAB_WALK_WIDTHS = [360, 390, 1024, 1200];
const TAB_WALK_MAX_STEPS = 200;
// WCAG 1.4.12: de 1024 a 1110px o WhatsApp da barra ficava cortado (TB2).
const TEXT_SPACING_WIDTHS = [360, 1024, 1060, 1110, 1199, 1200, 1280, 1440];
const TEXT_SPACING_CSS =
  "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } " +
  "p { margin-bottom: 2em !important; }";

// Pela estrutura, não pelo nome do projeto (que muda) — ver ProjectGrid.tsx.
// O vídeo do hero: o de fundo do hero "video" ou o do quadro do "expansao"
// (data-hero-video, HeroVideoClip).
const HERO_VIDEO_SELECTOR = "[data-hero-video], .hero-video__video";
const HERO_STUDIO_SELECTOR = ".hero-estudio";
const HERO_CANVAS_SELECTOR = ".hero-estudio__canvas";
const HERO_POSTER_SELECTOR = ".hero-estudio__poster";
const HERO_FUNDO_SELECTOR = ".hero-estudio__fundo";
// A seção logo depois do hero (destino de "Conhecer o replay").
const AFTER_HERO_SELECTOR = "#produtos";
// Hero "estudio": lado a lado (computador) e quadro em cima (celular).
const HERO_SIZES = [
  { width: 1440, height: 900 },
  { width: 360, height: 740 },
];
// Hero "expansao" (ScrollExpandMedia, MASTER §9.8): os ganchos estáveis.
const HERO_EXP_SELECTOR = ".hero-expansao";
const EXP_PALCO_SELECTOR = ".hero-expansao__palco";
const EXP_FUNDO_SELECTOR = ".hero-expansao__fundo";
const EXP_MIDIA_SELECTOR = ".hero-expansao__midia";
const EXP_TITULO_SELECTOR = ".hero-expansao__titulo";
const EXP_CONTEUDO_SELECTOR = ".hero-expansao__conteudo";
const EXP_DICA_SELECTOR = ".hero-expansao__dica";
// Computador, celular em pé e celular deitado (a tela baixa, onde o quadro
// expandido tem de parar antes da barra fixa).
const EXPANSAO_SIZES = [
  { width: 1440, height: 900 },
  { width: 360, height: 740 },
  { width: 740, height: 360 },
];
// Roda: muitos passos pequenos (40 px = 0,036 de progresso no original); o
// orçamento sobra para expandir (~28 eventos).
const EXP_WHEEL_DELTA = 40;
const EXP_WHEEL_BUDGET = 80;
const APPS_PLAY_BUTTON_SELECTOR = "#aplicativos .project-card__play";
// Cartão N da grade de aplicativos (o vídeo só existe depois do clique em "Assistir").
const appCard = (n) => `#aplicativos .project-card:nth-child(${n})`;

const BROWSER_CANDIDATES = [
  process.env.BROWSER_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const browserPath = BROWSER_CANDIDATES.find((candidate) => existsSync(candidate));
if (!browserPath) {
  console.error("Nenhum Edge/Chrome encontrado. Defina BROWSER_PATH com o caminho do executável.");
  process.exit(1);
}

try {
  const res = await fetch(URL_TO_CHECK);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
} catch (error) {
  console.error(`O site não respondeu em ${URL_TO_CHECK} (${error.message}). Suba o preview antes (npm run dev).`);
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function withTimeout(promise, label) {
  return Promise.race([
    promise,
    sleep(STEP_TIMEOUT_MS).then(() => {
      throw new Error(`tempo esgotado: ${label}`);
    }),
  ]);
}

const userDataDir = mkdtempSync(join(tmpdir(), "strukti-check-browser-"));
const browser = spawn(
  browserPath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

async function readDevToolsPort() {
  const portFile = join(userDataDir, "DevToolsActivePort");
  for (let attempt = 0; attempt < 100; attempt++) {
    if (existsSync(portFile)) {
      const [port] = readFileSync(portFile, "utf8").split("\n");
      if (port) return Number(port);
    }
    await sleep(100);
  }
  throw new Error("o navegador não abriu a porta de depuração");
}

function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    } else if (message.method) {
      for (const listener of listeners.get(message.method) ?? []) listener(message.params);
    }
  });

  const opened = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  return {
    opened,
    send(method, params = {}) {
      const id = nextId++;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    on(method, listener) {
      if (!listeners.has(method)) listeners.set(method, []);
      listeners.get(method).push(listener);
    },
    once(method) {
      return new Promise((resolve) => {
        const wrapped = (params) => {
          listeners.set(method, (listeners.get(method) ?? []).filter((l) => l !== wrapped));
          resolve(params);
        };
        this.on(method, wrapped);
      });
    },
    close() {
      socket.close();
    },
  };
}

// Roda dentro da página: rola do topo ao fim, sem rolagem suave, esperando
// o motion atualizar as transformações a cada passo, e devolve o pior caso,
// com os elementos mais externos que passam da borda direita naquele ponto.
const MEASURE_SCRIPT = `(async () => {
  const doc = document.documentElement;
  const settle = () => new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 40))));
  const describe = (el) => {
    let label = el.tagName.toLowerCase();
    if (el.id) label += "#" + el.id;
    const cls = typeof el.className === "string" ? el.className.trim().split(/\\s+/).slice(0, 2).join(".") : "";
    if (cls) label += "." + cls;
    const section = el.closest("section[id], header, footer");
    if (section && section !== el) label = (section.id ? "#" + section.id : section.tagName.toLowerCase()) + " > " + label;
    return label;
  };
  const offenders = () => {
    const limit = doc.clientWidth + 0.5;
    const all = [...document.body.querySelectorAll("*")].filter((el) => el.getBoundingClientRect().right > limit);
    return all.filter((el) => !all.includes(el.parentElement)).slice(0, 3).map(describe);
  };

  // Mesma definição de "controle focável" do FloatingWhatsApp.tsx — conferência
  // independente de que a caixa do FAB nunca cruza a de um controle (regra do
  // Claudinho, proposta da Crivo na revisão DS1).
  const FOCUSABLE_SELECTOR =
    'a[href], button, input:not([type="hidden"]), select, textarea, summary, video[controls], [tabindex]:not([tabindex="-1"])';
  const isBoxVisible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const s = getComputedStyle(el);
    return s.visibility !== "hidden" && s.display !== "none";
  };
  const rectsOverlap = (a, b) =>
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const fabOverlap = () => {
    const fab = document.querySelector("a.fab-whatsapp");
    if (!fab || !isBoxVisible(fab)) return null;
    const fabRect = fab.getBoundingClientRect();
    for (const el of document.querySelectorAll(FOCUSABLE_SELECTOR)) {
      if (el === fab || fab.contains(el) || !isBoxVisible(el)) continue;
      if (rectsOverlap(fabRect, el.getBoundingClientRect())) return describe(el);
    }
    return null;
  };

  const step = Math.max(150, Math.floor(innerHeight / 4));
  let worst = { overflow: 0, y: 0, offenders: [] };
  let fabHit = null;
  // Até onde a rolagem chegou de fato: um hero que segura a página (ou a
  // devolve ao topo) faria todas as amostras serem do topo, e a varredura
  // "passaria" sem conferir nada abaixo dele.
  let maxY = 0;
  for (let y = 0; y <= doc.scrollHeight; y += step) {
    window.scrollTo({ top: y, behavior: "instant" });
    await settle();
    maxY = Math.max(maxY, scrollY);
    const overflow = doc.scrollWidth - doc.clientWidth;
    if (overflow > worst.overflow) worst = { overflow, y: Math.round(scrollY), offenders: offenders() };
    if (!fabHit) {
      const hitWith = fabOverlap();
      if (hitWith) fabHit = { y: Math.round(scrollY), with: hitWith };
    }
  }
  // A última amostra fica no fim por um tempo (≥ 20 quadros, até ~1 s, até
  // parar): um hero que devolve a página ao topo com rolagem suave (o
  // scroll-behavior: smooth do html) ainda estaria a caminho na amostra de
  // 40 ms do laço, e o maxY sozinho não o pegaria.
  let endY = scrollY;
  for (let i = 0, stable = 0; i < 60 && (i < 20 || stable < 5); i++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (scrollY === endY) stable++;
    else { stable = 0; endY = scrollY; }
  }
  const maxScroll = Math.max(0, doc.scrollHeight - innerHeight);
  window.scrollTo({ top: 0, behavior: "instant" });
  return { ...worst, fabHit, maxY: Math.round(maxY), endY: Math.round(endY), maxScroll: Math.round(maxScroll), step };
})()`;

// Opacidade efetiva: a do elemento vezes a de cada ancestral (um pai com
// opacity: 0 some com os filhos, e o elementFromPoint acha elementos
// transparentes do mesmo jeito). display: none ou visibility: hidden = 0.
const EFFECTIVE_OPACITY_FN = `((el) => {
  let opacity = 1;
  for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.display === "none") return 0;
    opacity *= Number(style.opacity);
  }
  return getComputedStyle(el).visibility === "hidden" ? 0 : opacity;
})`;

// Espera (até "ms") a opacidade efetiva do elemento chegar a "min": o
// conteúdo do hero "expansao" entra com transição de 700 ms quando o foco
// completa a expansão; só conta como invisível se continuar apagado.
const SETTLED_OPACITY_FN = `(async (el, min, ms) => {
  const opacityOf = ${EFFECTIVE_OPACITY_FN};
  const end = performance.now() + ms;
  let opacity = opacityOf(el);
  while (opacity < min && performance.now() < end) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    opacity = opacityOf(el);
  }
  return opacity;
})`;
// Abaixo disto, um controle focado conta como invisível.
const FOCUS_MIN_OPACITY = 0.5;

// O foco atual fica coberto por outro elemento (ex.: um painel fixo que não
// fechou)? Mesma ideia do fabOverlap acima, mas pelo ponto central do
// elemento focado contra o que está de fato visível ali (elementFromPoint).
// Também diz se o controle focado está invisível (opacidade efetiva abaixo de
// FOCUS_MIN_OPACITY depois das transições): o elementFromPoint acha
// elementos transparentes, então "não coberto" não quer dizer "à vista".
const FOCUS_COVERED_EXPR = `(async () => {
  const active = document.activeElement;
  if (!active || active === document.body) return { active: null, covered: false };
  const r = active.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return { active: active.tagName, covered: false };
  const cx = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1);
  const cy = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
  const atPoint = document.elementFromPoint(cx, cy);
  const covered = !(atPoint === active || active.contains(atPoint) || (atPoint && atPoint.contains(active)));
  const label = active.tagName.toLowerCase() + (active.className ? "." + String(active.className).trim().split(/\\s+/)[0] : "");
  const opacity = await ${SETTLED_OPACITY_FN}(active, ${FOCUS_MIN_OPACITY}, 1200);
  return { active: label, covered, invisible: opacity < ${FOCUS_MIN_OPACITY}, opacity: Math.round(opacity * 100) / 100 };
})()`;

// Depois de um Tab: espera a rolagem que o foco provoca assentar (com ou sem
// scroll-behavior: smooth) e diz se o controle focado ficou sob a barra fixa
// do topo (o ponto do meio da borda de cima é da barra) ou coberto no centro
// por outro elemento. O que está dentro da própria barra não conta.
const FOCUS_VS_TOPBAR_EXPR = `(async () => {
  let last = -1;
  let stable = 0;
  // Pelo menos ~200 ms: o skip link entra com transição de 150 ms.
  for (let i = 0; i < 90 && (i < 12 || stable < 3); i++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (scrollY === last) stable++;
    else { stable = 0; last = scrollY; }
  }
  const active = document.activeElement;
  if (!active || active === document.body) return { active: null };
  const cls = typeof active.className === "string" ? active.className.trim().split(/\\s+/)[0] : "";
  const section = active.closest("section[id], header, footer");
  const label = (section && section !== active ? (section.id ? "#" + section.id : section.tagName.toLowerCase()) + " > " : "") +
    active.tagName.toLowerCase() + (cls ? "." + cls : "") + (active.textContent?.trim() ? " (" + active.textContent.trim().slice(0, 30) + ")" : "");
  const bar = document.querySelector(".topbar");
  if (bar && bar.contains(active)) return { active: label, inBar: true };
  const r = active.getBoundingClientRect();
  if (r.width === 0 || r.height === 0 || r.bottom <= 0 || r.top >= innerHeight) return { active: label, offscreen: r.width > 0 };
  const isActive = (el) => !!el && (el === active || active.contains(el) || el.contains(active));
  const cx = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1);
  const centerCovered = !isActive(document.elementFromPoint(cx, Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1)));
  const topPoint = document.elementFromPoint(cx, Math.max(r.top + 1, 0));
  const underBar = !!bar && !!topPoint && bar.contains(topPoint);
  // Focado mas transparente (ex.: o conteúdo do hero "expansao" antes de
  // expandir): espera as transições antes de reprovar.
  const opacity = await ${SETTLED_OPACITY_FN}(active, ${FOCUS_MIN_OPACITY}, 1200);
  return {
    active: label,
    centerCovered,
    underBar,
    invisible: opacity < ${FOCUS_MIN_OPACITY},
    opacity: Math.round(opacity * 100) / 100,
    top: Math.round(r.top),
    barBottom: bar ? Math.round(bar.getBoundingClientRect().bottom) : 0,
  };
})()`;

// Com o espaçamento do 1.4.12 já aplicado: cada controle visível da barra
// (links, WhatsApp, Menu e, com o painel aberto, os itens dele) cabe na
// tela e no container? A barra cobre a moldura do hero? A página rola de lado?
const TOPBAR_SPACING_EXPR = `(async () => {
  await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const cw = document.documentElement.clientWidth;
  const bar = document.querySelector(".topbar");
  const inner = document.querySelector(".topbar__bar");
  const toggle = document.querySelector(".topbar__toggle");
  const shown = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };
  const label = (el) => el.tagName.toLowerCase() + "." + String(el.className).trim().split(/\\s+/)[0] +
    (el.textContent.trim() ? " (" + el.textContent.trim().slice(0, 24) + ")" : "");
  const innerRect = inner.getBoundingClientRect();
  const contentRight = innerRect.right - parseFloat(getComputedStyle(inner).paddingRight);
  const contentLeft = innerRect.left + parseFloat(getComputedStyle(inner).paddingLeft);
  const problems = [];
  const measure = (where) => {
    for (const el of bar.querySelectorAll("a[href], button")) {
      if (!shown(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.left < -0.5 || r.right > cw + 0.5) {
        problems.push(label(el) + " " + where + ": cortado (x " + Math.round(r.left) + "–" + Math.round(r.right) + ", tela " + cw + ")");
      } else if (where === "na barra" && (r.right > contentRight + 0.5 || r.left < contentLeft - 0.5)) {
        problems.push(label(el) + " na barra: passa do container (até x=" + Math.round(r.right) + ", conteúdo até " + Math.round(contentRight) + ")");
      }
    }
  };
  measure("na barra");
  // A moldura do hero "video"; no "expansao", o quadro e o título (no topo,
  // com o hero recolhido, como a página abre).
  for (const [selector, what] of [
    [".hero-video__frame", "da moldura do hero"],
    [${JSON.stringify(EXP_MIDIA_SELECTOR)}, "do quadro do hero"],
    [${JSON.stringify(EXP_TITULO_SELECTOR)}, "do título do hero"],
  ]) {
    const frame = document.querySelector(selector);
    if (frame && bar.getBoundingClientRect().bottom > frame.getBoundingClientRect().top + 0.5) {
      problems.push("a barra cobre o topo " + what);
    }
  }
  if (document.documentElement.scrollWidth > cw) {
    problems.push("a página rola de lado (" + (document.documentElement.scrollWidth - cw) + "px)");
  }
  const menu = shown(toggle);
  if (menu) {
    toggle.click();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (bar.getAttribute("data-open") !== "true") problems.push("o Menu não abriu");
    else measure("no painel do Menu");
    toggle.click();
  }
  return { cw, mode: menu ? "Menu" : "barra larga", problems };
})()`;

// Hero "estudio", rodando dentro da página a partir do topo. Só usa os
// ganchos estáveis do hero (data-scrub na seção, data-frame no canvas e o
// pôster): o desenho interno dele pode mudar. Espera o 1º quadro (até 10 s;
// com reduced motion, o tempo todo, e nada pode aparecer), lê o quadro no
// topo e rola até 50% e 95% da rolagem da seção — frações da altura dela,
// nunca pixels fixos, para valer em qualquer altura de janela.
const HERO_STUDIO_EXPR = `(async () => {
  const section = document.querySelector(${JSON.stringify(HERO_STUDIO_SELECTOR)});
  const canvas = document.querySelector(${JSON.stringify(HERO_CANVAS_SELECTOR)});
  const poster = document.querySelector(${JSON.stringify(HERO_POSTER_SELECTOR)});
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  if (!section) return null;
  const frame = () => canvas?.dataset.frame ?? null;
  await document.fonts.ready;
  for (let i = 0; i < 50 && frame() === null; i++) await wait(200);
  const before = frame();
  const sectionTop = section.getBoundingClientRect().top + scrollY;
  const frameAt = async (fraction) => {
    const previous = frame();
    const scrollable = Math.max(0, section.offsetHeight - innerHeight);
    window.scrollTo({ top: sectionTop + scrollable * fraction, behavior: "instant" });
    for (let i = 0; i < 20 && frame() === previous; i++) await wait(100);
    await wait(300);
    return frame();
  };
  const middle = await frameAt(0.5);
  const end = await frameAt(0.95);
  const state = {
    scrub: section.dataset.scrub ?? null,
    height: section.offsetHeight,
    viewport: innerHeight,
    before,
    middle,
    end,
    posterShown: !!poster && poster.complete && poster.naturalWidth > 0,
  };
  window.scrollTo({ top: 0, behavior: "instant" });
  return state;
})()`;

// Hero "estudio", com a animação: rola até a seção seguinte (#produtos) como
// a âncora faz (scroll-padding-top incluído) e confere que o fundo preso do
// hero já soltou: o pé dele fica acima do topo da seção, e o elementFromPoint
// em seis pontos do topo dela (três larguras, 4 e 48 px abaixo) devolve
// conteúdo da própria seção. O fundo tem pointer-events: none, que o
// elementFromPoint ignora; por isso ele é ligado só durante a leitura. O
// mesmo para o fundo do hero "expansao" (fundoSelector).
const heroExitExpr = (fundoSelector) => `(async () => {
  const fundo = document.querySelector(${JSON.stringify(fundoSelector)});
  const next = document.querySelector(${JSON.stringify(AFTER_HERO_SELECTOR)});
  if (!fundo || !next) return { missing: fundo ? ${JSON.stringify(AFTER_HERO_SELECTOR)} : ${JSON.stringify(fundoSelector)} };
  const frames = (n) => new Promise((resolve) => {
    const step = () => (n-- <= 0 ? resolve() : requestAnimationFrame(step));
    step();
  });
  next.scrollIntoView({ block: "start", behavior: "instant" });
  await frames(6);
  const top = next.getBoundingClientRect().top;
  const fundoBottom = fundo.getBoundingClientRect().bottom;
  const label = (el) => {
    if (!el) return "nada";
    const cls = typeof el.className === "string" ? el.className.trim().split(/\\s+/)[0] : "";
    return el.tagName.toLowerCase() + (cls ? "." + cls : "");
  };
  const probe = document.createElement("style");
  probe.textContent = ${JSON.stringify(`${fundoSelector}, ${fundoSelector} * { pointer-events: auto !important; }`)};
  document.head.append(probe);
  const covered = [];
  try {
    for (const fx of [0.1, 0.5, 0.9]) {
      for (const dy of [4, 48]) {
        const x = Math.round(innerWidth * fx);
        const y = Math.round(top + dy);
        if (y < 0 || y >= innerHeight) continue;
        const el = document.elementFromPoint(x, y);
        if (!el || !next.contains(el)) covered.push(label(el) + " em (" + x + ", " + y + ")");
      }
    }
  } finally {
    probe.remove();
  }
  window.scrollTo({ top: 0, behavior: "instant" });
  return { top: Math.round(top), fundoBottom: Math.round(fundoBottom), covered };
})()`;

// Hero "expansao", composição parada (sem JavaScript, ou com reduced motion
// depois de montar): nada preso, recolhido (p = 0), fundo, quadro com o
// pôster, título e linha de apoio à vista, sem a dica, e o conteúdo com os
// dois botões legível e clicável. Síncrono depois das fontes (sem
// requestAnimationFrame, que não roda sem JavaScript): o scrollIntoView
// "instant" e o elementFromPoint usam o layout na hora. Devolve os problemas
// e a altura da seção (a referência: ela nunca muda entre os estados).
const expStaticExpr = (scriptsOn) => `(async () => {
  await document.fonts.ready;
  const opacityOf = ${EFFECTIVE_OPACITY_FN};
  const doc = document.documentElement;
  const root = document.querySelector(${JSON.stringify(HERO_EXP_SELECTOR)});
  if (!root) return { missing: true };
  window.scrollTo({ top: 0, behavior: "instant" });
  const problems = [];
  const vh = innerHeight;
  const cw = doc.clientWidth;
  const bar = document.querySelector(".topbar");
  const barBottom = bar ? bar.getBoundingClientRect().bottom : 0;
  const px = (n) => Math.round(n);
  const label = (el) => {
    if (!el) return "nada";
    const cls = typeof el.className === "string" ? el.className.trim().split(/\\s+/)[0] : "";
    return el.tagName.toLowerCase() + (cls ? "." + cls : "");
  };
  const ds = root.dataset;
  if (ds.pin !== "false") problems.push("data-pin=" + ds.pin + " (esperado false: nada preso)");
  if (ds.expanded !== "false") problems.push("data-expanded=" + ds.expanded + " (esperado false: a composição recolhida)");
  if (ds.progress !== "0.00") problems.push("data-progress=" + ds.progress + " (esperado 0.00)");
  if (ds.content !== "visible") problems.push("data-content=" + ds.content + " (esperado visible)");
  if ("input" in ds) problems.push("data-input=" + ds.input + " (esperado ausente)");
  if (root.style.getPropertyValue("--hx-p")) problems.push("--hx-p escrito na seção (esperado ausente)");
  if (!root.hasAttribute("data-hides-fab")) problems.push("a seção não tem data-hides-fab");

  const fundoImg = root.querySelector(${JSON.stringify(`${EXP_FUNDO_SELECTOR} img`)});
  if (!fundoImg) problems.push("sem a imagem do fundo");
  else {
    const r = fundoImg.getBoundingClientRect();
    if (!(fundoImg.complete && fundoImg.naturalWidth > 0)) problems.push("a imagem do fundo não carregou (" + (fundoImg.currentSrc || fundoImg.src) + ")");
    if (!(r.bottom > 0 && r.top < vh && r.right > 0 && r.left < cw)) problems.push("o fundo está fora da tela");
    if (opacityOf(fundoImg) < 0.99) problems.push("o fundo está apagado (opacidade " + opacityOf(fundoImg).toFixed(2) + ")");
  }

  const midia = root.querySelector(${JSON.stringify(EXP_MIDIA_SELECTOR)});
  const poster = midia && midia.querySelector("img");
  if (!midia) problems.push("sem o quadro (${EXP_MIDIA_SELECTOR})");
  else {
    const r = midia.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) problems.push("o quadro tem tamanho zero");
    else if (r.left < -0.5 || r.right > cw + 0.5 || r.top < barBottom - 0.5 || r.bottom > vh + 0.5) {
      problems.push("o quadro sai da tela ou entra sob a barra (x " + px(r.left) + "–" + px(r.right) + ", y " + px(r.top) + "–" + px(r.bottom) + "; barra até y=" + px(barBottom) + ", tela " + cw + "×" + vh + ")");
    }
    if (!poster || !(poster.complete && poster.naturalWidth > 0)) problems.push("o pôster do quadro não carregou");
    else if (opacityOf(poster) < 0.99) problems.push("o pôster do quadro está apagado");
    const video = midia.querySelector("video");
    if (video && video.autoplay) problems.push("o vídeo do quadro tem autoplay");
    if (video && !video.paused) problems.push("o vídeo do quadro está tocando na composição parada");
  }

  const h1 = root.querySelector("h1#hero-title");
  if (!h1 || !h1.textContent.trim()) problems.push("sem o h1#hero-title com texto");
  else {
    const r = h1.getBoundingClientRect();
    if (opacityOf(h1) < 0.99) problems.push("o título está apagado (opacidade " + opacityOf(h1).toFixed(2) + ")");
    if (r.left < -0.5 || r.right > cw + 0.5) problems.push("o título passa da largura da tela (x " + px(r.left) + "–" + px(r.right) + ")");
    if (r.top < barBottom - 0.5) problems.push("o título entra sob a barra do topo (topo em y=" + px(r.top) + ", barra até y=" + px(barBottom) + ")");
    if (r.bottom > vh + 0.5) problems.push("o título passa do pé da tela (até y=" + px(r.bottom) + ")");
    if (root.getAttribute("aria-labelledby") !== h1.id) problems.push("o aria-labelledby da seção não aponta para o h1");
  }

  const data = root.querySelector(".hero-expansao__data");
  if (data) {
    const r = data.getBoundingClientRect();
    if (opacityOf(data) < 0.99) problems.push("a linha de apoio está apagada");
    else if (r.left < -0.5 || r.right > cw + 0.5 || r.top < barBottom - 0.5 || r.bottom > vh + 0.5) {
      problems.push("a linha de apoio não cabe inteira na tela (x " + px(r.left) + "–" + px(r.right) + ", y " + px(r.top) + "–" + px(r.bottom) + ")");
    }
  }
  const dica = root.querySelector(${JSON.stringify(EXP_DICA_SELECTOR)});
  if (dica && opacityOf(dica) > 0.01) problems.push("a dica de rolar aparece sem a expansão ligada");

  const toggle = root.querySelector(".hero-expansao__controle button");
  const toggleShown = !!toggle && !toggle.hidden && getComputedStyle(toggle).display !== "none";
  if (${scriptsOn ? "!toggleShown" : "toggleShown"}) {
    problems.push(${JSON.stringify(scriptsOn ? "o controle do vídeo não apareceu depois de montar" : "o controle do vídeo aparece sem JavaScript (não faria nada)")});
  }
  if (doc.scrollWidth > cw) problems.push("a página rola de lado no topo (" + (doc.scrollWidth - cw) + "px)");

  const conteudo = root.querySelector(${JSON.stringify(EXP_CONTEUDO_SELECTOR)});
  if (!conteudo) problems.push("sem o conteúdo (${EXP_CONTEUDO_SELECTOR})");
  else {
    if (opacityOf(conteudo) < 0.99) problems.push("o conteúdo está apagado (opacidade " + opacityOf(conteudo).toFixed(2) + ")");
    for (const sel of ["h2", ".lead"]) {
      const el = conteudo.querySelector(sel);
      if (!el || !el.textContent.trim()) problems.push("o conteúdo não tem " + sel + " com texto");
    }
    if (!conteudo.querySelector('a.btn--primary[href="#produtos"]')) problems.push("o conteúdo não tem o botão para #produtos");
    if (!conteudo.querySelector("a.btn--whatsapp")) problems.push("o conteúdo não tem o botão do WhatsApp");
    for (const link of conteudo.querySelectorAll("a[href]")) {
      link.scrollIntoView({ block: "center", behavior: "instant" });
      const r = link.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const name = "'" + link.textContent.trim().slice(0, 30) + "'";
      if (opacityOf(link) < 0.99) problems.push("o botão " + name + " está apagado");
      else if (!hit || !(hit === link || link.contains(hit))) problems.push("o botão " + name + " está coberto por " + label(hit));
    }
    if (doc.scrollWidth > cw) problems.push("a página rola de lado no conteúdo do hero (" + (doc.scrollWidth - cw) + "px)");
  }
  const height = root.offsetHeight;
  window.scrollTo({ top: 0, behavior: "instant" });
  return { problems, height, vh };
})()`;

// Hero "expansao", com JavaScript: assenta (scrollY e data-progress iguais
// por 3 quadros; no mínimo 6 e no máximo 90 quadros, como o Tab pela página)
// e lê os ganchos e a geometria de verdade (o quadro, as duas linhas do
// título, as legendas, o palco), porque os atributos sozinhos podem mentir.
const EXP_STATE_EXPR = `(async () => {
  const root = document.querySelector(${JSON.stringify(HERO_EXP_SELECTOR)});
  if (!root) return null;
  const opacityOf = ${EFFECTIVE_OPACITY_FN};
  const doc = document.documentElement;
  let lastY = null;
  let lastP = null;
  let stable = 0;
  for (let i = 0; i < 90 && (i < 6 || stable < 3); i++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (scrollY === lastY && root.dataset.progress === lastP) stable++;
    else { stable = 0; lastY = scrollY; lastP = root.dataset.progress; }
  }
  const box = (sel) => {
    const el = root.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: r.width, h: r.height };
  };
  const opacity = (sel) => {
    const el = root.querySelector(sel);
    return el ? opacityOf(el) : null;
  };
  const active = document.activeElement;
  const rootRect = root.getBoundingClientRect();
  return {
    pin: root.dataset.pin ?? null,
    expanded: root.dataset.expanded ?? null,
    progress: root.dataset.progress ?? null,
    content: root.dataset.content ?? null,
    input: root.dataset.input ?? null,
    scrollY,
    vh: innerHeight,
    vw: innerWidth,
    sw: doc.scrollWidth,
    cw: doc.clientWidth,
    maxScroll: doc.scrollHeight - innerHeight,
    height: root.offsetHeight,
    bottom: rootRect.bottom,
    palco: box(${JSON.stringify(EXP_PALCO_SELECTOR)}),
    midia: box(${JSON.stringify(EXP_MIDIA_SELECTOR)}),
    linha1: box(".hero-expansao__linha--1"),
    linha2: box(".hero-expansao__linha--2"),
    data: box(".hero-expansao__data"),
    dica: box(${JSON.stringify(EXP_DICA_SELECTOR)}),
    fundo: opacity(${JSON.stringify(EXP_FUNDO_SELECTOR)}),
    conteudo: opacity(${JSON.stringify(EXP_CONTEUDO_SELECTOR)}),
    activeIsBody: !active || active === document.body,
    active: active && active !== document.body ? active.tagName.toLowerCase() + "." + String(active.className).trim().split(/\\s+/)[0] : "body",
  };
})()`;

// Espera (até ms) a opacidade efetiva do elemento chegar a atLeast (ou
// descer a atMost) e devolve a última lida; null se o elemento não existe.
const expWaitOpacityExpr = (selector, { atLeast = -1, atMost = 2, ms = 1500 }) => `(async () => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const opacityOf = ${EFFECTIVE_OPACITY_FN};
  const end = performance.now() + ${ms};
  let opacity = opacityOf(el);
  while ((opacity < ${atLeast} || opacity > ${atMost}) && performance.now() < end) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    opacity = opacityOf(el);
  }
  return opacity;
})()`;

// Depois de uma âncora: espera a rolagem (suave, com scroll-behavior) parar
// — 6 quadros sem mudar, até ~4 s — e diz onde o alvo ficou em relação ao
// scroll-padding-top, se a página está no fim (aí o alvo pode ficar mais
// abaixo) e o que há em seis pontos do topo do alvo (com o pointer-events do
// fundo do hero ligado só durante a leitura, como no heroExitExpr).
const expAnchorExpr = (targetSelector) => `(async () => {
  const target = document.querySelector(${JSON.stringify(targetSelector)});
  const root = document.querySelector(${JSON.stringify(HERO_EXP_SELECTOR)});
  if (!target) return null;
  let last = null;
  let stable = 0;
  for (let i = 0; i < 240 && (i < 12 || stable < 6); i++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (scrollY === last) stable++;
    else { stable = 0; last = scrollY; }
  }
  const doc = document.documentElement;
  const pad = parseFloat(getComputedStyle(doc).scrollPaddingTop) || 0;
  const top = target.getBoundingClientRect().top;
  const maxScroll = doc.scrollHeight - innerHeight;
  const label = (el) => {
    if (!el) return "nada";
    const cls = typeof el.className === "string" ? el.className.trim().split(/\\s+/)[0] : "";
    return el.tagName.toLowerCase() + (cls ? "." + cls : "");
  };
  const probe = document.createElement("style");
  probe.textContent = ${JSON.stringify(`${EXP_FUNDO_SELECTOR}, ${EXP_FUNDO_SELECTOR} * { pointer-events: auto !important; }`)};
  document.head.append(probe);
  const covered = [];
  try {
    for (const fx of [0.1, 0.5, 0.9]) {
      for (const dy of [4, 48]) {
        const x = Math.round(innerWidth * fx);
        const y = Math.round(top + dy);
        if (y < 0 || y >= innerHeight) continue;
        const el = document.elementFromPoint(x, y);
        if (!el || !target.contains(el)) covered.push(label(el) + " em (" + x + ", " + y + ")");
      }
    }
  } finally {
    probe.remove();
  }
  return {
    top: Math.round(top),
    pad: Math.round(pad),
    scrollY: Math.round(scrollY),
    atBottom: maxScroll - scrollY <= 2,
    vh: innerHeight,
    hash: location.hash,
    pin: root ? (root.dataset.pin ?? null) : null,
    expanded: root ? (root.dataset.expanded ?? null) : null,
    covered,
  };
})()`;

async function evalValue(cdp, expression, { awaitPromise = false } = {}) {
  const { result, exceptionDetails } = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise,
  });
  // A descrição da exceção diz o que quebrou ("TypeError: … null"); o
  // `text` sozinho costuma ser só "Uncaught".
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description?.split("\n")[0] ?? exceptionDetails.text);
  return result.value;
}

async function elementRect(cdp, selector) {
  return evalValue(
    cdp,
    `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      // "instant" ignora o scroll-behavior: smooth do CSS (globals.css) — senão
      // o retângulo abaixo é lido antes do scroll terminar.
      el.scrollIntoView({ block: "center", behavior: "instant" });
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: Math.max(0, r.top + r.height / 2) };
    })()`,
  );
}

async function clickAt(cdp, x, y) {
  const options = { x, y, button: "left", clickCount: 1 };
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", ...options });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...options });
}

/** Clica no centro do elemento (rolando até ele antes) — é um gesto de verdade para a política de autoplay. */
async function clickSelector(cdp, selector) {
  const rect = await elementRect(cdp, selector);
  if (!rect) throw new Error(`elemento não encontrado para clicar: ${selector}`);
  await clickAt(cdp, rect.x, rect.y);
  return rect;
}

/** Clica no centro do elemento onde ele está, sem rolar antes (o clique numa barra fixa, como a pessoa faz). */
async function clickFixed(cdp, selector) {
  const rect = await evalValue(
    cdp,
    `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return null;
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`,
  );
  if (!rect) throw new Error(`elemento não encontrado (ou sem caixa) para clicar: ${selector}`);
  await clickAt(cdp, rect.x, rect.y);
  return rect;
}

// Teclas pelo CDP. Com texto (Espaço), vai como "keyDown" com o texto: o
// Blink só rola com o Espaço pelo keypress, que o rawKeyDown não gera. Sem
// texto, "rawKeyDown", como o Tab sempre foi.
const KEYS = {
  Tab: { key: "Tab", code: "Tab", vk: 9 },
  Space: { key: " ", code: "Space", vk: 32, text: " " },
  PageDown: { key: "PageDown", code: "PageDown", vk: 34 },
  End: { key: "End", code: "End", vk: 35 },
  Home: { key: "Home", code: "Home", vk: 36 },
  ArrowDown: { key: "ArrowDown", code: "ArrowDown", vk: 40 },
};

async function pressKey(cdp, { key, code, vk, text }) {
  const base = { key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
  if (text) await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", ...base, text, unmodifiedText: text });
  else await cdp.send("Input.dispatchKeyEvent", { type: "rawKeyDown", ...base });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
}

async function pressTab(cdp) {
  await pressKey(cdp, KEYS.Tab);
}

/** Um evento de roda de verdade (mouseWheel do CDP) no ponto (x, y). */
async function wheelAt(cdp, x, y, deltaY) {
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseWheel", x, y, deltaX: 0, deltaY, pointerType: "mouse" });
}

/** Navega e espera o load. De "/" para "/#x" a navegação é no mesmo documento e não dispara load: passe por about:blank antes. */
async function navigate(cdp, url, label) {
  const loaded = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url });
  await withTimeout(loaded, label);
}

async function setReducedMotion(cdp, reduce) {
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" }],
  });
}

/**
 * Garante que o vídeo de um cartão da grade está tocando: clica o botão
 * "Assistir" (o vídeo nasce já em autoplay) e espera — clicar no vídeo de
 * novo pausaria o autoplay, já que o clique alterna. Reforça com `play()`
 * sob o mesmo gesto se precisar.
 */
async function playVideo(cdp, videoSelector, { viaButton }) {
  await clickSelector(cdp, viaButton);
  await sleep(400);
  await evalValue(
    cdp,
    `(() => { const v = document.querySelector(${JSON.stringify(videoSelector)}); if (v && v.paused) v.play().catch(() => {}); })()`,
  );
  await sleep(400);
  return evalValue(cdp, `document.querySelector(${JSON.stringify(videoSelector)})?.paused === false`);
}

async function isPaused(cdp, selector) {
  return evalValue(cdp, `document.querySelector(${JSON.stringify(selector)})?.paused !== false`);
}

// --- Hero "expansao": as passadas (cada uma recebe o tamanho e onde anotar) ---

const expState = (cdp) => evalValue(cdp, EXP_STATE_EXPR, { awaitPromise: true });
const expWaitOpacity = (cdp, selector, options) =>
  evalValue(cdp, expWaitOpacityExpr(selector, options), { awaitPromise: true });
const area = (box) => (box ? box.w * box.h : 0);
const fixed2 = (n) => (typeof n === "number" ? n.toFixed(2) : String(n));
/** Preso de verdade: o palco cobre a tela inteira, parado no topo (os atributos sozinhos podem mentir). */
const holdsViewport = (state) =>
  !!state.palco && Math.abs(state.palco.top) <= 0.5 && state.palco.bottom >= state.vh - 0.5;

async function expWaitPin(cdp, ms = 5000) {
  for (let waited = 0; waited < ms; waited += 100) {
    const pin = await evalValue(cdp, `document.querySelector(${JSON.stringify(HERO_EXP_SELECTOR)})?.dataset.pin ?? null`);
    if (pin === "true") return true;
    await sleep(100);
  }
  return false;
}

/** Carrega a página com JavaScript e espera a expansão prender (data-pin="true"). */
async function expLoadPinned(cdp, ctx, what) {
  await navigate(cdp, URL_TO_CHECK, `carregar (${what}) a ${ctx.size}`);
  await sleep(1500); // hidratação + efeitos de montagem
  if (await expWaitPin(cdp)) return true;
  const state = await expState(cdp);
  ctx.fail(`${what}: depois de montar, a expansão não prendeu (data-pin=${state?.pin}, scrollY=${state?.scrollY})`);
  return false;
}

/**
 * Progresso que só sobe, palco preso cobrindo a tela enquanto não expande,
 * sem rolagem horizontal. Devolve false se já reprovou (para não repetir).
 */
function expCheckForward(ctx, what, samples) {
  if (!(Number(samples[1]?.progress) > 0)) {
    ctx.fail(`${what}: o 1º gesto não mexeu no progresso (${samples[0]?.progress} → ${samples[1]?.progress})`);
  }
  for (let i = 1; i < samples.length; i++) {
    const [before, after] = [samples[i - 1], samples[i]];
    if (Number(after.progress) < Number(before.progress) - 0.005) {
      ctx.fail(`${what}: o progresso voltou de ${before.progress} para ${after.progress} indo para baixo`);
      break;
    }
  }
  for (const state of samples) {
    if (state.expanded !== "true" && (state.pin !== "true" || !holdsViewport(state))) {
      ctx.fail(
        `${what}: com progresso ${state.progress}, o hero soltou antes de expandir (data-pin=${state.pin}, palco em y=${Math.round(state.palco?.top ?? NaN)}, scrollY=${state.scrollY})`,
      );
      break;
    }
  }
  for (const state of samples) {
    if (state.sw > state.cw) {
      ctx.fail(`${what}: rolagem horizontal de ${state.sw - state.cw}px com progresso ${state.progress}`);
      break;
    }
  }
}

/** 1. Sem JavaScript: a composição parada. Devolve a altura do hero (a referência). */
async function expNoJsPass(cdp, ctx) {
  await setReducedMotion(cdp, false);
  await cdp.send("Emulation.setScriptExecutionDisabled", { value: true });
  let result;
  try {
    await navigate(cdp, URL_TO_CHECK, `carregar sem JavaScript a ${ctx.size}`);
    result = await evalValue(cdp, expStaticExpr(false), { awaitPromise: true });
  } finally {
    await cdp.send("Emulation.setScriptExecutionDisabled", { value: false });
  }
  if (result.missing) {
    ctx.fail(`sem JavaScript: a variante é "expansao", mas a página não tem ${HERO_EXP_SELECTOR} (o gancho do hero mudou?)`);
    return null;
  }
  for (const problem of result.problems) ctx.fail(`sem JavaScript: ${problem}`);
  ctx.log(
    `sem JavaScript: ${result.problems.length === 0 ? "parado, recolhido, fundo, quadro, título e os dois botões à vista" : `${result.problems.length} problema(s)`}; altura do hero ${result.height}px`,
  );
  return result.height;
}

/** 2. Roda do mouse: expande preso, solta para Produtos e recolhe no topo. */
async function expWheelPass(cdp, ctx, staticHeight) {
  await setReducedMotion(cdp, false);
  if (!(await expLoadPinned(cdp, ctx, "roda"))) return;
  const x = Math.round(ctx.width / 2);
  const y = Math.round(ctx.height / 2);
  const s0 = await expState(cdp);
  if (s0.progress !== "0.00" || s0.expanded !== "false" || s0.content !== "hidden") {
    ctx.fail(
      `roda: preso, o estado inicial é progresso ${s0.progress}, data-expanded=${s0.expanded}, data-content=${s0.content} (esperado 0.00, false, hidden)`,
    );
  }
  if (staticHeight !== null && Math.abs(s0.height - staticHeight) > 2) {
    ctx.fail(`roda: preso, o hero tem ${s0.height}px; sem JavaScript, ${staticHeight}px (a altura não pode mudar: as âncoras saem do lugar)`);
  }
  const dica = await expWaitOpacity(cdp, EXP_DICA_SELECTOR, { atLeast: 0.99, ms: 1500 });
  if (dica !== null && dica < 0.99) ctx.fail(`roda: preso, a dica de rolar não apareceu (opacidade ${fixed2(dica)})`);

  const samples = [s0];
  let wheels = 0;
  while (wheels < EXP_WHEEL_BUDGET && samples.at(-1).expanded !== "true") {
    for (let k = 0; k < 4; k++, wheels++) await wheelAt(cdp, x, y, EXP_WHEEL_DELTA);
    samples.push(await expState(cdp));
  }
  expCheckForward(ctx, "roda", samples);
  for (let i = 1; i < samples.length; i++) {
    if (area(samples[i].midia) < area(samples[i - 1].midia) - 1) {
      ctx.fail(`roda: o quadro encolheu indo para baixo (progresso ${samples[i - 1].progress} → ${samples[i].progress})`);
      break;
    }
  }
  const last = samples.at(-1);
  ctx.log(`roda: ${wheels} eventos de ${EXP_WHEEL_DELTA}px; progresso ${samples.map((s) => s.progress).join(" → ")}`);
  if (last.expanded !== "true") {
    ctx.fail(`roda: ${wheels} eventos de ${EXP_WHEEL_DELTA}px e não expandiu (progresso ${last.progress})`);
    return;
  }
  if (last.progress !== "1.00" || last.pin !== "false") {
    ctx.fail(`roda: expandido, mas progresso ${last.progress} e data-pin=${last.pin} (esperado 1.00 e false)`);
  }

  // O conteúdo aparece (transição de 700 ms) e o fundo some (100 ms).
  const conteudo = await expWaitOpacity(cdp, EXP_CONTEUDO_SELECTOR, { atLeast: 0.99, ms: 2000 });
  if (conteudo < 0.99) ctx.fail(`roda: expandido, o conteúdo ficou com opacidade ${fixed2(conteudo)}`);
  const fundo = await expWaitOpacity(cdp, EXP_FUNDO_SELECTOR, { atMost: 0.05, ms: 1000 });
  if (fundo > 0.05) ctx.fail(`roda: expandido, o fundo continua com opacidade ${fixed2(fundo)} (esperado sumir)`);
  const end = await expState(cdp);
  const growth = area(end.midia) / Math.max(1, area(s0.midia));
  if (growth < 1.3) {
    ctx.fail(
      `roda: o quadro não cresceu de fato (${Math.round(s0.midia.w)}×${Math.round(s0.midia.h)} → ${Math.round(end.midia.w)}×${Math.round(end.midia.h)}); data-progress diz ${end.progress}`,
    );
  }
  const half = end.vw / 2;
  const slid = [
    ["a 1ª linha do título", end.linha1 && s0.linha1 && end.linha1.right <= s0.linha1.right - half],
    ["a 2ª linha do título", end.linha2 && s0.linha2 && end.linha2.left >= s0.linha2.left + half],
    ["a linha de apoio", end.data && s0.data && end.data.right <= s0.data.right - half],
    ["a dica", end.dica && s0.dica && end.dica.left >= s0.dica.left + half],
  ];
  for (const [what, ok] of slid) if (!ok) ctx.fail(`roda: expandido, ${what} não se abriu para o lado`);
  if (staticHeight !== null && Math.abs(end.height - staticHeight) > 2) {
    ctx.fail(`roda: expandido, o hero tem ${end.height}px; sem JavaScript, ${staticHeight}px (a altura não pode mudar)`);
  }
  ctx.log(
    `roda: expandido; quadro ${Math.round(s0.midia.w)}×${Math.round(s0.midia.h)} → ${Math.round(end.midia.w)}×${Math.round(end.midia.h)}, fundo ${fixed2(fundo)}, conteúdo ${fixed2(conteudo)}`,
  );

  // Solta: a roda volta a rolar a página até o hero sair da tela.
  let released = end;
  for (let round = 0; round < 3 && released.bottom >= released.vh; round++) {
    for (let k = 0; k < 15; k++) await wheelAt(cdp, x, y, 100);
    released = await expState(cdp);
  }
  if (!(released.scrollY > end.scrollY + 50)) {
    ctx.fail(`roda: expandido, a roda não rolou a página (scrollY ${end.scrollY} → ${released.scrollY})`);
  } else if (released.bottom >= released.vh) {
    ctx.fail(`roda: a roda não tirou o hero da tela (pé do hero em y=${Math.round(released.bottom)}, scrollY=${released.scrollY})`);
  }

  // Saída: com #produtos no topo, nada do hero cobre a seção.
  const exit = await evalValue(cdp, heroExitExpr(EXP_FUNDO_SELECTOR), { awaitPromise: true });
  if (exit.missing) ctx.fail(`roda: a página não tem ${exit.missing}`);
  else {
    for (const point of exit.covered) ctx.fail(`roda: o topo de ${AFTER_HERO_SELECTOR} está coberto por ${point}`);
    ctx.log(
      `roda: soltou (scrollY ${released.scrollY}); ${AFTER_HERO_SELECTOR} no topo em y=${exit.top}, ${exit.covered.length === 0 ? "livre (6 pontos)" : `${exit.covered.length} ponto(s) coberto(s)!`}`,
    );
  }

  // De volta ao topo (o heroExitExpr termina lá), ainda expandido: a roda
  // para cima recolhe, prende de novo e o progresso desce.
  const atTop = await expState(cdp);
  if (atTop.expanded !== "true" || atTop.scrollY > 0.5) {
    ctx.fail(`roda: de volta ao topo, esperava expandido em scrollY 0 (data-expanded=${atTop.expanded}, scrollY=${atTop.scrollY})`);
    return;
  }
  await wheelAt(cdp, x, y, -100);
  const unexpanded = await expState(cdp);
  if (unexpanded.expanded !== "false" || unexpanded.pin !== "true" || unexpanded.scrollY > 0.5) {
    ctx.fail(
      `roda: no topo, a roda para cima não recolheu (data-expanded=${unexpanded.expanded}, data-pin=${unexpanded.pin}, scrollY=${unexpanded.scrollY})`,
    );
    return;
  }
  // Até 0,3: abaixo de 0,75 o conteúdo some; e o quadro encolhe de fato (em
  // telas pequenas ele fica no limite de 95vw × 85vh até bem abaixo de 1).
  const backSamples = [unexpanded];
  for (let ups = 0; ups < 60 && Number(backSamples.at(-1).progress) > 0.3; ups += 4) {
    for (let k = 0; k < 4; k++) await wheelAt(cdp, x, y, -EXP_WHEEL_DELTA);
    backSamples.push(await expState(cdp));
  }
  const back = backSamples.at(-1);
  const below = backSamples.find((state) => Number(state.progress) < 0.75);
  if (!(Number(back.progress) <= 0.3)) ctx.fail(`roda: recolhendo, o progresso não desceu (ficou em ${back.progress})`);
  else {
    if (below && below.content !== "hidden") ctx.fail(`roda: recolhendo abaixo de 0,75 (progresso ${below.progress}), o conteúdo não se escondeu`);
    if (!backSamples.every(holdsViewport)) ctx.fail("roda: recolhendo, o palco não ficou preso no topo");
    if (!(area(back.midia) < area(end.midia) - 1)) ctx.fail(`roda: recolhendo até o progresso ${back.progress}, o quadro não encolheu`);
  }
  ctx.log(
    `roda: no topo, a roda para cima recolheu (data-pin=true) e levou o progresso a ${back.progress}; quadro ${Math.round(back.midia?.w)}×${Math.round(back.midia?.h)}, conteúdo ${below?.content ?? "?"} abaixo de 0,75`,
  );
}

/** 3. Teclado (foco no body): expande e depois rola; End/Home. */
async function expKeyPass(cdp, ctx) {
  await setReducedMotion(cdp, false);
  // expected: toques até expandir pelos passos do hero (Page Down e Espaço
  // +0,34; seta +0,1); budget: até onde insistir antes de reprovar.
  const keys = [
    { name: "Page Down", key: KEYS.PageDown, expected: 3, budget: 10 },
    { name: "Espaço", key: KEYS.Space, expected: 3, budget: 10 },
    { name: "seta para baixo", key: KEYS.ArrowDown, expected: 10, budget: 30 },
  ];
  for (const { name, key, expected, budget } of keys) {
    if (!(await expLoadPinned(cdp, ctx, `teclado, ${name}`))) continue;
    const s0 = await expState(cdp);
    if (!s0.activeIsBody) ctx.fail(`teclado, ${name}: o foco não estava no body ao abrir (${s0.active})`);
    const samples = [s0];
    let presses = 0;
    while (presses < budget && samples.at(-1).expanded !== "true") {
      await pressKey(cdp, key);
      presses++;
      samples.push(await expState(cdp));
    }
    expCheckForward(ctx, `teclado, ${name}`, samples);
    const last = samples.at(-1);
    if (last.expanded !== "true") {
      ctx.fail(`teclado, ${name}: ${presses} toques e não expandiu (progresso ${last.progress})`);
      continue;
    }
    if (presses > expected) ctx.fail(`teclado, ${name}: precisou de ${presses} toques para expandir (esperado ${expected})`);
    // Expandido, a mesma tecla volta a rolar a página.
    for (let k = 0; k < 3; k++) await pressKey(cdp, key);
    const after = await expState(cdp);
    if (!(after.scrollY > last.scrollY + 10)) {
      ctx.fail(`teclado, ${name}: expandido, a tecla não rolou a página (scrollY ${last.scrollY} → ${after.scrollY})`);
    }
    ctx.log(
      `teclado, ${name}: ${presses} toque(s) até expandir (progresso ${samples.map((s) => s.progress).join(" → ")}); depois rolou até scrollY ${after.scrollY}`,
    );
  }

  // End expande sem rolar; Home recolhe (no topo) e zera; End expande e, de novo, vai ao fim.
  if (!(await expLoadPinned(cdp, ctx, "teclado, End/Home"))) return;
  const steps = [];
  const press = async (key, what) => {
    await pressKey(cdp, key);
    const state = await expState(cdp);
    steps.push(`${what}: progresso ${state.progress}, data-expanded=${state.expanded}, scrollY ${Math.round(state.scrollY)}`);
    return state;
  };
  const end1 = await press(KEYS.End, "End");
  if (end1.expanded !== "true" || end1.scrollY > 0.5) {
    ctx.fail(`teclado, End: preso, esperava expandir sem rolar (data-expanded=${end1.expanded}, scrollY=${end1.scrollY})`);
  }
  const home1 = await press(KEYS.Home, "Home");
  if (home1.expanded !== "false" || home1.pin !== "true") {
    ctx.fail(`teclado, Home: expandido no topo, esperava recolher (data-expanded=${home1.expanded}, data-pin=${home1.pin})`);
  }
  const home2 = await press(KEYS.Home, "Home");
  if (home2.progress !== "0.00") ctx.fail(`teclado, Home: preso, esperava progresso 0.00 (veio ${home2.progress})`);
  const end2 = await press(KEYS.End, "End");
  if (end2.expanded !== "true") ctx.fail(`teclado, End: esperava expandir de novo (data-expanded=${end2.expanded})`);
  const end3 = await press(KEYS.End, "End");
  if (!(end3.scrollY >= end3.maxScroll - 2)) {
    ctx.fail(`teclado, End: expandido, esperava ir ao fim da página (scrollY ${Math.round(end3.scrollY)} de ${end3.maxScroll})`);
  }
  ctx.log(`teclado, End/Home: ${steps.join("; ")}`);
}

/** Confere onde uma âncora deixou a página: no alvo, sem voltar ao topo, nada cobrindo. */
function expCheckAnchor(ctx, what, state, targetSelector) {
  if (!state) {
    ctx.fail(`${what}: a página não tem ${targetSelector}`);
    return;
  }
  const atTarget = Math.abs(state.top - state.pad) <= 24 || (state.atBottom && state.top >= state.pad - 24 && state.top < state.vh);
  if (!atTarget || !(state.scrollY > 0)) {
    ctx.fail(
      `${what}: a página não ficou em ${targetSelector} (topo dele em y=${state.top}, esperado ~${state.pad}; scrollY=${state.scrollY}; data-expanded=${state.expanded}, data-pin=${state.pin})`,
    );
  }
  if (state.pin === "true") ctx.fail(`${what}: o hero continuou preso (data-pin=true) depois da âncora`);
  for (const point of state.covered) ctx.fail(`${what}: o topo de ${targetSelector} está coberto por ${point}`);
}

/** 4. Âncoras: o link da barra fixa (sem rolar antes) e /#contato direto. */
async function expAnchorPass(cdp, ctx) {
  await setReducedMotion(cdp, false);
  if (await expLoadPinned(cdp, ctx, "âncora da barra")) {
    const link = `.topbar__links a[href="${AFTER_HERO_SELECTOR}"]`;
    const linkShown = await evalValue(
      cdp,
      `(() => { const el = document.querySelector(${JSON.stringify(link)}); if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; })()`,
    );
    if (!linkShown) {
      // Abaixo de 75em, os links ficam no painel do Menu.
      await clickFixed(cdp, ".topbar__toggle");
      await sleep(300);
      if (!(await evalValue(cdp, `document.querySelector(".topbar")?.getAttribute("data-open") === "true"`))) {
        ctx.fail("âncora da barra: o Menu não abriu");
      }
    }
    const before = await expState(cdp);
    if (before.scrollY > 0.5) ctx.fail(`âncora da barra: a página saiu do topo antes do clique (scrollY ${before.scrollY})`);
    await clickFixed(cdp, link);
    const state = await evalValue(cdp, expAnchorExpr(AFTER_HERO_SELECTOR), { awaitPromise: true });
    expCheckAnchor(ctx, `âncora da barra${linkShown ? "" : " (pelo Menu)"}`, state, AFTER_HERO_SELECTOR);
    if (state && state.hash !== AFTER_HERO_SELECTOR) ctx.fail(`âncora da barra: a URL ficou com "${state.hash}" (esperado ${AFTER_HERO_SELECTOR})`);
    if (state && state.expanded !== "true") ctx.fail(`âncora da barra: o hero não completou a expansão (data-expanded=${state.expanded})`);
    await sleep(1500);
    const later = await evalValue(cdp, expAnchorExpr(AFTER_HERO_SELECTOR), { awaitPromise: true });
    expCheckAnchor(ctx, "âncora da barra, 1,5 s depois", later, AFTER_HERO_SELECTOR);
    ctx.log(
      `âncora da barra${linkShown ? "" : " (pelo Menu)"}: ${AFTER_HERO_SELECTOR} em y=${state?.top} (scroll-padding ${state?.pad}), scrollY ${state?.scrollY}; 1,5 s depois em y=${later?.top}; data-expanded=${state?.expanded}`,
    );
  }

  // /#contato direto: about:blank antes (de "/" para "/#contato" não há load).
  const contato = "#contato";
  await navigate(cdp, "about:blank", "sair da página antes de /#contato");
  await navigate(cdp, new URL(contato, URL_TO_CHECK).href, `carregar /${contato} a ${ctx.size}`);
  await sleep(1500);
  const direct = await evalValue(cdp, expAnchorExpr(contato), { awaitPromise: true });
  expCheckAnchor(ctx, `/${contato} direto`, direct, contato);
  await sleep(1500);
  const directLater = await evalValue(cdp, expAnchorExpr(contato), { awaitPromise: true });
  expCheckAnchor(ctx, `/${contato} direto, 1,5 s depois`, directLater, contato);
  ctx.log(
    `/${contato} direto: ${contato} em y=${direct?.top} (scroll-padding ${direct?.pad}${direct?.atBottom ? ", página no fim" : ""}), scrollY ${direct?.scrollY}; 1,5 s depois em y=${directLater?.top}; data-expanded=${direct?.expanded}, data-pin=${direct?.pin}`,
  );
}

/** 5. Reduced motion: nunca prende, a composição parada, a página rola. */
async function expReducedPass(cdp, ctx, staticHeight) {
  await setReducedMotion(cdp, true);
  await navigate(cdp, URL_TO_CHECK, `carregar com reduced motion a ${ctx.size}`);
  await sleep(1500);
  const result = await evalValue(cdp, expStaticExpr(true), { awaitPromise: true });
  if (result.missing) {
    ctx.fail(`reduced motion: a página não tem ${HERO_EXP_SELECTOR}`);
    return;
  }
  for (const problem of result.problems) ctx.fail(`reduced motion: ${problem}`);
  if (staticHeight !== null && Math.abs(result.height - staticHeight) > 2) {
    ctx.fail(`reduced motion: o hero tem ${result.height}px; sem JavaScript, ${staticHeight}px (a altura não pode mudar)`);
  }
  const x = Math.round(ctx.width / 2);
  const y = Math.round(ctx.height / 2);
  for (let k = 0; k < 5; k++) await wheelAt(cdp, x, y, 100);
  const wheeled = await expState(cdp);
  if (!(wheeled.scrollY > 0)) ctx.fail("reduced motion: a roda não rolou a página");
  if (wheeled.pin !== "false" || wheeled.expanded !== "false" || wheeled.progress !== "0.00") {
    ctx.fail(
      `reduced motion: a roda mexeu no hero (data-pin=${wheeled.pin}, data-expanded=${wheeled.expanded}, progresso ${wheeled.progress}; esperado false, false, 0.00)`,
    );
  }
  await evalValue(cdp, `window.scrollTo({ top: 0, behavior: "instant" })`);
  await pressKey(cdp, KEYS.PageDown);
  const paged = await expState(cdp);
  if (!(paged.scrollY > 0)) ctx.fail("reduced motion: Page Down não rolou a página");
  if (paged.pin !== "false" || paged.progress !== "0.00") ctx.fail(`reduced motion: Page Down mexeu no hero (data-pin=${paged.pin}, progresso ${paged.progress})`);
  ctx.log(
    `reduced motion: ${result.problems.length === 0 ? "parado, nada preso" : `${result.problems.length} problema(s)`}; altura ${result.height}px; a roda rolou até scrollY ${Math.round(wheeled.scrollY)} e o Page Down até ${Math.round(paged.scrollY)}`,
  );
}

// Controle positivo da detecção de CSP: uma imagem de origem externa, que a
// CSP do next.config.ts (img-src 'self' data:) tem que barrar.
const CSP_CONTROL_HOST = "csp-controle.invalid";
const CSP_CONTROL_URL = `https://${CSP_CONTROL_HOST}/controle-positivo.png`;

/** Interrompe a checagem quando já há uma falha registrada que invalida o resto. */
class CheckAborted extends Error {}

const failures = [];

try {
  const port = await readDevToolsPort();
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((target) => target.type === "page");
  if (!page) throw new Error("nenhuma aba encontrada no navegador");

  const cdp = connect(page.webSocketDebuggerUrl);
  await cdp.opened;
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");

  let consoleErrors = [];
  cdp.on("Runtime.consoleAPICalled", (params) => {
    if (params.type === "error") {
      consoleErrors.push(params.args.map((arg) => arg.value ?? arg.description ?? "").join(" "));
    }
  });
  cdp.on("Runtime.exceptionThrown", (params) => {
    consoleErrors.push(params.exceptionDetails.exception?.description ?? params.exceptionDetails.text);
  });
  // Violação de CSP (fonte, imagem, mídia ou script bloqueado) chega pelo
  // domínio Log como entrada "security", não por Runtime.consoleAPICalled
  // nem exceptionThrown — sem isto, o bloqueio passava em silêncio (achado
  // da Crivo, revisão R1 do P3).
  cdp.on("Log.entryAdded", (params) => {
    if (params.entry.source === "security" && params.entry.level === "error") {
      consoleErrors.push(params.entry.text);
    }
  });

  console.log(`Navegador: ${browserPath}\nPágina: ${URL_TO_CHECK}\n`);

  // --- Controle positivo do detector de CSP (Q4) ---
  // Um detector que nunca acusa nada também "passa". Antes das larguras,
  // provoca de propósito uma violação (imagem de uma origem externa, barrada
  // pelo img-src 'self' data: da CSP) e exige que ela chegue em consoleErrors
  // pelo mesmo caminho das violações reais. A origem é .invalid (reservada,
  // nunca resolve): mesmo sem CSP, nada sai da máquina.
  const loadedForControl = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: URL_TO_CHECK });
  await withTimeout(loadedForControl, "carregar para o controle de CSP");
  await sleep(1500);
  // A variante do hero (<main data-hero-variant>, de siteConfig.heroVariant):
  // a varredura e o passo do hero "expansao" dependem dela.
  const heroVariant = await evalValue(cdp, `document.querySelector("main")?.dataset.heroVariant ?? null`);
  consoleErrors = [];
  await evalValue(cdp, `(() => { new Image().src = ${JSON.stringify(CSP_CONTROL_URL)}; })()`);
  let cspCaught = false;
  for (let i = 0; i < 30 && !cspCaught; i++) {
    await sleep(100);
    cspCaught = consoleErrors.some((error) => error.includes(CSP_CONTROL_HOST));
  }
  // Sai da página antes de zerar, para nenhum evento atrasado do controle
  // cair na primeira largura.
  const blank = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: "about:blank" });
  await withTimeout(blank, "sair da página do controle de CSP");
  consoleErrors = [];
  if (!cspCaught) {
    failures.push(
      `controle de CSP: o detector de CSP não acusou a violação provocada (imagem de ${CSP_CONTROL_HOST}) — ` +
        "bloqueios reais de CSP passariam em silêncio; checagem interrompida. " +
        "Confira também se o servidor está enviando o cabeçalho Content-Security-Policy do next.config.ts",
    );
    throw new CheckAborted();
  }
  console.log(`Controle de CSP: a violação provocada (imagem de ${CSP_CONTROL_HOST}) foi acusada pelo detector.\n`);

  console.log(
    "largura | reduced motion | rolagem horizontal (pior ponto) | erros no console | FAB x controle (360/390/1024/1100/1199)",
  );

  for (const reduce of [false, true]) {
    await cdp.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" }],
    });

    for (const width of WIDTHS) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width,
        height: VIEWPORT_HEIGHT,
        deviceScaleFactor: 1,
        mobile: false,
      });

      consoleErrors = [];
      const loaded = cdp.once("Page.loadEventFired");
      await cdp.send("Page.navigate", { url: URL_TO_CHECK });
      await withTimeout(loaded, `carregar ${URL_TO_CHECK} a ${width}px`);
      await sleep(1500); // hidratação + efeitos de montagem

      const { result } = await withTimeout(
        cdp.send("Runtime.evaluate", { expression: MEASURE_SCRIPT, awaitPromise: true, returnByValue: true }),
        `medir a ${width}px`,
      );
      const worst = result.value;
      // Hero "expansao" sem reduced motion: a 1ª amostra (y=0) é do hero preso
      // e recolhido; a rolagem programática da varredura é uma rolagem que o
      // hero não causou, e a regra dele é completar a expansão (não voltar ao
      // topo). Confere que completou: sem isso, ele seguraria a página.
      const expandedAfter =
        heroVariant === "expansao" && !reduce
          ? await evalValue(cdp, `document.querySelector(${JSON.stringify(HERO_EXP_SELECTOR)})?.dataset.expanded ?? null`)
          : null;
      const errors = [...consoleErrors];

      const overflowLabel = worst.overflow > 0 ? `${worst.overflow}px (em y=${worst.y})` : "nenhuma";
      const checksFab = FAB_CHECK_WIDTHS.has(width);
      const fabLabel = !checksFab ? "—" : worst.fabHit ? `cruza ${worst.fabHit.with}` : "nenhum cruzamento";
      console.log(
        `${String(width).padStart(7)} | ${(reduce ? "ligado" : "desligado").padEnd(14)} | ${overflowLabel.padEnd(31)} | ${String(errors.length).padEnd(17)} | ${fabLabel}`,
      );

      if (worst.overflow > 0) {
        const culprits = worst.offenders.length > 0 ? ` — passa da borda: ${worst.offenders.join(", ")}` : "";
        failures.push(
          `${width}px, reduced motion ${reduce ? "ligado" : "desligado"}: rolagem horizontal de ${worst.overflow}px em y=${worst.y}${culprits}`,
        );
      }
      if (Math.min(worst.maxY, worst.endY) < worst.maxScroll - worst.step) {
        failures.push(
          `${width}px, reduced motion ${reduce ? "ligado" : "desligado"}: a varredura não chegou ao fim da página ou não ficou lá (foi até y=${worst.maxY}, terminou em y=${worst.endY}, de ${worst.maxScroll}; hero preso?) — o que fica abaixo não foi conferido`,
        );
      }
      if (expandedAfter !== null && expandedAfter !== "true") {
        failures.push(
          `${width}px, reduced motion desligado: a rolagem da varredura não completou a expansão do hero (data-expanded=${expandedAfter})`,
        );
      }
      for (const error of errors) {
        failures.push(`${width}px, reduced motion ${reduce ? "ligado" : "desligado"}: erro no console: ${error.split("\n")[0]}`);
      }
      if (checksFab && worst.fabHit) {
        failures.push(
          `${width}px, reduced motion ${reduce ? "ligado" : "desligado"}: o FAB do WhatsApp cruza ${worst.fabHit.with} em y=${worst.fabHit.y}`,
        );
      }
    }
  }

  // --- Hero "estudio": a rolagem troca o quadro; com reduced motion fica no pôster, sem altura extra;
  // ao rolar até a seção seguinte, o fundo preso já soltou ---
  // A variante vem do HTML servido (<main data-hero-variant>, que sai de
  // siteConfig.heroVariant). Com outra variante, o passo avisa que pulou. Com
  // "estudio" e sem o gancho .hero-estudio (o desenho do hero mudou?), reprova:
  // um passo que some calado também "passaria" (como o detector de CSP, Q4).
  // Roda a 1440×900 (lado a lado, quadros do computador) e a 360×740 (quadro
  // em cima, quadros do celular).
  for (const { width, height } of HERO_SIZES) {
    const size = `${width}×${height}`;
    console.log(`\nHero "estudio" a ${size}:`);
    consoleErrors = [];
    try {
      // Estado explícito, sem herdar o que sobrou do passo anterior: o tamanho
      // e reduced motion ligado, o mesmo estado da medida com que a referência
      // de altura é comparada lá embaixo.
      await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
      await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });

      // Referência da altura sem a trilha de rolagem: a página sem JavaScript,
      // que é o HTML do servidor e o 1º render do cliente (ADR-004). Com
      // reduced motion, o hero tem de ficar do mesmo tamanho. A folga de 10% da
      // tela absorve diferenças pequenas de layout; a trilha tem bem mais que isso.
      await cdp.send("Emulation.setScriptExecutionDisabled", { value: true });
      let heroLoaded = cdp.once("Page.loadEventFired");
      await cdp.send("Page.navigate", { url: URL_TO_CHECK });
      await withTimeout(heroLoaded, `carregar sem JavaScript para o passo do hero a ${size}`);
      const staticPage = await evalValue(
        cdp,
        `(async () => {
          await document.fonts.ready;
          const section = document.querySelector(${JSON.stringify(HERO_STUDIO_SELECTOR)});
          return {
            variant: document.querySelector("main")?.dataset.heroVariant ?? null,
            height: section ? section.offsetHeight : null,
            scrub: section ? (section.dataset.scrub ?? null) : null,
          };
        })()`,
        { awaitPromise: true },
      );
      await cdp.send("Emulation.setScriptExecutionDisabled", { value: false });

      if (!staticPage.variant) {
        failures.push("hero estudio: o <main> não diz a variante do hero (data-hero-variant); o passo não sabe o que conferir");
        break;
      }
      if (staticPage.variant !== "estudio") {
        console.log(`  hero estudio: passo pulado (variante ${staticPage.variant})`);
        break;
      }
      if (staticPage.height === null) {
        failures.push(`hero estudio: a variante é "estudio", mas a página não tem ${HERO_STUDIO_SELECTOR} (o gancho do hero mudou?)`);
        break;
      }
      if (staticPage.scrub !== "false") {
        failures.push(`hero estudio a ${size}: sem JavaScript o HTML veio com data-scrub=${staticPage.scrub} (esperado false)`);
      }

      for (const reduce of [false, true]) {
        await cdp.send("Emulation.setEmulatedMedia", {
          features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" }],
        });
        heroLoaded = cdp.once("Page.loadEventFired");
        await cdp.send("Page.navigate", { url: URL_TO_CHECK });
        await withTimeout(heroLoaded, `carregar para o passo do hero a ${size}`);

        const state = await withTimeout(evalValue(cdp, HERO_STUDIO_EXPR, { awaitPromise: true }), `rolar o hero estudio a ${size}`);
        const label = `${size}, reduced motion ${reduce ? "ligado" : "desligado"}`;
        if (!state) {
          failures.push(`hero estudio (${label}): depois de hidratar, a página não tem ${HERO_STUDIO_SELECTOR}`);
          continue;
        }

        if (reduce) {
          if (state.scrub !== "false") failures.push(`hero estudio a ${size}: com reduced motion a animação ligou (data-scrub)`);
          if (Math.abs(state.height - staticPage.height) > state.viewport * 0.1) {
            failures.push(
              `hero estudio a ${size}: com reduced motion a seção ficou com ${state.height}px; sem JavaScript, ${staticPage.height}px (altura extra de rolagem)`,
            );
          }
          if ([state.before, state.middle, state.end].some((frame) => frame !== null)) {
            failures.push(`hero estudio a ${size}: com reduced motion o canvas desenhou quadros`);
          }
          if (!state.posterShown) failures.push(`hero estudio a ${size}: com reduced motion o pôster não apareceu`);
        } else {
          if (state.scrub !== "true") failures.push(`hero estudio a ${size}: sem reduced motion a animação não ligou (data-scrub)`);
          if (state.before !== "0") failures.push(`hero estudio a ${size}: no topo o canvas mostrava o quadro ${state.before}, esperado 0`);
          if (!(Number(state.middle) > 0)) {
            failures.push(`hero estudio a ${size}: rolar até o meio da seção não trocou o quadro (${state.before} → ${state.middle})`);
          }
        }
        console.log(
          `  hero estudio (${label}): scrub=${state.scrub}, quadro ${state.before} → ${state.middle} (meio) → ${state.end} (perto do fim), altura ${state.height}px (sem JavaScript: ${staticPage.height}px), pôster ${state.posterShown ? "carregado" : "não carregado"}`,
        );

        if (!reduce) {
          // O fundo preso não pode cobrir a seção seguinte (Crítico 1 da re-revisão do hero).
          const exit = await withTimeout(
            evalValue(cdp, heroExitExpr(HERO_FUNDO_SELECTOR), { awaitPromise: true }),
            `rolar até ${AFTER_HERO_SELECTOR} a ${size}`,
          );
          if (exit.missing) {
            failures.push(`hero estudio a ${size}: a página não tem ${exit.missing} (o gancho mudou?)`);
          } else {
            if (exit.fundoBottom > exit.top + 0.5) {
              failures.push(
                `hero estudio a ${size}: com ${AFTER_HERO_SELECTOR} no topo (y=${exit.top}), o fundo preso do hero ainda vai até y=${exit.fundoBottom} e cobre a seção`,
              );
            }
            for (const point of exit.covered) {
              failures.push(`hero estudio a ${size}: o topo de ${AFTER_HERO_SELECTOR} está coberto por ${point}`);
            }
            console.log(
              `  hero estudio (${size}, saída): ${AFTER_HERO_SELECTOR} com o topo em y=${exit.top}, pé do fundo em y=${exit.fundoBottom}, ${exit.covered.length === 0 ? "topo da seção livre (6 pontos)" : `${exit.covered.length} ponto(s) coberto(s)!`}`,
            );
          }
        }
      }
    } catch (error) {
      // Um erro aqui não pode derrubar os passos seguintes (menu, vídeos, Tab, 1.4.12).
      failures.push(`hero estudio a ${size}: erro no passo (${error.message}); os passos seguintes continuam`);
    } finally {
      await cdp.send("Emulation.setScriptExecutionDisabled", { value: false }).catch(() => {});
    }
    for (const error of consoleErrors) failures.push(`hero estudio a ${size}: erro no console: ${error.split("\n")[0]}`);
  }

  // --- Hero "expansao": parado sem JavaScript; roda; teclado; âncoras; reduced motion ---
  // Pela variante lida no HTML servido. Com "expansao" e sem o gancho
  // .hero-expansao, a passada sem JavaScript reprova (um passo que some calado
  // também "passaria"). Cada passada tem o próprio tempo-limite e os próprios
  // erros de console; um erro numa não derruba as outras nem os passos
  // seguintes.
  if (heroVariant !== "expansao") {
    console.log(`\nHero "expansao": passo pulado (variante ${heroVariant ?? "não informada"})`);
  } else {
    const runExpPass = async (ctx, what, pass) => {
      consoleErrors = [];
      try {
        return await withTimeout(pass(), `hero expansao a ${ctx.size}, ${what}`);
      } catch (error) {
        ctx.fail(`${what}: erro na passada (${error.message}); as seguintes continuam`);
        return null;
      } finally {
        await cdp.send("Emulation.setScriptExecutionDisabled", { value: false }).catch(() => {});
        for (const error of consoleErrors) ctx.fail(`${what}: erro no console: ${error.split("\n")[0]}`);
      }
    };
    for (const { width, height } of EXPANSAO_SIZES) {
      const size = `${width}×${height}`;
      const ctx = {
        size,
        width,
        height,
        fail: (message) => failures.push(`hero expansao a ${size}: ${message}`),
        log: (message) => console.log(`  ${message}`),
      };
      console.log(`\nHero "expansao" a ${size}:`);
      await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
      const staticHeight = await runExpPass(ctx, "sem JavaScript", () => expNoJsPass(cdp, ctx));
      await runExpPass(ctx, "roda", () => expWheelPass(cdp, ctx, staticHeight));
      // O teclado não depende da largura; as âncoras, sim (barra larga a
      // partir de 75em; abaixo, pelo Menu). O celular deitado fica com a roda.
      if (width === 1440) await runExpPass(ctx, "teclado", () => expKeyPass(cdp, ctx));
      if (width !== 740) await runExpPass(ctx, "âncoras", () => expAnchorPass(cdp, ctx));
      await runExpPass(ctx, "reduced motion", () => expReducedPass(cdp, ctx, staticHeight));
    }
    await setReducedMotion(cdp, false);
  }

  console.log(`\nPasso de interação a ${INTERACTION_WIDTH}px, reduced motion desligado (menu + Tab; vídeos dos aplicativos; Tab pela página; espaçamento de texto 1.4.12):`);
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
  });
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: INTERACTION_WIDTH,
    height: VIEWPORT_HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // --- Menu: abre, sai com Tab, confere que o foco não fica coberto pelo painel ---
  consoleErrors = [];
  let loaded = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: URL_TO_CHECK });
  await withTimeout(loaded, "carregar para o passo de interação (menu)");
  await sleep(1500);

  await clickSelector(cdp, ".topbar__toggle");
  await sleep(300);
  const menuOpened = await evalValue(cdp, `document.querySelector(".topbar")?.getAttribute("data-open") === "true"`);
  if (!menuOpened) {
    failures.push("menu: o botão 'Menu' não abriu o painel (data-open continuou false)");
  } else {
    let exited = false;
    for (let i = 0; i < 15 && !exited; i++) {
      await pressTab(cdp);
      await sleep(120);
      exited = !(await evalValue(
        cdp,
        `!!document.activeElement && !!document.querySelector(".topbar")?.contains(document.activeElement)`,
      ));
    }
    if (!exited) {
      failures.push("menu: o Tab não saiu do painel do menu em 15 passos");
    } else {
      const stillOpen = await evalValue(cdp, `document.querySelector(".topbar")?.getAttribute("data-open") === "true"`);
      const focus = await evalValue(cdp, FOCUS_COVERED_EXPR, { awaitPromise: true });
      console.log(
        `  menu: abriu, Tab saiu, painel ${stillOpen ? "continua aberto" : "fechou"}, foco em ${focus.active ?? "—"}${focus.covered ? " (coberto!)" : ""}${focus.invisible ? ` (invisível, opacidade ${focus.opacity}!)` : ""}`,
      );
      if (stillOpen) failures.push("menu: o painel continuou aberto depois do Tab sair dele (deveria fechar ao perder o foco)");
      if (focus.covered) failures.push(`menu: depois do Tab, o foco (${focus.active}) ficou coberto por outro elemento`);
      if (focus.invisible) {
        failures.push(`menu: depois do Tab, o foco (${focus.active}) ficou num controle invisível (opacidade efetiva ${focus.opacity})`);
      }
    }
  }

  // --- Vídeos: só um toca por vez (grade de aplicativos) e o hero "video", se existir, não toca por cima ---
  // (sem zerar consoleErrors: os erros do passo do menu também contam)
  loaded = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: URL_TO_CHECK });
  await withTimeout(loaded, "carregar para o passo de interação (vídeos)");
  await sleep(1500);

  const playButtons = await evalValue(cdp, `document.querySelectorAll(${JSON.stringify(APPS_PLAY_BUTTON_SELECTOR)}).length`);
  if (playButtons < 2) {
    failures.push(`vídeos: esperava ao menos 2 aplicativos com vídeo na grade, achei ${playButtons}`);
  } else {
    const firstPlaying = await playVideo(cdp, `${appCard(1)} video`, { viaButton: `${appCard(1)} .project-card__play` });
    if (!firstPlaying) failures.push("vídeos: o 1º aplicativo não tocou depois do clique em 'Assistir'");
    const secondPlaying = await playVideo(cdp, `${appCard(2)} video`, { viaButton: `${appCard(2)} .project-card__play` });
    if (!secondPlaying) failures.push("vídeos: o 2º aplicativo não tocou depois do clique em 'Assistir'");
    const playingCount = await evalValue(
      cdp,
      `[...document.querySelectorAll("video")].filter((video) => !video.paused).length`,
    );
    if (playingCount !== 1) failures.push(`vídeos: ${playingCount} vídeos tocando ao mesmo tempo (deveria ser 1)`);
    if (await evalValue(cdp, `!!document.querySelector(${JSON.stringify(HERO_VIDEO_SELECTOR)})`)) {
      await evalValue(cdp, `window.scrollTo({ top: 0, behavior: "instant" })`);
      await sleep(1500);
      if (!(await isPaused(cdp, HERO_VIDEO_SELECTOR))) failures.push("vídeos: o hero tocou sozinho por cima do aplicativo que a pessoa estava vendo");
      const playingAtTop = await evalValue(
        cdp,
        `[...document.querySelectorAll("video")].filter((video) => !video.paused).length`,
      );
      if (playingAtTop > 1) failures.push(`vídeos: de volta ao hero, ${playingAtTop} vídeos tocando ao mesmo tempo (deveria ser no máximo 1)`);
    }
    console.log(`  vídeos: 1º ${firstPlaying ? "tocou" : "não tocou"}, 2º ${secondPlaying ? "tocou" : "não tocou"}; tocando juntos: ${playingCount}`);
  }

  // --- Tab pela página inteira: nenhum controle focado fica sob a barra fixa ---
  for (const width of TAB_WALK_WIDTHS) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: VIEWPORT_HEIGHT,
      deviceScaleFactor: 1,
      mobile: false,
    });
    loaded = cdp.once("Page.loadEventFired");
    await cdp.send("Page.navigate", { url: URL_TO_CHECK });
    await withTimeout(loaded, `carregar para o Tab pela página a ${width}px`);
    await sleep(1500);

    let firstLabel = null;
    let visited = 0;
    let hidden = 0;
    const hits = [];
    for (let i = 0; i < TAB_WALK_MAX_STEPS; i++) {
      await pressTab(cdp);
      const focus = await withTimeout(evalValue(cdp, FOCUS_VS_TOPBAR_EXPR, { awaitPromise: true }), `Tab a ${width}px`);
      if (!focus.active) {
        if (visited > 0) break; // saiu do documento: a volta terminou
        continue;
      }
      if (focus.active === firstLabel) break;
      firstLabel ??= focus.active;
      visited++;
      if (focus.offscreen) hidden++;
      if (focus.underBar || focus.centerCovered || focus.invisible) hits.push(focus);
    }
    console.log(
      `  Tab a ${width}px: ${visited} controles${hidden ? ` (${hidden} fora da tela depois do Tab!)` : ""}, ${hits.length === 0 ? "nenhum sob a barra, coberto ou invisível" : `${hits.length} coberto(s) ou invisível(is)!`}`,
    );
    if (visited < 10) failures.push(`Tab a ${width}px: só ${visited} controles focados — o percurso não andou pela página`);
    if (hidden > 0) failures.push(`Tab a ${width}px: ${hidden} controle(s) focado(s) ficaram fora da tela (a rolagem do foco não aconteceu)`);
    for (const hit of hits) {
      const why = hit.underBar
        ? `ficou sob a barra do topo (topo em y=${hit.top}, barra até y=${hit.barBottom})`
        : hit.centerCovered
          ? "ficou coberto no centro por outro elemento"
          : `ficou focado mas invisível (opacidade efetiva ${hit.opacity})`;
      failures.push(`Tab a ${width}px: ${hit.active} ${why}`);
    }
  }

  // --- WCAG 1.4.12: com o espaçamento de texto do usuário, nada da barra se perde ---
  for (const width of TEXT_SPACING_WIDTHS) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: VIEWPORT_HEIGHT,
      deviceScaleFactor: 1,
      mobile: false,
    });
    loaded = cdp.once("Page.loadEventFired");
    await cdp.send("Page.navigate", { url: URL_TO_CHECK });
    await withTimeout(loaded, `carregar para o espaçamento de texto a ${width}px`);
    await sleep(800);
    await evalValue(
      cdp,
      `(() => { const s = document.createElement("style"); s.textContent = ${JSON.stringify(TEXT_SPACING_CSS)}; document.head.appendChild(s); })()`,
    );
    const spacing = await withTimeout(
      evalValue(cdp, TOPBAR_SPACING_EXPR, { awaitPromise: true }),
      `espaçamento de texto a ${width}px`,
    );
    console.log(
      `  1.4.12 a ${width}px (${spacing.mode}): ${spacing.problems.length === 0 ? "nada cortado, barra no container, moldura livre" : spacing.problems.join("; ")}`,
    );
    for (const problem of spacing.problems) failures.push(`espaçamento de texto (WCAG 1.4.12) a ${width}px: ${problem}`);
  }

  for (const error of consoleErrors) {
    failures.push(`passo de interação: erro no console: ${error.split("\n")[0]}`);
  }

  cdp.close();
} catch (error) {
  if (!(error instanceof CheckAborted)) failures.push(`a checagem não terminou: ${error.message}`);
} finally {
  browser.kill();
  await sleep(500);
  rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

if (failures.length > 0) {
  console.error(`\n${failures.length} problema(s):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(
  "\nDetector de CSP conferido (acusou a violação provocada). " +
    "Sem rolagem horizontal, sem erro no console e sem o FAB do WhatsApp cruzando controle focável (360/390/1024/1100/1199px) em nenhuma largura, com a varredura indo até o fim da página. " +
    'Hero "estudio" (quando é a variante em uso; outra variante aparece como "passo pulado" acima), a 1440×900 e a 360×740: a rolagem troca o quadro, o fundo preso solta antes de #produtos e, com reduced motion, fica no pôster, sem quadro desenhado e sem altura extra. ' +
    'Hero "expansao" (idem), a 1440×900, 360×740 e 740×360: parado e legível sem JavaScript; a roda e o teclado expandem preso (o quadro cresce, o título se abre, o conteúdo aparece) e depois a página rola até Produtos; no topo, recolhe; as âncoras terminam no alvo, sem voltar ao topo; com reduced motion, nunca prende e a altura é a mesma. ' +
    "Menu fecha e o foco não fica coberto nem invisível ao sair com Tab; só um vídeo toca por vez na página e o vídeo do hero, se existir, não toca por cima; " +
    "no Tab pela página (360/390/1024/1200px), nenhum controle focado fica sob a barra fixa do topo, coberto ou invisível; " +
    "com o espaçamento de texto da WCAG 1.4.12 (360–1440px), nada da barra é cortado e ela não cobre o hero.",
);
