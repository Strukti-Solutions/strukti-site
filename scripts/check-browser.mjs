#!/usr/bin/env node
// Abre o site num navegador headless (Edge ou Chrome já instalados, sem
// dependência nova), em várias larguras, com prefers-reduced-motion ligado e
// desligado. Em cada caso rola a página do topo ao fim e falha (exit 1) se:
//   - em algum ponto da rolagem houver rolagem horizontal
//     (scrollWidth > clientWidth), ou
//   - o console do navegador registrar erro (ex.: hidratação divergente).
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
const VIEWPORT_HEIGHT = 900;
const STEP_TIMEOUT_MS = 90_000;

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
  const step = Math.max(150, Math.floor(innerHeight / 4));
  let worst = { overflow: 0, y: 0, offenders: [] };
  for (let y = 0; y <= doc.scrollHeight; y += step) {
    window.scrollTo({ top: y, behavior: "instant" });
    await settle();
    const overflow = doc.scrollWidth - doc.clientWidth;
    if (overflow > worst.overflow) worst = { overflow, y: Math.round(scrollY), offenders: offenders() };
  }
  window.scrollTo({ top: 0, behavior: "instant" });
  return worst;
})()`;

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
  console.log("largura | reduced motion | rolagem horizontal (pior ponto) | erros no console");

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
      console.log(
        `${String(width).padStart(7)} | ${(reduce ? "ligado" : "desligado").padEnd(14)} | ${overflowLabel.padEnd(31)} | ${errors.length}`,
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
    }
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

console.log("\nSem rolagem horizontal e sem erro no console em nenhuma largura.");
