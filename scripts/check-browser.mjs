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
// de siteConfig.heroVariant). Com "estudio", confere a 1440px que a rolagem
// troca o quadro do canvas (do 0 para outro) e que, com reduced motion, a
// animação não liga, nenhum quadro é desenhado e a seção fica com a mesma
// altura da página sem JavaScript (sem a altura extra de rolagem); falha se
// a seção .hero-estudio não existir. Com outra variante, avisa que pulou.
// Usa só os ganchos estáveis do hero (data-scrub, data-frame e o pôster),
// porque o desenho interno dele pode mudar.
//
// Também roda, uma vez, num passo de interação (largura só do celular,
// onde o menu vira botão, reduced motion desligado): abre o menu do TopBar
// e sai com Tab, conferindo que o foco não fica coberto pelo painel; e toca
// os dois primeiros vídeos dos aplicativos (cartões 1 e 2 da grade),
// conferindo que só um toca por vez e que o autoplay do vídeo de fundo do
// hero "video", se existir, nunca toca por cima (regra aceita pelo
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
// ou do container, se a barra cobrir a moldura do hero ou se a página
// ganhar rolagem horizontal.
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
const HERO_VIDEO_SELECTOR = ".hero-video__video";
const HERO_STUDIO_SELECTOR = ".hero-estudio";
const HERO_CANVAS_SELECTOR = ".hero-estudio__canvas";
const HERO_POSTER_SELECTOR = ".hero-estudio__poster";
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
  for (let y = 0; y <= doc.scrollHeight; y += step) {
    window.scrollTo({ top: y, behavior: "instant" });
    await settle();
    const overflow = doc.scrollWidth - doc.clientWidth;
    if (overflow > worst.overflow) worst = { overflow, y: Math.round(scrollY), offenders: offenders() };
    if (!fabHit) {
      const hitWith = fabOverlap();
      if (hitWith) fabHit = { y: Math.round(scrollY), with: hitWith };
    }
  }
  window.scrollTo({ top: 0, behavior: "instant" });
  return { ...worst, fabHit };
})()`;

// O foco atual fica coberto por outro elemento (ex.: um painel fixo que não
// fechou)? Mesma ideia do fabOverlap acima, mas pelo ponto central do
// elemento focado contra o que está de fato visível ali (elementFromPoint).
const FOCUS_COVERED_EXPR = `(() => {
  const active = document.activeElement;
  if (!active || active === document.body) return { active: null, covered: false };
  const r = active.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return { active: active.tagName, covered: false };
  const cx = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1);
  const cy = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
  const atPoint = document.elementFromPoint(cx, cy);
  const covered = !(atPoint === active || active.contains(atPoint) || (atPoint && atPoint.contains(active)));
  const label = active.tagName.toLowerCase() + (active.className ? "." + String(active.className).trim().split(/\\s+/)[0] : "");
  return { active: label, covered };
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
  return { active: label, centerCovered, underBar, top: Math.round(r.top), barBottom: bar ? Math.round(bar.getBoundingClientRect().bottom) : 0 };
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
  const frame = document.querySelector(".hero-video__frame");
  if (frame && bar.getBoundingClientRect().bottom > frame.getBoundingClientRect().top + 0.5) {
    problems.push("a barra cobre o topo da moldura do hero");
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

async function pressTab(cdp) {
  const base = { key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 };
  await cdp.send("Input.dispatchKeyEvent", { type: "rawKeyDown", ...base });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
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

  // --- Hero "estudio": a rolagem troca o quadro; com reduced motion fica no pôster, sem altura extra ---
  // A variante vem do HTML servido (<main data-hero-variant>, que sai de
  // siteConfig.heroVariant). Com outra variante, o passo avisa que pulou. Com
  // "estudio" e sem o gancho .hero-estudio (o desenho do hero mudou?), reprova:
  // um passo que some calado também "passaria" (como o detector de CSP, Q4).
  console.log(`\nHero "estudio" a 1440px:`);
  consoleErrors = [];
  try {
    // Estado explícito, sem herdar o que sobrou do laço de larguras: 1440px e
    // reduced motion ligado, o mesmo estado da medida com que a referência
    // de altura é comparada lá embaixo.
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: VIEWPORT_HEIGHT, deviceScaleFactor: 1, mobile: false });
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });

    // Referência da altura sem a trilha de rolagem: a página sem JavaScript,
    // que é o HTML do servidor e o 1º render do cliente (ADR-004). Com
    // reduced motion, o hero tem de ficar do mesmo tamanho. A folga de 10% da
    // tela absorve diferenças pequenas de layout; a trilha tem bem mais que isso.
    await cdp.send("Emulation.setScriptExecutionDisabled", { value: true });
    let heroLoaded = cdp.once("Page.loadEventFired");
    await cdp.send("Page.navigate", { url: URL_TO_CHECK });
    await withTimeout(heroLoaded, "carregar sem JavaScript para o passo do hero");
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
    } else if (staticPage.variant !== "estudio") {
      console.log(`  hero estudio: passo pulado (variante ${staticPage.variant})`);
    } else if (staticPage.height === null) {
      failures.push(`hero estudio: a variante é "estudio", mas a página não tem ${HERO_STUDIO_SELECTOR} (o gancho do hero mudou?)`);
    } else {
      if (staticPage.scrub !== "false") failures.push(`hero estudio: sem JavaScript o HTML veio com data-scrub=${staticPage.scrub} (esperado false)`);

      for (const reduce of [false, true]) {
        await cdp.send("Emulation.setEmulatedMedia", {
          features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" }],
        });
        heroLoaded = cdp.once("Page.loadEventFired");
        await cdp.send("Page.navigate", { url: URL_TO_CHECK });
        await withTimeout(heroLoaded, "carregar para o passo do hero");

        const state = await withTimeout(evalValue(cdp, HERO_STUDIO_EXPR, { awaitPromise: true }), "rolar o hero estudio");
        const label = `reduced motion ${reduce ? "ligado" : "desligado"}`;
        if (!state) {
          failures.push(`hero estudio (${label}): depois de hidratar, a página não tem ${HERO_STUDIO_SELECTOR}`);
          continue;
        }

        if (reduce) {
          if (state.scrub !== "false") failures.push("hero estudio: com reduced motion a animação ligou (data-scrub)");
          if (Math.abs(state.height - staticPage.height) > state.viewport * 0.1) {
            failures.push(`hero estudio: com reduced motion a seção ficou com ${state.height}px; sem JavaScript, ${staticPage.height}px (altura extra de rolagem)`);
          }
          if ([state.before, state.middle, state.end].some((frame) => frame !== null)) {
            failures.push("hero estudio: com reduced motion o canvas desenhou quadros");
          }
          if (!state.posterShown) failures.push("hero estudio: com reduced motion o pôster não apareceu");
        } else {
          if (state.scrub !== "true") failures.push("hero estudio: sem reduced motion a animação não ligou (data-scrub)");
          if (state.before !== "0") failures.push(`hero estudio: no topo o canvas mostrava o quadro ${state.before}, esperado 0`);
          if (!(Number(state.middle) > 0)) {
            failures.push(`hero estudio: rolar até o meio da seção não trocou o quadro (${state.before} → ${state.middle})`);
          }
        }
        console.log(
          `  hero estudio (${label}): scrub=${state.scrub}, quadro ${state.before} → ${state.middle} (meio) → ${state.end} (perto do fim), altura ${state.height}px (sem JavaScript: ${staticPage.height}px), pôster ${state.posterShown ? "carregado" : "não carregado"}`,
        );
      }
    }
  } catch (error) {
    // Um erro aqui não pode derrubar os passos seguintes (menu, vídeos, Tab, 1.4.12).
    failures.push(`hero estudio: erro no passo (${error.message}); os passos seguintes continuam`);
  } finally {
    await cdp.send("Emulation.setScriptExecutionDisabled", { value: false }).catch(() => {});
  }
  for (const error of consoleErrors) failures.push(`hero estudio: erro no console: ${error.split("\n")[0]}`);

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
      const focus = await evalValue(cdp, FOCUS_COVERED_EXPR);
      console.log(
        `  menu: abriu, Tab saiu, painel ${stillOpen ? "continua aberto" : "fechou"}, foco em ${focus.active ?? "—"}${focus.covered ? " (coberto!)" : ""}`,
      );
      if (stillOpen) failures.push("menu: o painel continuou aberto depois do Tab sair dele (deveria fechar ao perder o foco)");
      if (focus.covered) failures.push(`menu: depois do Tab, o foco (${focus.active}) ficou coberto por outro elemento`);
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
      if (focus.underBar || focus.centerCovered) hits.push(focus);
    }
    console.log(
      `  Tab a ${width}px: ${visited} controles${hidden ? ` (${hidden} fora da tela depois do Tab!)` : ""}, ${hits.length === 0 ? "nenhum sob a barra ou coberto" : `${hits.length} coberto(s)!`}`,
    );
    if (visited < 10) failures.push(`Tab a ${width}px: só ${visited} controles focados — o percurso não andou pela página`);
    if (hidden > 0) failures.push(`Tab a ${width}px: ${hidden} controle(s) focado(s) ficaram fora da tela (a rolagem do foco não aconteceu)`);
    for (const hit of hits) {
      failures.push(
        `Tab a ${width}px: ${hit.active} ${hit.underBar ? `ficou sob a barra do topo (topo em y=${hit.top}, barra até y=${hit.barBottom})` : "ficou coberto no centro por outro elemento"}`,
      );
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
    "Sem rolagem horizontal, sem erro no console e sem o FAB do WhatsApp cruzando controle focável (360/390/1024/1100/1199px) em nenhuma largura. " +
    'Hero "estudio" (quando é a variante em uso; outra variante aparece como "passo pulado" acima): a rolagem troca o quadro e, com reduced motion, fica no pôster, sem quadro desenhado e sem altura extra. ' +
    "Menu fecha e o foco não fica coberto ao sair com Tab; só um vídeo dos aplicativos toca por vez e o hero \"video\", se existir, não toca por cima; " +
    "no Tab pela página (360/390/1024/1200px), nenhum controle focado fica sob a barra fixa do topo; " +
    "com o espaçamento de texto da WCAG 1.4.12 (360–1440px), nada da barra é cortado.",
);
