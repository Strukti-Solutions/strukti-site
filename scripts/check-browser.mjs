#!/usr/bin/env node
// Abre o site num navegador headless (Edge ou Chrome já instalados, sem
// dependência nova), em várias larguras, com prefers-reduced-motion ligado e
// desligado. Em cada caso rola a página do topo ao fim e falha (exit 1) se:
//   - em algum ponto da rolagem houver rolagem horizontal
//     (scrollWidth > clientWidth), ou
//   - o console do navegador registrar erro (ex.: hidratação divergente), ou
//   - a 360 ou 390px, o botão flutuante do WhatsApp (a.fab-whatsapp) cruzar a
//     caixa de um botão, campo ou qualquer controle focável visível, em
//     qualquer ponto da rolagem (regra aceita pelo Claudinho, proposta da
//     Crivo na revisão DS1 — 2ª vez que o FAB cobria conteúdo).
//
// Também roda, uma vez, num passo de interação (largura só do celular,
// onde o menu vira botão, reduced motion desligado): abre o menu do TopBar
// e sai com Tab, conferindo que o foco não fica coberto pelo painel; e toca
// cada vídeo do portfólio (Rota de Vendas, depois Fleet Analytics BI),
// conferindo que tocar um pausa o outro e que o autoplay do vídeo de fundo
// do hero nunca toca por cima de um vídeo do portfólio que está tocando
// (regra aceita pelo Claudinho, 2ª vez que um problema só aparecia depois
// de uma interação — MASTER §8.8, src/lib/videoCoordination.ts).
//
// Precisa do site no ar: `npm run dev` (ou `npm run start`) antes.
// Uso: npm run check:browser [-- http://localhost:3000]
// Navegador: detectado sozinho; ou defina BROWSER_PATH.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL_TO_CHECK = process.argv[2] ?? "http://localhost:3000/";
const WIDTHS = [360, 390, 768, 950, 1024, 1100, 1145, 1280, 1440];
const FAB_CHECK_WIDTHS = new Set([360, 390]);
const VIEWPORT_HEIGHT = 900;
const STEP_TIMEOUT_MS = 90_000;
const INTERACTION_WIDTH = 360;

// Pela estrutura, não pelo nome do projeto (que muda) — ver ProjectGrid.tsx
// e OQueJaFizemos.tsx: o destaque vem antes da grade no DOM, então
// "video[controls]" dentro da seção sempre acha o do destaque primeiro.
const FEATURED_VIDEO_SELECTOR = "#o-que-construimos video[controls]";
const GRID_PLAY_BUTTON_SELECTOR = "#o-que-construimos .project-card__play";
const GRID_VIDEO_SELECTOR = "#o-que-construimos .project-card video";
const HERO_VIDEO_SELECTOR = ".hero-video__video";

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

async function evalValue(cdp, expression, { awaitPromise = false } = {}) {
  const { result, exceptionDetails } = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.text);
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
 * Garante que o vídeo está tocando. Com `viaButton` (grade: o vídeo nasce já
 * em autoplay), só clica o botão e espera — clicar no vídeo de novo
 * pausaria o autoplay, já que o clique alterna. Sem `viaButton` (destaque:
 * `controls`, sem autoplay), clica no próprio vídeo para iniciar. Em
 * qualquer caso, reforça com `play()` sob o mesmo gesto se precisar.
 */
async function playVideo(cdp, videoSelector, { viaButton } = {}) {
  if (viaButton) {
    await clickSelector(cdp, viaButton);
    await sleep(400);
  } else {
    await clickSelector(cdp, videoSelector);
    await sleep(200);
  }
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

  let consoleErrors = [];
  cdp.on("Runtime.consoleAPICalled", (params) => {
    if (params.type === "error") {
      consoleErrors.push(params.args.map((arg) => arg.value ?? arg.description ?? "").join(" "));
    }
  });
  cdp.on("Runtime.exceptionThrown", (params) => {
    consoleErrors.push(params.exceptionDetails.exception?.description ?? params.exceptionDetails.text);
  });

  console.log(`Navegador: ${browserPath}\nPágina: ${URL_TO_CHECK}\n`);
  console.log(
    "largura | reduced motion | rolagem horizontal (pior ponto) | erros no console | FAB x controle (360/390)",
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

  console.log(`\nPasso de interação a ${INTERACTION_WIDTH}px, reduced motion desligado (menu + Tab; vídeos do portfólio):`);
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

  // --- Vídeos: só um toca por vez, e o autoplay do hero não toca por cima ---
  consoleErrors = [];
  loaded = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: URL_TO_CHECK });
  await withTimeout(loaded, "carregar para o passo de interação (vídeos)");
  await sleep(1500);

  const featuredPlaying = await playVideo(cdp, FEATURED_VIDEO_SELECTOR);
  if (!featuredPlaying) {
    failures.push("vídeos: o vídeo em destaque não tocou depois do clique");
  } else {
    await evalValue(cdp, `window.scrollTo({ top: 0, behavior: "instant" })`);
    await sleep(1500); // IntersectionObserver + efeito do hero
    const heroPaused = await isPaused(cdp, HERO_VIDEO_SELECTOR);
    if (!heroPaused) {
      failures.push("vídeos: o hero tocou sozinho por cima do vídeo em destaque (que a pessoa estava ouvindo)");
    }
    if (await isPaused(cdp, FEATURED_VIDEO_SELECTOR)) {
      failures.push("vídeos: o vídeo em destaque parou de tocar sozinho ao rolar até o hero");
    }

    const gridPlaying = await playVideo(cdp, GRID_VIDEO_SELECTOR, { viaButton: GRID_PLAY_BUTTON_SELECTOR });
    let gridPausedFeatured = false;
    if (!gridPlaying) {
      failures.push("vídeos: o vídeo da grade não tocou depois do clique em 'Assistir'");
    } else {
      gridPausedFeatured = await isPaused(cdp, FEATURED_VIDEO_SELECTOR);
      if (!gridPausedFeatured) {
        failures.push("vídeos: tocar o vídeo da grade não pausou o destaque (só um vídeo deveria tocar por vez)");
      }
    }
    console.log(
      `  vídeos: destaque tocou (hero ${heroPaused ? "ficou parado" : "tocou por cima!"}); grade ${gridPlaying ? `tocou (destaque ${gridPausedFeatured ? "pausou" : "continuou tocando!"})` : "não tocou"}`,
    );
  }

  for (const error of consoleErrors) {
    failures.push(`passo de interação: erro no console: ${error.split("\n")[0]}`);
  }

  cdp.close();
} catch (error) {
  failures.push(`a checagem não terminou: ${error.message}`);
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
  "\nSem rolagem horizontal, sem erro no console e sem o FAB do WhatsApp cruzando controle focável (360/390px) em nenhuma largura. " +
    "Menu fecha e o foco não fica coberto ao sair com Tab; só um vídeo do portfólio toca por vez e o hero não toca por cima.",
);
