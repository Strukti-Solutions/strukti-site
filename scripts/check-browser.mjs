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
// 1440×900, 360×740 e 740×360 (celular deitado), nestas passadas:
//   1. sem JavaScript: a composição parada (data-pin="false",
//      data-expanded="false", data-progress="0.00"), com fundo, quadro,
//      pôster e título à vista, sem a dica, e o conteúdo com os dois botões
//      legível e clicável; guarda a altura do hero;
//   2. roda do mouse (eventos de verdade do CDP, de 40 px, no meio da tela):
//      o progresso só sobe, o palco fica preso cobrindo a tela até expandir,
//      o quadro cresce de fato (área ≥ 1,3×; o atributo sozinho não basta)
//      e segue as fórmulas do original em cada amostra (os "mesmos números"
//      do dono: min(300 + 1250p, 95vw) × min(400 + 400p, 85vh, vh − 2 ×
//      barra), 650 × 200 abaixo de 768 px, e a 1ª linha do título a
//      −p × 150vw, 180vw abaixo de 768 px), as duas linhas do título e as
//      legendas se abrem para os lados, o fundo some, o conteúdo aparece, a
//      altura do hero não muda; depois a roda rola até Produtos (sem nada
//      cobrindo o topo dela) e, de volta ao topo, a roda para cima recolhe;
//   3. teclado com o foco no body (só a 1440): Page Down, Espaço (keyDown
//      com texto " ") e seta para baixo expandem e depois rolam a página;
//      End expande e, de novo, vai ao fim; Home recolhe;
//   4. âncoras (menos a 740): escolhe o replay (#replay) no menu "Produtos ▾"
//      da barra fixa sem rolar antes (a 360, pelo Menu), depois outro
//      produto (#fleet-analytics-bi), com o painel do 1º aberto, e abre
//      /#contato direto (passando por about:blank): a página termina no alvo
//      (num produto, o topo da seção #produtos, catálogo §3.4; no
//      scroll-padding-top mais o scroll-margin-top dele), sem voltar ao
//      topo, e 1,5 s depois continua lá; a URL fica no slug; depois de cada
//      produto, só o "Produtos ▾" tem aria-current;
//   5. clique e foco: um clique no quadro preso não cai na mídia nem
//      expande, e o Tab até o controle do vídeo não rola nem expande (abaixo
//      de 640 px, a faixa do FAB no scroll-padding-bottom rolava);
//   6. cores forçadas (só a 1440): o ícone do controle do vídeo, nos dois
//      estados, tem contraste ≥ 3:1 sobre o botão;
//   7. reduced motion: nunca prende, a composição parada, a mesma altura da
//      página sem JavaScript, e a roda e o Page Down rolam a página.
// E, à parte: o espaçamento de texto da WCAG 1.4.12 a 320×568 (barra de
// rolagem clássica) e 320×640 (celular), em que a linha de apoio e a dica
// não podem passar por baixo do controle do vídeo nem sair da largura; e o
// toque de verdade a 390×844 (celular, toque emulado): um dedo arrastado
// 100 px expande 0,39 e segura, e uma pinça amplia a página sem mexer no
// hero. Só usa os ganchos estáveis do hero (data-pin, data-expanded,
// data-progress, data-content, --hx-p e as classes .hero-expansao__*).
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
// O catálogo de produtos (#produtos, spec 2026-10-16 §10), pelos ganchos
// estáveis (data-js, data-estado, data-pos e as classes .catalogo__*), a
// 1440×900 e a 360×740, uma linha de log e uma falha por item:
//   1. sem JavaScript: os 10 cartões no HTML, a fileira rola para o lado
//      dentro da seção (a página não) e o <details> do Rota de Vendas abre
//      com "Para quem é";
//   2. mouse: a seta "Próximo" troca o centro, "Ver detalhes" abre (URL no
//      slug) e o X fecha, com a URL de antes;
//   3. altura constante: o topo da seção seguinte (na tela e no documento)
//      não se mexe mais de 0,5 px fechado, aberto, trocando e fechado de novo;
//   4. teclado: → num cartão lateral troca o centro sem rolar a página; →
//      nas pílulas não troca; com o painel aberto, → no vídeo é do vídeo
//      (Review Focus 2) e no título troca; Esc fecha com o foco no centro;
//   5. a 3ª miniatura abre o Fleet e o filtro "Sites", aberto, o Site para
//      clínicas;
//   6. /#rota-de-vendas carregado abre o painel com a seção no topo; ir à
//      âncora com a página aberta e voltar do navegador fecha (data-estado,
//      sem recarregar);
//   7. reduced motion: 50 ms depois da troca, o transform final, e sem loop;
//   8. o loop do centro para em até 5,5 s, no quadro 0;
//   9. um vídeo por vez com o vídeo do painel, a fita e outro centro.
// E as conferências de uma largura só: o histórico com o Next (abrir,
// fechar, avançar, voltar, sem recarregar); a Visão geral dos 10 cabendo sem
// rolar, a fita de ~110 px e a altura constante a 1440×900 e 1280×800; a
// superfície do painel sem crescer de caixa zerada no ›, nem transform do
// motion nas trocas do coverflow (com um controle positivo: ao abrir, a
// amostragem tem de ver o crescimento); Tab até um ±2 com opacidade 1 e
// contorno; o popover "Produtos ▾" dentro da janela a 1200 px (no topo, na
// cápsula e com a fonte raiz a 125%), com mais espaço entre os itens do que
// entre as linhas de um item; o menu da barra abrindo o Fleet (1440
// e 360, pelo Menu); o toque de verdade a 360 (o dedo para o lado troca,
// para cima rola, e o Enter depois do deslize abre); cores forçadas (setas,
// X e o contorno do ativo na fita ≥ 3:1); o 1.4.12 a 320 px (tudo da
// Visão geral alcançável, sem rolagem para o lado); a pista de rolagem do
// painel a 390×844 (visível no topo de cada painel que rola, some no fim;
// a 1440×900 e 1280×800, sem rolagem, não aparece); e o texto do cartão do
// centro nos 10 produtos a 360×740, 390×844 e 1440×900 (no tamanho padrão,
// cabe sem rolar, com a etiqueta e o selo abaixo do esmaecimento, sobre o
// véu opaco; com o espaçamento do 1.4.12 e com a fonte raiz a 200%, a caixa
// não passa do cartão e a etiqueta, o nome e o "Ver detalhes" ficam
// alcançáveis pela rolagem de dentro dela).
//
// Também roda, uma vez, num passo de interação (largura só do celular,
// onde o menu vira botão, reduced motion desligado): abre o menu do TopBar
// e sai com Tab, conferindo que o foco não fica coberto pelo painel; e toca
// o vídeo do painel do replay e, trocando pela fita, o do Rota de Vendas,
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
// Só algumas etapas: CHECK_BROWSER_ETAPAS=catalogo (ver ETAPAS abaixo).
// Navegador: detectado sozinho; ou defina BROWSER_PATH.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL_TO_CHECK = process.argv[2] ?? "http://localhost:3000/";
// Só algumas etapas (para iterar ou provar uma mutação sem a volta inteira):
// CHECK_BROWSER_ETAPAS=catalogo (ou larguras, hero, expansao, catalogo,
// interacao, separadas por vírgula). Sem a variável, todas. O controle
// positivo de CSP roda sempre.
const ETAPAS = process.env.CHECK_BROWSER_ETAPAS?.split(",").map((etapa) => etapa.trim()).filter(Boolean) ?? null;
const ETAPAS_CONHECIDAS = ["larguras", "hero", "expansao", "catalogo", "interacao"];
// Um nome errado rodaria zero etapas e terminaria verde: falha antes.
const desconhecidas = ETAPAS?.filter((etapa) => !ETAPAS_CONHECIDAS.includes(etapa)) ?? [];
if (desconhecidas.length > 0) {
  console.error(
    `CHECK_BROWSER_ETAPAS desconhecida: ${desconhecidas.join(", ")} (use ${ETAPAS_CONHECIDAS.join(", ")}, separadas por vírgula)`,
  );
  process.exit(2);
}
const roda = (etapa) => !ETAPAS || ETAPAS.includes(etapa);
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

// Pela estrutura, não pelo nome do projeto (que muda).
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
// Roda: muitos passos de 40 px (× 0,0007 = 0,028 de progresso; 0,036 no
// original, antes de o hero ficar ~30% mais lento). 40 px já conta como
// clique de roda de mouse, que é suavizado (o quadro desliza até o alvo):
// cada amostra espera a animação assentar (expSettle). O orçamento sobra
// para expandir (~36 eventos).
const EXP_WHEEL_DELTA = 40;
const EXP_WHEEL_GAIN = 0.0007;
const EXP_WHEEL_BUDGET = 80;
// Produto que o passo de âncoras do "expansao" escolhe no menu "Produtos ▾"
// da barra (catálogo, §3.5): o link é #slug e a página para no topo da seção
// #produtos (§3.4), não no cartão.
const BAR_ANCHOR_SELECTOR = "#replay";
// Outro produto, escolhido em seguida com o painel do 1º aberto: o
// aria-current fica no "Produtos ▾" (revisão do merge, RM-1, era no link).
const BAR_ANCHOR_SIDE_SELECTOR = "#fleet-analytics-bi";
// O menu "Produtos ▾": o botão e os links #slug dele (ganchos estáveis).
const PRODUTOS_BUTTON_SELECTOR = ".topbar__produtos";
const produtoLink = (hash) => `.topbar__produtos-menu a[href="${hash}"]`;

// Catálogo de produtos (#produtos, spec 2026-10-16 §10): só os ganchos
// estáveis do plano (data-js, data-estado, data-pos e as classes .catalogo__*
// do mapa de arquivos), nunca o desenho interno dos cartões e do painel.
const CAT_SELECTOR = "#produtos .catalogo";
const CAT_CORPO_SELECTOR = `${CAT_SELECTOR} .catalogo__corpo`;
const CAT_CENTRO_SELECTOR = `${CAT_SELECTOR} .catalogo__cartao[data-pos="0"]`;
const CAT_VER_SELECTOR = `${CAT_CENTRO_SELECTOR} .catalogo__ver`;
const CAT_PROXIMA_SELECTOR = `${CAT_SELECTOR} .catalogo__seta--proxima`;
const CAT_ANTERIOR_SELECTOR = `${CAT_SELECTOR} .catalogo__seta--anterior`;
const CAT_PAINEL_SELECTOR = `${CAT_SELECTOR} .catalogo__painel`;
const CAT_FECHAR_SELECTOR = `${CAT_PAINEL_SELECTOR} .catalogo__fechar`;
const CAT_PAINEL_PROXIMA_SELECTOR = `${CAT_PAINEL_SELECTOR} .catalogo__painel-seta--proxima`;
const CAT_ASSISTIR_SELECTOR = `${CAT_PAINEL_SELECTOR} button[aria-label^="Assistir"]`;
const CAT_VIDEO_SELECTOR = `${CAT_PAINEL_SELECTOR} .catalogo__video`;
// A N-ésima miniatura da fita (1 = o 1º produto do filtro).
const catMiniatura = (n) => `${CAT_SELECTOR} .catalogo__fita button:nth-child(${n})`;
// A N-ésima pílula do filtro, na ordem da §3.3: Todos, Hardware, Aplicativos, Sites.
const catFiltro = (n) => `${CAT_SELECTOR} .catalogo__filtro button:nth-child(${n})`;
const CAT_TOTAL = 10;
// A fita do estado aberto mede ~110 px (§4).
const CAT_FITA_ALTURA = 110;
const CAT_FITA_FOLGA = 15;
// O loop do cartão para em 5 s (§7, WCAG 2.2.2), com folga para o 1º quadro.
const CAT_LOOP_LIMITE_MS = 5500;
// O passo do catálogo: computador e celular (os ±2 escondidos).
const CAT_SIZES = [
  { width: 1440, height: 900 },
  { width: 360, height: 740 },
];
// O texto do cartão do centro (MASTER §3.4): os dois celulares da medida de
// contraste e o computador.
const CAT_TEXTO_SIZES = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];
// Onde o painel rola por dentro e a pista de rolagem tem de aparecer (§4).
const CAT_PISTA_SIZE = { width: 390, height: 844 };
// Onde a Visão geral precisa caber sem rolar (§4, emenda de 22/10).
const CAT_FIT_SIZES = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
];

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
  // A altura da barra do topo (--hx-barra), medida por uma sonda: o limite
  // do quadro é 100svh − 2 × ela.
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;top:0;left:0;width:0;visibility:hidden;height:var(--hx-barra)";
  root.append(probe);
  const bar = probe.getBoundingClientRect().height;
  probe.remove();
  const hxp = root.style.getPropertyValue("--hx-p");
  return {
    hxp: hxp === "" ? null : Number(hxp),
    bar,
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
  // Onde o alvo para: o scroll-padding-top do html mais o scroll-margin-top
  // dele (se tiver).
  const pad = (parseFloat(getComputedStyle(doc).scrollPaddingTop) || 0) + (parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
  const box = target.getBoundingClientRect();
  const top = box.top;
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
    // Na largura do alvo (que pode não ocupar a linha toda).
    const left = Math.max(0, box.left);
    const width = Math.min(innerWidth, box.right) - left;
    for (const fx of [0.1, 0.5, 0.9]) {
      for (const dy of [4, 48]) {
        const x = Math.round(left + width * fx);
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
    // Os itens da barra marcados como o trecho atual: os links (Equipe,
    // Contato) e o botão "Produtos ▾", que vale pelo #produtos.
    current: [
      ...[...document.querySelectorAll(".topbar__links > li > a[aria-current]")].map((a) => a.getAttribute("href")),
      ...(document.querySelector(".topbar__produtos[aria-current]") ? ["#produtos"] : []),
    ],
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
  ArrowLeft: { key: "ArrowLeft", code: "ArrowLeft", vk: 37 },
  ArrowRight: { key: "ArrowRight", code: "ArrowRight", vk: 39 },
  Escape: { key: "Escape", code: "Escape", vk: 27 },
  // Com o texto "\r": o Blink ativa o botão pelo keypress, como no Espaço.
  Enter: { key: "Enter", code: "Enter", vk: 13, text: "\r" },
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
 * Garante que o vídeo do painel do catálogo está tocando: clica o botão
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
/**
 * Espera a animação da roda de mouse assentar: o --hx-p parado por 3 quadros
 * seguidos (até `ms`). O clique da roda (deltaMode em linhas ou |deltaY| ≥
 * 40 px) leva o quadro até o alvo em ~0,5 s (τ = 120 ms); sem esperar, a
 * amostra pega o quadro a caminho. Devolve se assentou.
 */
const expSettle = (cdp, ms = 2500) =>
  evalValue(
    cdp,
    `new Promise((resolve) => {
  const root = document.querySelector(${JSON.stringify(HERO_EXP_SELECTOR)});
  if (!root) return resolve(false);
  const start = performance.now();
  let last = null;
  let still = 0;
  const tick = () => {
    const now = root.style.getPropertyValue("--hx-p");
    still = now === last ? still + 1 : 0;
    last = now;
    if (still >= 3) return resolve(true);
    if (performance.now() - start > ${ms}) return resolve(false);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})`,
    { awaitPromise: true },
  );
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

/** Espera (até ms) o controle do vídeo aparecer: ele só existe depois de montar. */
async function expWaitMounted(cdp, ms = 5000) {
  for (let waited = 0; waited < ms; waited += 100) {
    const shown = await evalValue(
      cdp,
      `(() => { const b = document.querySelector(".hero-expansao__controle button"); return !!b && !b.hidden; })()`,
    );
    if (shown) return true;
    await sleep(100);
  }
  return false;
}

/** Carrega a página com JavaScript e espera a expansão prender (data-pin="true"), sem espera fixa. */
async function expLoadPinned(cdp, ctx, what) {
  await navigate(cdp, URL_TO_CHECK, `carregar (${what}) a ${ctx.size}`);
  if (await expWaitPin(cdp)) {
    await sleep(300); // os outros efeitos de montagem (vídeo, IntersectionObserver)
    return true;
  }
  const state = await expState(cdp);
  ctx.fail(`${what}: depois de montar, a expansão não prendeu (data-pin=${state?.pin}, scrollY=${state?.scrollY})`);
  return false;
}

/**
 * Os "mesmos números" do original, na geometria de verdade (o atributo e a
 * área sozinhos não pegam uma fórmula trocada): para cada amostra da roda,
 * com o p escrito em --hx-p, o quadro tem min(300 + 1250p, 95vw) ×
 * min(400 + 400p, 85vh, vh − 2 × barra) (650 e 200 abaixo de 768 px), com
 * 1 px de folga, e a 1ª linha do título andou −p × 150vw (180vw) desde
 * p = 0, com 2 px. Amostras de teclado ou salto (300 ms de transição) ficam
 * de fora.
 */
function expCheckFormulas(ctx, what, samples) {
  const s0 = samples[0];
  let checked = 0;
  for (const s of samples) {
    if (s.hxp === null || !s.midia || !s.linha1 || !s0?.linha1) continue;
    if (s !== s0 && s.input !== "wheel" && s.input !== "touch") continue;
    const phone = s.vw < 768;
    const [gw, gh, slide] = phone ? [650, 200, 1.8] : [1250, 400, 1.5];
    const w = Math.min(300 + gw * s.hxp, 0.95 * s.vw);
    const h = Math.min(400 + gh * s.hxp, 0.85 * s.vh, s.vh - 2 * s.bar);
    if (Math.abs(s.midia.w - w) > 1 || Math.abs(s.midia.h - h) > 1) {
      ctx.fail(
        `${what}: com p = ${s.hxp.toFixed(4)}, o quadro tem ${s.midia.w.toFixed(1)}×${s.midia.h.toFixed(1)}; as fórmulas do original dão ${w.toFixed(1)}×${h.toFixed(1)}`,
      );
      return;
    }
    const dx = s.linha1.left - s0.linha1.left;
    const expected = -s.hxp * slide * s.vw;
    if (Math.abs(dx - expected) > 2) {
      ctx.fail(`${what}: com p = ${s.hxp.toFixed(4)}, a 1ª linha do título andou ${dx.toFixed(1)}px; o original dá ${expected.toFixed(1)}px`);
      return;
    }
    checked++;
  }
  if (checked < 3) ctx.fail(`${what}: só ${checked} amostra(s) para conferir as fórmulas do quadro e do título`);
  return checked;
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
  let unsettled = 0;
  while (wheels < EXP_WHEEL_BUDGET && samples.at(-1).expanded !== "true") {
    for (let k = 0; k < 4; k++, wheels++) await wheelAt(cdp, x, y, EXP_WHEEL_DELTA);
    if (!(await expSettle(cdp))) unsettled++;
    samples.push(await expState(cdp));
  }
  if (unsettled > 0) ctx.fail(`roda: a animação da roda não assentou em ${unsettled} amostra(s) (o --hx-p seguiu mudando por 2,5 s)`);
  // O ganho, na roda de verdade: 4 cliques de 40 px, já assentados.
  const firstStep = 4 * EXP_WHEEL_DELTA * EXP_WHEEL_GAIN;
  if (samples[1] && samples[1].hxp !== null && Math.abs(samples[1].hxp - firstStep) > 0.02) {
    ctx.fail(`roda: 4 eventos de ${EXP_WHEEL_DELTA}px levaram o progresso a ${samples[1].hxp.toFixed(4)} (esperado ${firstStep.toFixed(3)}, × ${EXP_WHEEL_GAIN})`);
  }
  expCheckForward(ctx, "roda", samples);
  for (let i = 1; i < samples.length; i++) {
    if (area(samples[i].midia) < area(samples[i - 1].midia) - 1) {
      ctx.fail(`roda: o quadro encolheu indo para baixo (progresso ${samples[i - 1].progress} → ${samples[i].progress})`);
      break;
    }
  }
  const formulas = expCheckFormulas(ctx, "roda", samples);
  const last = samples.at(-1);
  ctx.log(
    `roda: ${wheels} eventos de ${EXP_WHEEL_DELTA}px; progresso ${samples.map((s) => s.progress).join(" → ")}; fórmulas do quadro e do título conferidas em ${formulas ?? 0} amostra(s)`,
  );
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
    await expSettle(cdp);
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

/** Depois do clique na barra, o item da seção (e só ele) tem aria-current: num produto, o "Produtos ▾". */
function expCheckCurrent(ctx, what, state, targetSelector) {
  if (state && (state.current.length !== 1 || state.current[0] !== targetSelector)) {
    ctx.fail(`${what}: aria-current em ${JSON.stringify(state.current)} (esperado só ${targetSelector}, a seção do item clicado)`);
  }
}

/** O elemento existe e tem caixa à vista? */
const shownExpr = (selector) =>
  `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; })()`;

/**
 * Deixa à mostra o link de um produto no menu "Produtos ▾" (§3.5): abre o
 * Menu se o botão não está à mostra (abaixo de 75em, ele fica no painel) e
 * depois a lista. Devolve se foi pelo Menu.
 */
async function showProdutoLink(cdp, ctx, hash, what) {
  const barShown = await evalValue(cdp, shownExpr(PRODUTOS_BUTTON_SELECTOR));
  if (!barShown) {
    await clickFixed(cdp, ".topbar__toggle");
    await sleep(300);
    if (!(await evalValue(cdp, `document.querySelector(".topbar")?.getAttribute("data-open") === "true"`))) {
      ctx.fail(`${what}: o Menu não abriu`);
    }
  }
  if (!(await evalValue(cdp, shownExpr(produtoLink(hash))))) {
    await clickFixed(cdp, PRODUTOS_BUTTON_SELECTOR);
    await sleep(300);
    if (!(await evalValue(cdp, shownExpr(produtoLink(hash))))) {
      ctx.fail(`${what}: "Produtos ▾" não mostrou o link ${hash} (aria-expanded=${await evalValue(cdp, `document.querySelector(${JSON.stringify(PRODUTOS_BUTTON_SELECTOR)})?.getAttribute("aria-expanded") ?? null`)})`);
    }
  }
  return !barShown;
}

/** 4. Âncoras: os produtos pelo menu "Produtos ▾" da barra fixa (o 1º sem rolar antes) e /#contato direto. */
async function expAnchorPass(cdp, ctx) {
  await setReducedMotion(cdp, false);
  if (await expLoadPinned(cdp, ctx, "âncora da barra")) {
    const viaMenu = await showProdutoLink(cdp, ctx, BAR_ANCHOR_SELECTOR, "âncora da barra");
    const before = await expState(cdp);
    if (before.scrollY > 0.5) ctx.fail(`âncora da barra: a página saiu do topo antes do clique (scrollY ${before.scrollY})`);
    await clickFixed(cdp, produtoLink(BAR_ANCHOR_SELECTOR));
    // A página para no topo da seção (§3.4), não no cartão; a URL fica no slug.
    const state = await evalValue(cdp, expAnchorExpr(AFTER_HERO_SELECTOR), { awaitPromise: true });
    const what = `âncora da barra, ${BAR_ANCHOR_SELECTOR}${viaMenu ? " (pelo Menu)" : ""}`;
    expCheckAnchor(ctx, what, state, AFTER_HERO_SELECTOR);
    if (state && state.hash !== BAR_ANCHOR_SELECTOR) ctx.fail(`${what}: a URL ficou com "${state.hash}" (esperado ${BAR_ANCHOR_SELECTOR})`);
    if (state && state.expanded !== "true") ctx.fail(`${what}: o hero não completou a expansão (data-expanded=${state.expanded})`);
    expCheckCurrent(ctx, what, state, AFTER_HERO_SELECTOR);
    await sleep(1500);
    const later = await evalValue(cdp, expAnchorExpr(AFTER_HERO_SELECTOR), { awaitPromise: true });
    expCheckAnchor(ctx, `${what}, 1,5 s depois`, later, AFTER_HERO_SELECTOR);
    expCheckCurrent(ctx, `${what}, 1,5 s depois`, later, AFTER_HERO_SELECTOR);
    ctx.log(
      `${what}: ${AFTER_HERO_SELECTOR} em y=${state?.top} (scroll-padding + margin ${state?.pad}), scrollY ${state?.scrollY}, URL ${state?.hash}; 1,5 s depois em y=${later?.top}; data-expanded=${state?.expanded}; aria-current ${JSON.stringify(later?.current)}`,
    );

    // Em seguida, outro produto pelo menu, com a página já em Produtos e o
    // painel do 1º aberto: a página continua no topo da seção.
    const sideMenu = await showProdutoLink(cdp, ctx, BAR_ANCHOR_SIDE_SELECTOR, `âncora da barra, ${BAR_ANCHOR_SIDE_SELECTOR}`);
    const sideWhat = `âncora da barra, ${BAR_ANCHOR_SIDE_SELECTOR}${sideMenu ? " (pelo Menu)" : ""}`;
    await clickFixed(cdp, produtoLink(BAR_ANCHOR_SIDE_SELECTOR));
    const side = await evalValue(cdp, expAnchorExpr(AFTER_HERO_SELECTOR), { awaitPromise: true });
    expCheckAnchor(ctx, sideWhat, side, AFTER_HERO_SELECTOR);
    if (side && side.hash !== BAR_ANCHOR_SIDE_SELECTOR) ctx.fail(`${sideWhat}: a URL ficou com "${side.hash}" (esperado ${BAR_ANCHOR_SIDE_SELECTOR})`);
    expCheckCurrent(ctx, sideWhat, side, AFTER_HERO_SELECTOR);
    ctx.log(
      `${sideWhat}: ${AFTER_HERO_SELECTOR} em y=${side?.top} (scroll-padding + margin ${side?.pad}), scrollY ${side?.scrollY} (antes ${later?.scrollY}), URL ${side?.hash}; aria-current ${JSON.stringify(side?.current)}`,
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
  // Sem espera fixa: o controle do vídeo aparece quando o hero monta (o
  // expStaticExpr reprova se ele não aparecer).
  await expWaitMounted(cdp);
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

// Um ponto do quadro preso que esteja à vista (abaixo do título): o que o
// elementFromPoint acha lá e se é a própria mídia (que não pode receber clique).
const EXP_CARD_POINT_EXPR = `(() => {
  const midia = document.querySelector(${JSON.stringify(EXP_MIDIA_SELECTOR)});
  if (!midia) return null;
  const r = midia.getBoundingClientRect();
  for (const f of [0.85, 0.75, 0.92]) {
    const x = Math.round(r.left + r.width / 2);
    const y = Math.round(r.top + r.height * f);
    const el = document.elementFromPoint(x, y);
    if (!el || !midia.contains(el) || el.closest(".hero-expansao__legendas")) continue;
    const cls = typeof el.className === "string" ? el.className.trim().split(/\\s+/)[0] : "";
    return { x, y, hit: el.tagName.toLowerCase() + (cls ? "." + cls : ""), media: !!el.closest("video, picture, img") };
  }
  return null;
})()`;

/**
 * 6. Clique no quadro e Tab até o controle do vídeo, preso: nada expande nem
 * rola. A mídia não recebe clique (senão o <video tabindex="-1"> ganha foco,
 * e o foco no hero completa a expansão); abaixo de 640 px, o foco no
 * controle (na faixa do scroll-padding-bottom do FAB) não pode rolar a
 * página, porque a rolagem também completaria a expansão.
 */
async function expFocusPass(cdp, ctx) {
  await setReducedMotion(cdp, false);
  if (!(await expLoadPinned(cdp, ctx, "clique e foco"))) return;
  const point = await evalValue(cdp, EXP_CARD_POINT_EXPR);
  let clickNote = "sem ponto à vista";
  if (!point) ctx.fail("clique no quadro: nenhum ponto do quadro preso à vista abaixo do título");
  else {
    if (point.media) ctx.fail(`clique no quadro: o clique cai na mídia (${point.hit}); ela não pode receber clique (pointer-events: none)`);
    await clickAt(cdp, point.x, point.y);
    await sleep(500);
    const clicked = await expState(cdp);
    if (clicked.pin !== "true" || clicked.progress !== "0.00" || clicked.scrollY > 0.5) {
      ctx.fail(
        `clique no quadro: a expansão andou (data-pin=${clicked.pin}, progresso ${clicked.progress}, scrollY ${clicked.scrollY}, foco em ${clicked.active})`,
      );
    }
    clickNote = `clique em ${point.hit} (${point.x}, ${point.y}): progresso ${clicked.progress}, foco em ${clicked.active}`;
  }
  let tabs = 0;
  let where = "fora";
  while (tabs < 20 && where === "fora") {
    await pressTab(cdp);
    tabs++;
    where = await evalValue(
      cdp,
      `(() => { const a = document.activeElement; const root = document.querySelector(${JSON.stringify(HERO_EXP_SELECTOR)}); if (a && a.closest(".hero-expansao__controle")) return "controle"; return root && root.contains(a) ? "hero" : "fora"; })()`,
    );
  }
  if (where !== "controle") {
    ctx.fail(`Tab até o controle do vídeo: ${where === "hero" ? "outra coisa do hero ganhou o foco antes" : `não chegou em ${tabs} Tabs`}`);
    return;
  }
  await sleep(700); // a rolagem suave do foco, se houvesse
  const focused = await expState(cdp);
  if (focused.scrollY > 0.5 || focused.pin !== "true" || focused.expanded !== "false" || focused.progress !== "0.00") {
    ctx.fail(
      `Tab até o controle do vídeo: a página rolou ou a expansão andou (scrollY ${focused.scrollY}, data-pin=${focused.pin}, progresso ${focused.progress}); focar nele não pode expandir`,
    );
  }
  ctx.log(`clique e foco: ${clickNote}; ${tabs} Tab(s) até o controle do vídeo, scrollY ${focused.scrollY}, data-pin=${focused.pin}`);
}

// Cores forçadas: o ícone do controle do vídeo nos dois estados (o atributo
// trocado só para ler o estilo; volta como estava). O ícone precisa de cor
// própria (fundo ou gradiente) com contraste ≥ 3:1 sobre o botão.
const EXP_FORCED_ICON_EXPR = `(() => {
  const button = document.querySelector(".hero-expansao__controle button");
  const icon = button && button.querySelector(".hero-video__toggle-icon");
  if (!icon) return null;
  const rgb = (text) => { const m = /rgba?\\(([^)]*)\\)/.exec(text || ""); if (!m) return null; const [r, g, b, a = 1] = m[1].split(",").map(Number); return { r, g, b, a }; };
  const lum = ({ r, g, b }) => { const c = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b); };
  const ratio = (x, y) => { const [hi, lo] = [lum(x), lum(y)].sort((p, q) => q - p); return (hi + 0.05) / (lo + 0.05); };
  const read = (playing) => {
    button.dataset.playing = playing;
    const s = getComputedStyle(icon);
    const back = rgb(getComputedStyle(button).backgroundColor);
    const fill = s.backgroundImage.includes("gradient") ? rgb(s.backgroundImage) : rgb(s.backgroundColor);
    const visible = !!fill && fill.a > 0.5 && !!back;
    return { fill: fill ? [fill.r, fill.g, fill.b, fill.a].join(",") : "nenhum", back: back ? [back.r, back.g, back.b, back.a].join(",") : "?", ratio: visible ? Math.round(ratio(fill, back) * 100) / 100 : 0 };
  };
  const was = button.dataset.playing;
  const result = { pausar: read("true"), tocar: read("false") };
  button.dataset.playing = was;
  return result;
})()`;

/** 7. Cores forçadas (alto contraste): o ícone do controle do vídeo continua à vista. */
async function expForcedColorsPass(cdp, ctx) {
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "forced-colors", value: "active" },
      { name: "prefers-reduced-motion", value: "no-preference" },
    ],
  });
  try {
    await navigate(cdp, URL_TO_CHECK, `carregar com cores forçadas a ${ctx.size}`);
    if (!(await expWaitMounted(cdp))) {
      ctx.fail("cores forçadas: o controle do vídeo não apareceu depois de montar");
      return;
    }
    const icons = await evalValue(cdp, EXP_FORCED_ICON_EXPR);
    if (!icons) {
      ctx.fail("cores forçadas: sem o ícone do controle do vídeo");
      return;
    }
    for (const [what, icon] of Object.entries(icons)) {
      if (icon.ratio < 3) {
        ctx.fail(`cores forçadas: o ícone "${what}" do controle do vídeo some (cor ${icon.fill} sobre ${icon.back}, contraste ${icon.ratio}:1)`);
      }
    }
    ctx.log(`cores forçadas: ícone "pausar" ${icons.pausar.ratio}:1 e "tocar" ${icons.tocar.ratio}:1 sobre o botão`);
  } finally {
    await setReducedMotion(cdp, false);
  }
}

// Com o espaçamento do 1.4.12 já aplicado: as linhas da linha de apoio e da
// dica (as caixas de cada linha, por um Range) contra o controle do vídeo.
const EXP_SPACING_EXPR = `(async () => {
  await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const root = document.querySelector(${JSON.stringify(HERO_EXP_SELECTOR)});
  const button = root && root.querySelector(".hero-expansao__controle button");
  if (!button) return null;
  const cw = document.documentElement.clientWidth;
  const t = button.getBoundingClientRect();
  const problems = [];
  let bottom = 0;
  for (const [sel, what] of [[".hero-expansao__data", "a linha de apoio"], [".hero-expansao__dica", "a dica"]]) {
    const el = root.querySelector(sel);
    if (!el) continue;
    const range = document.createRange();
    range.selectNodeContents(el);
    const lines = [...range.getClientRects()];
    lines.forEach((r, i) => {
      if (sel === ".hero-expansao__data") bottom = Math.max(bottom, r.bottom);
      const w = Math.min(r.right, t.right) - Math.max(r.left, t.left);
      const h = Math.min(r.bottom, t.bottom) - Math.max(r.top, t.top);
      if (w > 0.5 && h > 0.5) problems.push(what + ", linha " + (i + 1) + ": o controle do vídeo cobre " + Math.round(w) + "px dela");
      if (r.left < -0.5 || r.right > cw + 0.5) problems.push(what + ", linha " + (i + 1) + ": passa da largura da tela (x " + Math.round(r.left) + "–" + Math.round(r.right) + ")");
    });
  }
  return { problems, cw, bottom: Math.round(bottom), vh: innerHeight };
})()`;

/**
 * 8. WCAG 1.4.12 nas telas mais estreitas (320 px, com a barra de rolagem
 * clássica e a sobreposta do celular) e o zoom de 400% (1280 × 1024 a 4×:
 * 320 × 256, sem espaçamento): a linha de apoio e a dica não passam por
 * baixo do controle do vídeo nem saem da largura da tela, e a linha de apoio
 * termina dentro da tela (preso, em p = 0: a página não rola e a expansão a
 * leva para o lado, então uma linha abaixo da tela nunca seria lida).
 */
async function expSpacingPass(cdp, ctx, { mobile, dsf = 1, spaced = true }) {
  const what = spaced ? "espaçamento 1.4.12" : `zoom de ${dsf * 100}%`;
  await setReducedMotion(cdp, false);
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: ctx.width, height: ctx.height, deviceScaleFactor: dsf, mobile });
  if (!(await expLoadPinned(cdp, ctx, what))) return;
  if (spaced) {
    await evalValue(
      cdp,
      `(() => { const s = document.createElement("style"); s.textContent = ${JSON.stringify(TEXT_SPACING_CSS)}; document.head.appendChild(s); })()`,
    );
  }
  const result = await evalValue(cdp, EXP_SPACING_EXPR, { awaitPromise: true });
  if (!result) {
    ctx.fail(`${what}: sem o controle do vídeo`);
    return;
  }
  const where = mobile ? "celular" : "barra clássica";
  if (result.bottom > result.vh + 0.5) {
    result.problems.push(`a linha de apoio termina em y=${result.bottom}, abaixo da tela (${result.vh}), enquanto o hero segura`);
  }
  for (const problem of result.problems) ctx.fail(`${what} (${where}): ${problem}`);
  ctx.log(
    `${what} (${where}, largura útil ${result.cw}px): ${result.problems.length === 0 ? "legendas livres do controle do vídeo, dentro da largura e da altura" : `${result.problems.length} problema(s)`}; a linha de apoio vai até y=${result.bottom} (tela de ${result.vh})`,
  );
}

/**
 * 9. Toque de verdade (celular com toque emulado, Input.dispatchTouchEvent):
 * um dedo arrastado 100 px para cima expande 0,39 (× 0,0039, na hora) e segura; uma
 * pinça (dois dedos se abrindo) amplia a página e não mexe no hero, nem pela
 * rolagem que o zoom causa.
 */
async function expTouchPass(cdp, ctx) {
  await setReducedMotion(cdp, false);
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: ctx.width, height: ctx.height, deviceScaleFactor: 2, mobile: true });
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  try {
    if (!(await expLoadPinned(cdp, ctx, "toque"))) return;
    const x = Math.round(ctx.width / 2);
    const y0 = Math.round(ctx.height * 0.8);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y0, id: 1 }] });
    for (let i = 1; i <= 5; i++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y0 - i * 20, id: 1 }] });
      await sleep(30);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    const dragged = await expState(cdp);
    if (Math.abs(Number(dragged.progress) - 0.39) > 0.02 || dragged.pin !== "true" || !holdsViewport(dragged)) {
      ctx.fail(`toque: um dedo, 100 px para cima: progresso ${dragged.progress}, data-pin=${dragged.pin}, scrollY ${dragged.scrollY} (esperado 0.39 e preso)`);
    }

    if (!(await expLoadPinned(cdp, ctx, "pinça"))) return;
    const cy = Math.round(ctx.height / 2);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: x - 30, y: cy, id: 1 },
        { x: x + 30, y: cy + 8, id: 2 },
      ],
    });
    for (let i = 1; i <= 12; i++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { x: x - 30 - i * 10, y: cy - i, id: 1 },
          { x: x + 30 + i * 10, y: cy + 8 + i, id: 2 },
        ],
      });
      await sleep(30);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(600);
    const pinched = await expState(cdp);
    const scale = await evalValue(cdp, `window.visualViewport ? visualViewport.scale : 1`);
    if (pinched.pin !== "true" || pinched.progress !== "0.00") {
      ctx.fail(`toque: a pinça mexeu no hero (data-pin=${pinched.pin}, progresso ${pinched.progress}, scrollY ${pinched.scrollY}, zoom ${scale})`);
    }
    ctx.log(
      `toque: um dedo, 100 px: progresso ${dragged.progress}, preso; pinça: zoom ${Math.round(scale * 100) / 100}×, progresso ${pinched.progress}, data-pin=${pinched.pin}`,
    );
  } finally {
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false }).catch(() => {});
    await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 }).catch(() => {});
  }
}

// --- Catálogo de produtos (#produtos): as passadas (cada uma recebe o tamanho e onde anotar) ---

// A seção logo depois de #produtos: o topo dela não pode se mexer ao abrir,
// trocar ou fechar (altura constante, §4).
const CAT_SEGUINTE_EXPR = `(document.querySelector("#produtos + section") ?? document.querySelector("#produtos")?.nextElementSibling ?? null)`;

// Os ganchos do catálogo de uma vez: estado, centro, painel, fita, URL,
// rolagem, o topo da seção seguinte (na tela e no documento: a âncora de
// rolagem do navegador pode compensar uma mudança de altura mexendo no
// scrollY, e o topo no documento não se deixa enganar), a rolagem interna do
// painel, o foco e a marca que a passada põe em window (some se a página
// recarregar).
const CAT_STATE_EXPR = `(() => {
  const raiz = document.querySelector(${JSON.stringify(CAT_SELECTOR)});
  if (!raiz) return null;
  const centro = raiz.querySelector('.catalogo__cartao[data-pos="0"]');
  const painel = raiz.querySelector(".catalogo__painel");
  const interior = painel && painel.querySelector(".catalogo__painel-interior");
  const fita = raiz.querySelector(".catalogo__fita");
  const atual = fita && fita.querySelector('button[aria-current="true"]');
  const seguinte = ${CAT_SEGUINTE_EXPR};
  const r = seguinte ? seguinte.getBoundingClientRect() : null;
  const a = document.activeElement;
  const cls = a && typeof a.className === "string" && a.className.trim() ? "." + a.className.trim().split(/\\s+/)[0] : "";
  return {
    js: raiz.dataset.js ?? null,
    estado: raiz.dataset.estado ?? null,
    centro: centro ? centro.id : null,
    painel: painel ? (painel.querySelector(".catalogo__painel-nome")?.textContent.trim() ?? "") : null,
    aba: painel ? (painel.querySelector('[role="tab"][aria-selected="true"]')?.textContent.trim() ?? null) : null,
    fita: atual ? atual.textContent.trim() : null,
    hash: location.hash,
    href: location.href,
    scrollX,
    scrollY,
    seguinte: r ? r.top : null,
    seguinteDoc: r ? r.top + scrollY : null,
    interior: interior ? { sh: interior.scrollHeight, ch: interior.clientHeight } : null,
    // A pista de rolagem (o ::after do interior, §4): a opacidade agora.
    pista: interior ? Number(getComputedStyle(interior, "::after").opacity) : null,
    fitaAltura: fita ? fita.getBoundingClientRect().height : null,
    focoNoCentro: !!centro && !!a && centro.contains(a),
    focoNoVideo: !!a && a.matches(".catalogo__video"),
    foco: a && a !== document.body ? a.tagName.toLowerCase() + cls : "body",
    loops: raiz.querySelectorAll(".catalogo__loop").length,
    tocando: [...document.querySelectorAll("video")].filter((v) => !v.paused).length,
    loopsTocando: [...raiz.querySelectorAll(".catalogo__loop")].filter((v) => !v.paused).length,
    marca: window.__catMarca ?? null,
  };
})()`;

const catState = (cdp) => evalValue(cdp, CAT_STATE_EXPR);

/** Espera (até ms) a expressão da página dar verdadeiro; devolve se deu. */
function catWait(cdp, condition, ms = 4000) {
  return evalValue(
    cdp,
    `(async () => {
      const end = performance.now() + ${ms};
      const ok = () => { try { return !!(${condition}); } catch { return false; } };
      while (!ok() && performance.now() < end) await new Promise((resolve) => setTimeout(resolve, 50));
      return ok();
    })()`,
    { awaitPromise: true },
  );
}

const catAberto = `document.querySelector(${JSON.stringify(CAT_SELECTOR)})?.dataset.estado === "aberto"`;
const catFechado = `document.querySelector(${JSON.stringify(CAT_SELECTOR)})?.dataset.estado === "fechado"`;

/** O nome de um produto pelo cartão dele (o slug é o id). */
const catNome = (cdp, slug) =>
  evalValue(cdp, `document.getElementById(${JSON.stringify(slug)})?.querySelector(".catalogo__nome")?.textContent.trim() ?? null`);

/**
 * Carrega a página (passando por about:blank: de "/#x" para "/" não haveria
 * load), espera o catálogo montar (data-js="true"), põe a marca em window e,
 * se pedido, centraliza a caixa do catálogo na tela, sem rolagem suave. Sem
 * reduced motion, espera a entrada dos cartões em sequência (§7).
 */
async function catLoad(cdp, ctx, what, { reduce = false, center = true, hash = "" } = {}) {
  await setReducedMotion(cdp, reduce);
  await navigate(cdp, "about:blank", `sair da página antes de ${what}`);
  await navigate(cdp, new URL(hash, URL_TO_CHECK).href, `carregar (${what}) a ${ctx.size}`);
  if (!(await catWait(cdp, `document.querySelector(${JSON.stringify(CAT_SELECTOR)})?.dataset.js === "true"`, 8000))) {
    ctx.fail(`${what}: o catálogo não montou (sem ${CAT_SELECTOR}[data-js="true"])`);
    return false;
  }
  await evalValue(cdp, `window.__catMarca = "viva"`);
  if (center) await catCenter(cdp, reduce);
  return true;
}

/** A caixa do catálogo no meio da tela (a rolagem completa a expansão do hero; centra de novo depois). */
async function catCenter(cdp, reduce) {
  const centerExpr = `document.querySelector(${JSON.stringify(CAT_CORPO_SELECTOR)})?.scrollIntoView({ block: "center", behavior: "instant" })`;
  await evalValue(cdp, centerExpr);
  await sleep(400);
  await evalValue(cdp, centerExpr);
  await sleep(reduce ? 200 : 1300);
}

/**
 * Clica no centro do elemento onde ele está. Se ali há outra coisa (a barra
 * fixa, por exemplo), rola até ele, clica e devolve a página ao scrollY de
 * antes: as medidas de altura comparam o topo da seção seguinte na tela.
 */
async function catClick(cdp, selector) {
  const spot = await evalValue(
    cdp,
    `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      const at = () => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return null;
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const hit = x >= 0 && y >= 0 && x < innerWidth && y < innerHeight ? document.elementFromPoint(x, y) : null;
        return { x, y, free: !!hit && (hit === el || el.contains(hit)) };
      };
      const y0 = scrollY;
      let p = at();
      if (p && !p.free) {
        el.scrollIntoView({ block: "center", behavior: "instant" });
        p = at();
        return p && { ...p, y0 };
      }
      return p && { ...p, y0: null };
    })()`,
  );
  if (!spot) throw new Error(`elemento não encontrado (ou sem caixa) para clicar: ${selector}`);
  await clickAt(cdp, spot.x, spot.y);
  if (spot.y0 !== null) {
    await sleep(50);
    await evalValue(cdp, `window.scrollTo({ top: ${spot.y0}, behavior: "instant" })`);
  }
}

/** Põe o foco no elemento (sem rolar) e devolve se conseguiu. */
const catFocus = (cdp, selector) =>
  evalValue(
    cdp,
    `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.focus({ preventScroll: true }); return document.activeElement === el; })()`,
  );

/** O topo da seção seguinte não muda entre as medidas (≤ 0,5 px, na tela e no documento). */
function catCheckAltura(ctx, what, medidas) {
  const valores = (k) => medidas.map(([, s]) => s[k]);
  const desvio = (k) => Math.max(...valores(k)) - Math.min(...valores(k));
  const texto = medidas.map(([nome, s]) => `${nome} y=${s.seguinte?.toFixed(1)} (doc ${s.seguinteDoc?.toFixed(1)})`).join(", ");
  if (medidas.some(([, s]) => s.seguinte === null)) {
    ctx.fail(`${what}: a página não tem seção depois de #produtos para medir`);
    return texto;
  }
  if (desvio("seguinte") > 0.5 || desvio("seguinteDoc") > 0.5) {
    ctx.fail(`${what}: o topo da seção seguinte se mexeu (${texto}); a altura do catálogo tem de ser a mesma nos dois estados (§4)`);
  }
  return texto;
}

/** 1. Sem JS: os 10 produtos no HTML, a fileira rola de lado dentro da seção e o <details> abre. */
async function catNoJsPass(cdp, ctx) {
  await setReducedMotion(cdp, false);
  await cdp.send("Emulation.setScriptExecutionDisabled", { value: true });
  try {
    await navigate(cdp, "about:blank", "sair da página antes do catálogo sem JavaScript");
    await navigate(cdp, URL_TO_CHECK, `carregar sem JavaScript a ${ctx.size}`);
    // Síncrono (sem requestAnimationFrame, que não roda sem JavaScript).
    const page = await evalValue(
      cdp,
      `(async () => {
        await document.fonts.ready;
        const raiz = document.querySelector(${JSON.stringify(CAT_SELECTOR)});
        if (!raiz) return null;
        const palco = raiz.querySelector(".catalogo__palco");
        const doc = document.documentElement;
        palco.scrollIntoView({ block: "center", behavior: "instant" });
        palco.scrollLeft = 200;
        const rolou = palco.scrollLeft > 0;
        palco.scrollLeft = 0;
        return {
          js: raiz.dataset.js ?? null,
          cartoes: raiz.querySelectorAll(".catalogo__cartao").length,
          rolou,
          palco: { sw: palco.scrollWidth, cw: palco.clientWidth },
          pagina: { sw: doc.scrollWidth, cw: doc.clientWidth },
        };
      })()`,
      { awaitPromise: true },
    );
    if (!page) {
      ctx.fail(`sem JavaScript: a página não tem ${CAT_SELECTOR}`);
      return;
    }
    if (page.js !== "false") ctx.fail(`sem JavaScript: data-js=${page.js} (esperado false)`);
    if (page.cartoes !== CAT_TOTAL) ctx.fail(`sem JavaScript: ${page.cartoes} cartões no HTML (esperado ${CAT_TOTAL})`);
    if (!(page.palco.sw > page.palco.cw && page.rolou)) {
      ctx.fail(`sem JavaScript: a fileira não rola para o lado (largura ${page.palco.sw} em ${page.palco.cw})`);
    }
    if (page.pagina.sw > page.pagina.cw) ctx.fail(`sem JavaScript: a página rola de lado (${page.pagina.sw - page.pagina.cw}px)`);

    // O painel de quem está sem JS: o <details> do cartão, aberto por um clique de verdade.
    // O cartão no começo da fileira e a página com ele no meio; o
    // scroll-snap assenta depois do scrollIntoView, e só então o clique.
    const summary = "#rota-de-vendas .catalogo__ficha summary";
    await evalValue(cdp, `document.getElementById("rota-de-vendas")?.scrollIntoView({ block: "center", inline: "start", behavior: "instant" })`);
    await sleep(400);
    const point = await clickFixed(cdp, summary);
    await sleep(300);
    const ficha = await evalValue(
      cdp,
      `(() => {
        const d = document.querySelector("#rota-de-vendas .catalogo__ficha");
        if (!d) return null;
        const alvo = [...d.querySelectorAll("*")].find((el) => el.children.length === 0 && el.textContent.includes("Para quem é"));
        const r = alvo ? alvo.getBoundingClientRect() : null;
        const hit = document.elementFromPoint(${point.x}, ${point.y});
        const cls = hit && typeof hit.className === "string" && hit.className.trim() ? "." + hit.className.trim().split(/\\s+/)[0] : "";
        return { open: d.open, achou: !!alvo, visivel: d.open && !!r && r.width > 0 && r.height > 0, hit: hit ? hit.tagName.toLowerCase() + cls : "nada" };
      })()`,
    );
    if (!ficha) ctx.fail("sem JavaScript: o cartão do Rota de Vendas não tem o <details> (.catalogo__ficha)");
    else if (!ficha.open || !ficha.visivel) {
      ctx.fail(
        `sem JavaScript: o clique no "Ver detalhes" do Rota de Vendas não abriu o <details> com "Para quem é" (open=${ficha.open}, achou=${ficha.achou}; no ponto do clique, ${ficha.hit})`,
      );
    }
    ctx.log(
      `sem JavaScript: ${page.cartoes} cartões, fileira de ${page.palco.sw}px em ${page.palco.cw}px${page.rolou ? " (rola)" : ""}, página ${page.pagina.sw}/${page.pagina.cw}px; <details> do Rota de Vendas ${ficha?.open ? "aberto" : "fechado"}, "Para quem é" ${ficha?.visivel ? "à vista" : "não visto"}`,
    );
  } finally {
    await cdp.send("Emulation.setScriptExecutionDisabled", { value: false });
  }
}

/**
 * 2, 3 e 5. Mouse: a seta troca o centro, "Ver detalhes" abre (URL no slug),
 * a 3ª miniatura e o filtro "Sites" trocam o produto aberto e o X fecha (a
 * URL volta ao que era). O topo da seção seguinte é medido fechado, aberto,
 * depois de cada troca e de novo fechado.
 */
async function catMousePass(cdp, ctx) {
  if (!(await catLoad(cdp, ctx, "mouse"))) return;
  const s0 = await catState(cdp);
  await catClick(cdp, CAT_PROXIMA_SELECTOR);
  await sleep(900);
  const s1 = await catState(cdp);
  if (s1.centro === s0.centro) ctx.fail(`mouse: a seta "Próximo" não trocou o centro (${s0.centro})`);
  ctx.log(`mouse: a seta "Próximo" levou o centro de ${s0.centro} a ${s1.centro}`);

  const medidas = [["fechado", s1]];
  await catClick(cdp, CAT_VER_SELECTOR);
  await catWait(cdp, catAberto);
  await sleep(1000);
  const s2 = await catState(cdp);
  const nome2 = await catNome(cdp, s1.centro);
  if (s2.estado !== "aberto") ctx.fail(`mouse: "Ver detalhes" não abriu o painel (data-estado=${s2.estado})`);
  if (s2.hash !== `#${s1.centro}`) ctx.fail(`mouse: aberto, a URL ficou com "${s2.hash}" (esperado #${s1.centro})`);
  if (s2.painel !== nome2) ctx.fail(`mouse: o painel abriu "${s2.painel}" (esperado "${nome2}")`);
  medidas.push(["aberto", s2]);

  // 5. A 3ª miniatura (Fleet) e o filtro "Sites", com o painel aberto.
  await catClick(cdp, catMiniatura(3));
  await sleep(700);
  const s3 = await catState(cdp);
  const fleet = await catNome(cdp, "fleet-analytics-bi");
  if (s3.fita !== fleet || s3.painel !== fleet) {
    ctx.fail(`miniaturas: a 3ª miniatura deixou o aria-current em "${s3.fita}" e o painel em "${s3.painel}" (esperado "${fleet}")`);
  }
  medidas.push(["trocando (miniatura)", s3]);
  const sitesTexto = await evalValue(cdp, `document.querySelector(${JSON.stringify(catFiltro(4))})?.textContent.trim() ?? null`);
  if (sitesTexto !== "Sites") ctx.fail(`filtro: a 4ª pílula é "${sitesTexto}" (esperado "Sites", na ordem da §3.3)`);
  await catClick(cdp, catFiltro(4));
  await sleep(700);
  const s4 = await catState(cdp);
  const clinicas = await catNome(cdp, "site-clinicas");
  if (s4.estado !== "aberto" || s4.painel !== clinicas) {
    ctx.fail(`filtro: "Sites" com o painel aberto deixou data-estado=${s4.estado} e o painel em "${s4.painel}" (esperado "${clinicas}")`);
  }
  medidas.push(["filtro Sites", s4]);
  ctx.log(`miniaturas e filtro: a 3ª miniatura abriu "${s3.painel}" (aria-current em "${s3.fita}"); "Sites" abriu "${s4.painel}", URL ${s4.hash}`);

  await catClick(cdp, CAT_FECHAR_SELECTOR);
  await catWait(cdp, catFechado);
  await sleep(600);
  const s5 = await catState(cdp);
  if (s5.estado !== "fechado") ctx.fail(`mouse: o X não fechou o painel (data-estado=${s5.estado})`);
  if (s5.href !== s1.href) ctx.fail(`mouse: fechado pelo X, a URL ficou ${s5.href} (era ${s1.href} antes de abrir)`);
  if (s5.marca !== "viva") ctx.fail("mouse: a página recarregou entre abrir e fechar (a marca em window sumiu)");
  medidas.push(["fechado de novo", s5]);
  ctx.log(`mouse: "Ver detalhes" abriu "${s2.painel}" em ${s2.hash}; o X fechou e a URL voltou a ${new URL(s5.href).hash || "(sem âncora)"}`);
  const alturas = catCheckAltura(ctx, "altura constante", medidas);
  ctx.log(`altura constante: topo da seção seguinte ${alturas}`);
}

/**
 * 4. Teclado: → num cartão lateral troca o centro sem rolar a página; → nas
 * pílulas do filtro não troca; com o painel aberto, → no vídeo é do vídeo
 * (Review Focus 2) e no título troca o produto; Esc fecha e o foco volta ao
 * cartão do centro.
 */
async function catKeyPass(cdp, ctx) {
  if (!(await catLoad(cdp, ctx, "teclado"))) return;
  const lateral = `${CAT_SELECTOR} .catalogo__cartao[data-pos="1"]`;
  if (!(await catFocus(cdp, lateral))) {
    ctx.fail("teclado: o cartão lateral (+1) não aceitou o foco");
    return;
  }
  const s0 = await catState(cdp);
  await pressKey(cdp, KEYS.ArrowRight);
  await sleep(900);
  const s1 = await catState(cdp);
  if (s1.centro === s0.centro) ctx.fail(`teclado: → num cartão lateral não trocou o centro (${s0.centro})`);
  if (s1.scrollY !== s0.scrollY || s1.scrollX !== s0.scrollX) {
    ctx.fail(`teclado: → num cartão lateral rolou a página (scroll ${s0.scrollX},${s0.scrollY} → ${s1.scrollX},${s1.scrollY})`);
  }
  if (!s1.focoNoCentro) ctx.fail(`teclado: depois de →, o foco ficou em ${s1.foco}, fora do novo centro`);

  // As pílulas ficam fora do carrossel: → nelas não troca o produto.
  await catFocus(cdp, catFiltro(1));
  await pressKey(cdp, KEYS.ArrowRight);
  await sleep(300);
  const s2 = await catState(cdp);
  if (s2.centro !== s1.centro) ctx.fail(`teclado: → numa pílula do filtro trocou o centro (${s1.centro} → ${s2.centro})`);

  // Enter no "Ver detalhes" abre; Enter no "Assistir" toca o vídeo, com o foco nele.
  await catFocus(cdp, CAT_VER_SELECTOR);
  await pressKey(cdp, KEYS.Enter);
  if (!(await catWait(cdp, catAberto))) {
    ctx.fail("teclado: Enter no \"Ver detalhes\" não abriu o painel");
    return;
  }
  await sleep(1000);
  const nomeAberto = (await catState(cdp)).painel;
  let videoNote = "sem vídeo";
  if (await catFocus(cdp, CAT_ASSISTIR_SELECTOR)) {
    await pressKey(cdp, KEYS.Enter);
    await catWait(cdp, `document.activeElement?.matches(".catalogo__video")`, 3000);
    const v0 = await catState(cdp);
    if (!v0.focoNoVideo) ctx.fail(`teclado: depois do Enter no "Assistir", o foco ficou em ${v0.foco} (esperado o vídeo)`);
    else {
      await pressKey(cdp, KEYS.ArrowRight);
      await sleep(500);
      const v1 = await catState(cdp);
      if (v1.painel !== nomeAberto) ctx.fail(`teclado: → no vídeo do painel trocou o produto ("${nomeAberto}" → "${v1.painel}"); a seta é do vídeo (Review Focus 2)`);
      videoNote = `→ no vídeo ficou em "${v1.painel}"`;
    }
    await evalValue(cdp, `document.querySelector(${JSON.stringify(CAT_VIDEO_SELECTOR)})?.pause()`);
  } else ctx.fail(`teclado: o painel de "${nomeAberto}" não tem o botão "Assistir" (${CAT_ASSISTIR_SELECTOR})`);

  // Fora das abas e do vídeo (o título), → troca o produto.
  await catFocus(cdp, `${CAT_PAINEL_SELECTOR} .catalogo__painel-nome`);
  await pressKey(cdp, KEYS.ArrowRight);
  await sleep(700);
  const s3 = await catState(cdp);
  if (s3.painel === nomeAberto) ctx.fail(`teclado: → no título do painel não trocou o produto ("${nomeAberto}")`);

  await pressKey(cdp, KEYS.Escape);
  await catWait(cdp, catFechado);
  await sleep(600);
  const s4 = await catState(cdp);
  if (s4.estado !== "fechado") ctx.fail(`teclado: Esc não fechou o painel (data-estado=${s4.estado})`);
  else if (!s4.focoNoCentro) ctx.fail(`teclado: depois do Esc, o foco ficou em ${s4.foco}, fora do cartão do centro (${s4.centro})`);
  ctx.log(
    `teclado: → no lateral levou o centro de ${s0.centro} a ${s1.centro} (scrollY ${s0.scrollY} → ${s1.scrollY}, foco ${s1.foco}); → na pílula: ${s2.centro}; ${videoNote}; → no título: "${nomeAberto}" → "${s3.painel}"; Esc: data-estado=${s4.estado}, foco ${s4.foco} no centro (${s4.centro}): ${s4.focoNoCentro}`,
  );
}

/**
 * 6. Link direto: carregar /#rota-de-vendas abre o painel com a seção no
 * topo; e, com a página já aberta, ir a /#rota-de-vendas e voltar do
 * navegador fecha o painel (data-estado, sem sair nem recarregar a página).
 */
async function catLinkPass(cdp, ctx) {
  await setReducedMotion(cdp, false);
  const slug = "rota-de-vendas";
  await navigate(cdp, "about:blank", "sair da página antes do link direto");
  await navigate(cdp, new URL(`#${slug}`, URL_TO_CHECK).href, `carregar /#${slug} a ${ctx.size}`);
  const aberto = await catWait(cdp, catAberto, 8000);
  await sleep(1500);
  const anchor = await evalValue(cdp, expAnchorExpr(AFTER_HERO_SELECTOR), { awaitPromise: true });
  const s0 = await catState(cdp);
  const nome = await catNome(cdp, slug);
  if (!aberto || s0.painel !== nome) ctx.fail(`link direto: /#${slug} não abriu o painel de "${nome}" (data-estado=${s0.estado}, painel "${s0.painel}")`);
  expCheckAnchor(ctx, `link direto /#${slug}`, anchor, AFTER_HERO_SELECTOR);
  ctx.log(`link direto: /#${slug} abriu "${s0.painel}"; ${AFTER_HERO_SELECTOR} em y=${anchor?.top} (scroll-padding ${anchor?.pad}), scrollY ${anchor?.scrollY}`);

  if (!(await catLoad(cdp, ctx, "voltar do navegador", { center: false }))) return;
  const antes = await catState(cdp);
  // Navegação no mesmo documento (só a âncora): cria a entrada, sem load.
  await cdp.send("Page.navigate", { url: new URL(`#${slug}`, URL_TO_CHECK).href });
  if (!(await catWait(cdp, catAberto))) ctx.fail(`voltar do navegador: ir a /#${slug} com a página aberta não abriu o painel`);
  await sleep(800);
  await evalValue(cdp, "history.back()");
  const fechou = await catWait(cdp, catFechado);
  await sleep(500);
  const s1 = await catState(cdp);
  if (!s1 || s1.marca !== "viva") ctx.fail("voltar do navegador: a página recarregou ou saiu (a marca em window sumiu)");
  else {
    if (!fechou) ctx.fail(`voltar do navegador: o painel não fechou (data-estado=${s1.estado})`);
    if (s1.hash !== antes.hash) ctx.fail(`voltar do navegador: a URL ficou com "${s1.hash}" (esperado "${antes.hash}", sem #${slug})`);
  }
  ctx.log(`voltar do navegador: depois de /#${slug}, history.back() deixou data-estado=${s1?.estado}, URL "${s1?.hash}", página ${s1?.marca === "viva" ? "a mesma" : "recarregada!"}`);
}

/** 7. Reduced motion: a troca é instantânea (50 ms depois, o transform final) e não existe loop. */
async function catReducedPass(cdp, ctx) {
  if (!(await catLoad(cdp, ctx, "reduced motion", { reduce: true }))) return;
  const s0 = await catState(cdp);
  await catClick(cdp, CAT_PROXIMA_SELECTOR);
  await sleep(50);
  const after = await evalValue(
    cdp,
    `(() => {
      const c = document.querySelector(${JSON.stringify(CAT_CENTRO_SELECTOR)});
      return { centro: c ? c.id : null, transform: c ? getComputedStyle(c).transform : null, loops: document.querySelectorAll(".catalogo__loop").length };
    })()`,
  );
  if (after.centro === s0.centro) ctx.fail(`reduced motion: a seta "Próximo" não trocou o centro (${s0.centro})`);
  if (!["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(after.transform)) {
    ctx.fail(`reduced motion: 50 ms depois da troca, o novo centro ainda tem transform ${after.transform} (esperado o final, sem transição)`);
  }
  if (after.loops > 0 || s0.loops > 0) ctx.fail(`reduced motion: existe .catalogo__loop (${Math.max(after.loops, s0.loops)}); sem movimento, nada de loop`);
  ctx.log(`reduced motion: 50 ms depois de "Próximo", o centro ${after.centro} tem transform ${after.transform}; loops: ${after.loops}`);
}

/** 8. Loop: o do centro toca e para em até 5,5 s, de volta ao quadro 0. */
async function catLoopPass(cdp, ctx) {
  if (!(await catLoad(cdp, ctx, "loop"))) return;
  const loop = await evalValue(
    cdp,
    `(async () => {
      const sel = ${JSON.stringify(`${CAT_CENTRO_SELECTOR} .catalogo__loop`)};
      const wait = () => new Promise((resolve) => setTimeout(resolve, 50));
      let end = performance.now() + 6000;
      let v = document.querySelector(sel);
      while (!(v && !v.paused && v.currentTime > 0) && performance.now() < end) { await wait(); v = document.querySelector(sel); }
      if (!(v && !v.paused && v.currentTime > 0)) return { tocou: false, existe: !!v };
      const t0 = performance.now();
      end = t0 + 8000;
      while (!v.paused && document.contains(v) && performance.now() < end) await wait();
      return { tocou: true, ms: Math.round(performance.now() - t0), paused: v.paused, currentTime: v.currentTime, loop: v.loop };
    })()`,
    { awaitPromise: true },
  );
  if (!loop.tocou) {
    ctx.fail(`loop: o loop do cartão do centro não tocou (${loop.existe ? "o <video> existe, parado" : "sem .catalogo__loop no centro"})`);
    return;
  }
  if (!loop.paused || loop.ms > CAT_LOOP_LIMITE_MS) ctx.fail(`loop: o loop do centro tocou ${loop.ms} ms sem parar (limite ${CAT_LOOP_LIMITE_MS} ms, WCAG 2.2.2)`);
  else if (loop.currentTime !== 0) ctx.fail(`loop: parou no tempo ${loop.currentTime} (esperado 0, o quadro igual à arte)`);
  ctx.log(`loop: tocou e parou em ${loop.ms} ms (paused=${loop.paused}, currentTime ${loop.currentTime}, atributo loop=${loop.loop})`);
}

/**
 * 9. Um vídeo por vez: com o vídeo do painel tocando, nenhum loop toca; a
 * troca pela fita não deixa dois tocando; e, depois de fechar (o painel sai
 * com o vídeo dele), centralizar outro cartão nunca deixa dois tocando.
 */
async function catOneVideoPass(cdp, ctx) {
  if (!(await catLoad(cdp, ctx, "um vídeo por vez"))) return;
  await catClick(cdp, CAT_VER_SELECTOR);
  await catWait(cdp, catAberto);
  await sleep(1000);
  await catClick(cdp, CAT_ASSISTIR_SELECTOR);
  const tocou = await catWait(cdp, `(() => { const v = document.querySelector(${JSON.stringify(CAT_VIDEO_SELECTOR)}); return !!v && !v.paused && v.currentTime > 0; })()`, 4000);
  const s0 = await catState(cdp);
  if (!tocou) ctx.fail("um vídeo por vez: o vídeo do painel não tocou depois do clique em \"Assistir\"");
  if (s0.tocando > 1 || s0.loopsTocando > 0) ctx.fail(`um vídeo por vez: com o vídeo do painel tocando, ${s0.tocando} vídeos tocam (${s0.loopsTocando} loop)`);
  // Uma amostra a cada 50 ms (1,5 s): o pior número de vídeos tocando juntos.
  const sample = (ms) =>
    evalValue(
      cdp,
      `(async () => {
        let max = 0, loops = 0;
        const end = performance.now() + ${ms};
        while (performance.now() < end) {
          max = Math.max(max, [...document.querySelectorAll("video")].filter((v) => !v.paused).length);
          loops = Math.max(loops, [...document.querySelectorAll(".catalogo__loop")].filter((v) => !v.paused).length);
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return { max, loops };
      })()`,
      { awaitPromise: true },
    );
  await catClick(cdp, catMiniatura(2));
  const troca = await sample(1500);
  if (troca.max > 1 || troca.loops > 0) ctx.fail(`um vídeo por vez: trocando pela fita com o vídeo tocando, até ${troca.max} vídeos juntos (${troca.loops} loop)`);
  await catClick(cdp, CAT_FECHAR_SELECTOR);
  await catWait(cdp, catFechado);
  await catClick(cdp, CAT_PROXIMA_SELECTOR);
  const depois = await sample(2500);
  if (depois.max > 1) ctx.fail(`um vídeo por vez: depois de fechar e centralizar outro cartão, ${depois.max} vídeos tocaram juntos`);
  ctx.log(
    `um vídeo por vez: vídeo do painel ${tocou ? "tocando" : "parado"} (${s0.tocando} na página, ${s0.loopsTocando} loop); na troca pela fita, no máximo ${troca.max} (${troca.loops} loop); fechado e com outro centro, no máximo ${depois.max}`,
  );
}

// --- Catálogo, conferências de uma largura só ---

/**
 * O histórico com o Next 15 (pushState/replaceState no useCatalogo): abrir,
 * fechar, avançar e voltar do navegador sem recarregar (a marca em window
 * sobrevive) e com o painel certo.
 */
async function catHistoryPass(cdp, ctx) {
  if (!(await catLoad(cdp, ctx, "histórico"))) return;
  const s0 = await catState(cdp);
  const nome = await catNome(cdp, s0.centro);
  const passos = [];
  const passo = async (what, action, condition, expected) => {
    await action();
    await catWait(cdp, condition);
    await sleep(900);
    const s = await catState(cdp);
    passos.push(`${what}: ${s?.estado ?? "?"} ${s?.hash || "(sem âncora)"}${s?.painel ? ` "${s.painel}"` : ""}`);
    if (!s || s.marca !== "viva") {
      ctx.fail(`histórico, ${what}: a página recarregou (a marca em window sumiu)`);
      return false;
    }
    if (s.estado !== expected.estado || s.hash !== expected.hash || (expected.painel && s.painel !== expected.painel)) {
      ctx.fail(`histórico, ${what}: data-estado=${s.estado}, URL "${s.hash}", painel "${s.painel}" (esperado ${expected.estado}, "${expected.hash}"${expected.painel ? `, "${expected.painel}"` : ""})`);
    }
    return true;
  };
  const aberto = { estado: "aberto", hash: `#${s0.centro}`, painel: nome };
  const fechado = { estado: "fechado", hash: s0.hash };
  // Para no 1º passo que recarregou (os seguintes não diriam nada).
  for (const [what, action, condition, expected] of [
    ["abrir", () => catClick(cdp, CAT_VER_SELECTOR), catAberto, aberto],
    ["fechar (X)", () => catClick(cdp, CAT_FECHAR_SELECTOR), catFechado, fechado],
    ["avançar", () => evalValue(cdp, "history.forward()"), catAberto, aberto],
    ["voltar", () => evalValue(cdp, "history.back()"), catFechado, fechado],
  ]) {
    if (!(await passo(what, action, condition, expected))) break;
  }
  ctx.log(`histórico: ${passos.join("; ")}`);
}

/**
 * A Visão geral dos 10 produtos cabe sem rolar dentro do painel, a fita
 * mede ~110 px e o topo da seção seguinte não muda entre fechado, aberto e
 * trocando (§4; a 1440×900 e a 1280×800).
 */
async function catFitPass(cdp, ctx) {
  if (!(await catLoad(cdp, ctx, "Visão geral"))) return;
  const medidas = [["fechado", await catState(cdp)]];
  await catClick(cdp, CAT_VER_SELECTOR);
  await catWait(cdp, catAberto);
  await sleep(1000);
  const rolam = [];
  let fita = null;
  for (let i = 1; i <= CAT_TOTAL; i++) {
    if (i > 1) {
      await catClick(cdp, catMiniatura(i));
      await sleep(700);
    }
    const s = await catState(cdp);
    medidas.push([`aberto ${i}`, s]);
    if (s.aba !== "Visão geral") ctx.fail(`Visão geral: no produto ${i} ("${s.painel}"), a aba selecionada é "${s.aba}"`);
    if (!s.interior) ctx.fail(`Visão geral: no produto ${i}, sem o painel (.catalogo__painel-interior)`);
    else if (s.interior.sh > s.interior.ch + 1) rolam.push(`"${s.painel}" (${s.interior.sh}px em ${s.interior.ch}px)`);
    else if (s.pista > 0.01) ctx.fail(`Visão geral: "${s.painel}" cabe sem rolar, mas a pista de rolagem aparece (opacidade ${s.pista})`);
    fita = s.fitaAltura;
  }
  if (rolam.length > 0) ctx.fail(`Visão geral: rola dentro do painel em ${rolam.join(", ")}; ela tem de caber sem rolar a partir de 1280×800 (§4)`);
  if (fita === null || Math.abs(fita - CAT_FITA_ALTURA) > CAT_FITA_FOLGA) {
    ctx.fail(`Visão geral: a fita mede ${fita?.toFixed(1)}px (esperado ~${CAT_FITA_ALTURA} ± ${CAT_FITA_FOLGA}px)`);
  }
  await catClick(cdp, CAT_FECHAR_SELECTOR);
  await catWait(cdp, catFechado);
  await sleep(600);
  medidas.push(["fechado de novo", await catState(cdp)]);
  const alturas = catCheckAltura(ctx, "Visão geral, altura constante", medidas);
  const resumo = medidas.map(([, s]) => s.seguinte?.toFixed(1));
  ctx.log(
    `Visão geral: ${CAT_TOTAL - rolam.length} de ${CAT_TOTAL} cabem sem rolar; fita de ${fita?.toFixed(1)}px; topo da seção seguinte ${[...new Set(resumo)].join(" / ")}${rolam.length ? ` (${alturas})` : ""}`,
  );
}

// A camada da pista de rolagem e onde o painel está na tela.
const CAT_PISTA_EXPR = `(() => {
  const interior = document.querySelector(${JSON.stringify(CAT_PAINEL_SELECTOR)} + " .catalogo__painel-interior");
  if (!interior) return null;
  const p = getComputedStyle(interior, "::after");
  const r = interior.getBoundingClientRect();
  return {
    nome: document.querySelector(".catalogo__painel-nome")?.textContent.trim() ?? "",
    sh: interior.scrollHeight, ch: interior.clientHeight, topo: interior.scrollTop,
    content: p.content, position: p.position, opacidade: Number(p.opacity), altura: parseFloat(p.height), fundo: p.backgroundImage,
    naTela: r.top >= 0 && r.bottom <= innerHeight,
    // A borda de baixo visível do painel: o lado de dentro da borda da
    // superfície (o interior passa por baixo dela), ou o fim do interior.
    borda: (() => {
      const sup = interior.parentElement?.querySelector(":scope > .catalogo__painel-superficie");
      const fim = r.top + interior.clientTop + interior.clientHeight;
      if (!sup) return fim;
      return Math.min(fim, sup.getBoundingClientRect().bottom - parseFloat(getComputedStyle(sup).borderBottomWidth));
    })(),
  };
})()`;

/**
 * A caixa do ::after do interior (a pista), pelo DevTools: o pseudo-elemento
 * não tem getBoundingClientRect. Devolve o topo e o fundo na tela, ou null.
 */
async function catPistaCaixa(cdp) {
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const { nodeId } = await cdp.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: `${CAT_PAINEL_SELECTOR} .catalogo__painel-interior`,
  });
  if (!nodeId) return null;
  const { node } = await cdp.send("DOM.describeNode", { nodeId, depth: 1 });
  const after = (node.pseudoElements ?? []).find((p) => p.pseudoType === "after");
  if (!after) return null;
  const { model } = await cdp.send("DOM.getBoxModel", { backendNodeId: after.backendNodeId });
  const ys = model.border.filter((_, i) => i % 2 === 1);
  return { topo: Math.min(...ys), fundo: Math.max(...ys) };
}

/**
 * A pista de rolagem do painel (§4, exceção do celular): onde o painel rola
 * por dentro, a borda de baixo esmaece enquanto há mais a rolar e a pista
 * some no fim. Confere a regra (::after colado embaixo, com degradê), que a
 * pista encosta na borda de baixo visível do painel (±1 px) e a opacidade no
 * topo e no fim da rolagem, nos 3 reais (que têm vídeo e texto)
 * e num inventado.
 */
async function catPistaPass(cdp, ctx) {
  if (!(await catLoad(cdp, ctx, "pista de rolagem"))) return;
  await catClick(cdp, CAT_VER_SELECTOR);
  await catWait(cdp, catAberto);
  await sleep(1200);
  const notas = [];
  let conferidos = 0;
  for (const n of [1, 2, 3, 4]) {
    if (n > 1) {
      await catClick(cdp, catMiniatura(n));
      await sleep(700);
    }
    await evalValue(cdp, `document.querySelector(${JSON.stringify(CAT_PAINEL_SELECTOR)} + " .catalogo__painel-interior").scrollTop = 0`);
    await sleep(200);
    const topo = await evalValue(cdp, CAT_PISTA_EXPR);
    if (!topo) {
      ctx.fail(`pista de rolagem: no produto ${n}, sem o painel (.catalogo__painel-interior)`);
      continue;
    }
    if (topo.content === "none" || topo.position !== "sticky" || !(topo.altura > 0) || !topo.fundo.includes("gradient")) {
      ctx.fail(`pista de rolagem: em "${topo.nome}", a regra do ::after não está lá (content ${topo.content}, position ${topo.position}, altura ${topo.altura}, fundo ${topo.fundo.slice(0, 40)})`);
      continue;
    }
    if (!topo.naTela) ctx.fail(`pista de rolagem: em "${topo.nome}", o painel não está inteiro na tela para conferir`);
    if (topo.sh <= topo.ch + 1) {
      if (topo.opacidade > 0.01) ctx.fail(`pista de rolagem: "${topo.nome}" cabe sem rolar, mas a pista aparece (opacidade ${topo.opacidade})`);
      notas.push(`"${topo.nome}" cabe, sem pista`);
      continue;
    }
    conferidos++;
    if (topo.opacidade < 0.99) {
      ctx.fail(`pista de rolagem: "${topo.nome}" rola (${topo.sh}px em ${topo.ch}px), mas no topo a pista não aparece (opacidade ${topo.opacidade})`);
    }
    // Colada na borda de baixo visível: o sticky do Chromium prende na borda
    // do conteúdo, sem o padding; sem o desconto, a pista para acima da borda
    // e o texto aparece de novo embaixo dela.
    const caixa = await catPistaCaixa(cdp);
    if (!caixa) ctx.fail(`pista de rolagem: em "${topo.nome}", o DevTools não achou a caixa do ::after`);
    else if (Math.abs(caixa.fundo - topo.borda) > 1) {
      ctx.fail(`pista de rolagem: em "${topo.nome}", a pista termina em ${caixa.fundo.toFixed(1)}px, mas a borda de baixo do painel está em ${topo.borda.toFixed(1)}px (tem de encostar, ±1 px)`);
    }
    await evalValue(cdp, `(() => { const el = document.querySelector(${JSON.stringify(CAT_PAINEL_SELECTOR)} + " .catalogo__painel-interior"); el.scrollTop = el.scrollHeight; })()`);
    await sleep(200);
    const fim = await evalValue(cdp, CAT_PISTA_EXPR);
    if (fim.opacidade > 0.01) ctx.fail(`pista de rolagem: em "${fim.nome}", no fim da rolagem (${fim.topo}px) a pista continua (opacidade ${fim.opacidade})`);
    const folga = caixa ? ` (fundo da pista a ${(topo.borda - caixa.fundo).toFixed(1)}px da borda)` : "";
    notas.push(`"${topo.nome}" ${topo.sh}/${topo.ch}px: ${topo.opacidade} no topo${folga}, ${fim.opacidade} no fim`);
  }
  // Controle: a 390 o painel rola (§4); sem nenhum que role, a passada não conferiu nada.
  if (conferidos === 0) ctx.fail("pista de rolagem: nenhum painel rolou a 390×844; a passada não conferiu a pista");
  ctx.log(`pista de rolagem: ${notas.join("; ")}`);
}

/**
 * O movimento da superfície (layoutId) nas trocas: com o painel aberto, o
 * ‹ › não pode fazer a superfície nova crescer de uma caixa zerada (o
 * cartão novo está escondido, sem caixa), e o cartão que vira ±1 numa troca
 * não ganha transform do motion por cima do da CSS.
 */
async function catMotionPass(cdp, ctx) {
  if (!(await catLoad(cdp, ctx, "movimento da superfície"))) return;
  // Amostra o transform inline (o do motion) a cada quadro, durante ms.
  const startSampling = (selector, ms) =>
    evalValue(
      cdp,
      `(() => {
        const scaleOf = (t) => {
          if (!t || t === "none") return [1, 1];
          let m = /scale\\(([^,)]+)(?:,\\s*([^)]+))?\\)/.exec(t);
          if (m) return [parseFloat(m[1]), parseFloat(m[2] ?? m[1])];
          const sx = /scaleX\\(([^)]+)\\)/.exec(t);
          const sy = /scaleY\\(([^)]+)\\)/.exec(t);
          return [sx ? parseFloat(sx[1]) : 1, sy ? parseFloat(sy[1]) : 1];
        };
        window.__catAmostras = (async () => {
          const end = performance.now() + ${ms};
          let min = Infinity, max = -Infinity, frames = 0, piores = [];
          while (performance.now() < end) {
            for (const el of document.querySelectorAll(${JSON.stringify(selector)})) {
              const t = el.style.transform;
              const [sx, sy] = scaleOf(t);
              const lo = Math.min(sx, sy), hi = Math.max(sx, sy);
              if (lo < min || hi > max) piores.push(t);
              min = Math.min(min, lo);
              max = Math.max(max, hi);
            }
            frames++;
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
          return { min, max, frames, pior: piores.at(-1) ?? "" };
        })();
        return true;
      })()`,
    );
  const takeSamples = () => evalValue(cdp, "window.__catAmostras", { awaitPromise: true });

  // Fechado: a troca pela seta. Quem vira ±1 (o centro de antes) e quem vira centro.
  await startSampling(`${CAT_SELECTOR} .catalogo__cartao:is([data-pos="1"], [data-pos="-1"], [data-pos="0"]) .catalogo__superficie`, 900);
  await catClick(cdp, CAT_PROXIMA_SELECTOR);
  const fechado = await takeSamples();
  const extra = (s) => s.min < 0.99 || s.max > 1.01;
  if (extra(fechado)) {
    ctx.fail(`movimento: numa troca do coverflow, a superfície dos cartões ganhou transform do motion (escala ${fechado.min.toFixed(2)}–${fechado.max.toFixed(2)}, ex.: "${fechado.pior}"); quem anima a troca é a CSS`);
  }

  // Controle positivo: ao abrir, o cartão cresce até o painel (§3.2), e a
  // amostragem tem de ver a escala do motion; uma amostragem cega "passaria"
  // nas trocas abaixo sem conferir nada.
  await startSampling(`${CAT_PAINEL_SELECTOR} .catalogo__painel-superficie`, 600);
  await catClick(cdp, CAT_VER_SELECTOR);
  const abrindo = await takeSamples();
  if (!extra(abrindo)) {
    ctx.fail(`movimento: ao abrir, a superfície do painel não animou a partir do cartão (escala ${abrindo.min.toFixed(2)}–${abrindo.max.toFixed(2)} em ${abrindo.frames} quadros; §3.2)`);
  }
  await catWait(cdp, catAberto);
  await sleep(1000);

  // Aberto: ›, nos primeiros 600 ms.
  await startSampling(`${CAT_PAINEL_SELECTOR} .catalogo__painel-superficie`, 600);
  await catClick(cdp, CAT_PAINEL_PROXIMA_SELECTOR);
  const aberto = await takeSamples();
  if (aberto.min < 0.5) {
    ctx.fail(`movimento: com o painel aberto, a superfície nova cresceu de uma caixa zerada no › (escala mínima ${aberto.min.toFixed(3)}, ex.: "${aberto.pior}")`);
  }

  // Fechando depois da troca: o ±1 (o produto de antes) volta sem transform sobrando.
  await catClick(cdp, CAT_FECHAR_SELECTOR);
  await catWait(cdp, catFechado);
  await sleep(1000);
  await startSampling(`${CAT_SELECTOR} .catalogo__cartao:is([data-pos="1"], [data-pos="-1"]) .catalogo__superficie`, 300);
  const sobra = await takeSamples();
  if (extra(sobra)) ctx.fail(`movimento: fechado depois de trocar, o ±1 ficou com transform do motion (escala ${sobra.min.toFixed(2)}–${sobra.max.toFixed(2)}, "${sobra.pior}")`);
  ctx.log(
    `movimento: troca no coverflow, escala da superfície ${fechado.min.toFixed(2)}–${fechado.max.toFixed(2)} (${fechado.frames} quadros); ao abrir (controle), ${abrindo.min.toFixed(2)}–${abrindo.max.toFixed(2)}; › no painel, ${aberto.min.toFixed(2)}–${aberto.max.toFixed(2)} (${aberto.frames} quadros); ±1 depois de fechar, ${sobra.min.toFixed(2)}–${sobra.max.toFixed(2)}`,
  );
}

// Onde o popover "Produtos ▾" aberto ficou na janela.
// E, em cada coluna, as linhas de texto de cada item: o menor espaço entre
// dois itens tem de ser maior que o maior espaço entre as linhas de um item
// (senão um item de 2 linhas se mistura com o seguinte).
const CAT_POPOVER_EXPR = `(() => {
  const menu = document.querySelector(".topbar__produtos-menu");
  if (!menu || menu.hidden) return null;
  const r = menu.getBoundingClientRect();
  let entreItens = Infinity, entreLinhas = 0, quebrados = 0;
  for (const lista of menu.querySelectorAll(".topbar__produtos-lista")) {
    const itens = [...lista.querySelectorAll("a")].map((a) => {
      const range = document.createRange();
      range.selectNodeContents(a);
      // Uma caixa por linha (as de mesma altura juntas).
      const linhas = [];
      for (const q of range.getClientRects()) {
        const l = linhas.find((x) => Math.abs(x.top - q.top) < 2);
        if (l) l.bottom = Math.max(l.bottom, q.bottom);
        else linhas.push({ top: q.top, bottom: q.bottom });
      }
      return linhas.sort((x, y) => x.top - y.top);
    });
    itens.forEach((linhas, i) => {
      if (linhas.length > 1) quebrados++;
      for (let k = 1; k < linhas.length; k++) entreLinhas = Math.max(entreLinhas, linhas[k].top - linhas[k - 1].bottom);
      const prox = itens[i + 1];
      if (prox && prox.length && linhas.length) entreItens = Math.min(entreItens, prox[0].top - linhas.at(-1).bottom);
    });
  }
  return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), cw: document.documentElement.clientWidth, vh: innerHeight, scrolled: document.querySelector(".topbar")?.dataset.scrolled ?? null, rem: parseFloat(getComputedStyle(document.documentElement).fontSize), entreItens: Math.round(entreItens * 10) / 10, entreLinhas: Math.round(entreLinhas * 10) / 10, quebrados };
})()`;

/** O popover do "Produtos ▾" fica dentro da janela (1200 e 1440 px: no topo, na cápsula, com fonte maior) e os itens não se misturam. */
async function catPopoverPass(cdp, ctx) {
  await setReducedMotion(cdp, false);
  const notes = [];
  for (const { what, font, scroll } of [
    { what: "no topo", font: false, scroll: false },
    { what: "na cápsula", font: false, scroll: true },
    { what: "fonte raiz de 125%, no topo", font: true, scroll: false },
    { what: "fonte raiz de 125%, na cápsula", font: true, scroll: true },
  ]) {
    if (!(await catLoad(cdp, ctx, `popover ${what}`, { center: false }))) return;
    if (font) {
      await evalValue(cdp, `(() => { const s = document.createElement("style"); s.textContent = "html { font-size: 125% !important; }"; document.head.append(s); })()`);
    }
    if (scroll) {
      // Abaixo do hero (a rolagem completa a expansão) e com a barra em cápsula.
      await evalValue(cdp, `document.querySelector(${JSON.stringify(CAT_CORPO_SELECTOR)})?.scrollIntoView({ block: "center", behavior: "instant" })`);
      await sleep(400);
    }
    await sleep(400);
    if (!(await evalValue(cdp, shownExpr(PRODUTOS_BUTTON_SELECTOR)))) {
      ctx.fail(`popover ${what}: "Produtos ▾" não está na barra larga a ${ctx.width}px`);
      continue;
    }
    await clickFixed(cdp, PRODUTOS_BUTTON_SELECTOR);
    await sleep(400);
    const r = await evalValue(cdp, CAT_POPOVER_EXPR);
    if (!r) {
      ctx.fail(`popover ${what}: o clique em "Produtos ▾" não abriu a lista`);
      continue;
    }
    if (scroll && r.scrolled !== "true") ctx.fail(`popover ${what}: a barra não virou cápsula (data-scrolled=${r.scrolled})`);
    if (r.left < 0 || r.right > r.cw) ctx.fail(`popover ${what}: a lista sai da janela (x ${r.left}–${r.right}, janela ${r.cw}px)`);
    if (r.quebrados > 0 && !(r.entreItens > r.entreLinhas)) {
      ctx.fail(`popover ${what}: ${r.quebrados} item(ns) em 2 linhas e o espaço entre itens (${r.entreItens}px) não passa o entre linhas (${r.entreLinhas}px); os itens se misturam`);
    }
    notes.push(`${what}: x ${r.left}–${r.right} de ${r.cw}, ${r.quebrados ? `${r.quebrados} em 2 linhas, entre itens ${r.entreItens}px > entre linhas ${r.entreLinhas}px` : `itens numa linha, ${r.entreItens}px entre eles`}`);
  }
  ctx.log(`popover "Produtos ▾": ${notes.join("; ")}`);
}

/** Tab até um cartão ±2 a 1440: o foco o deixa com opacidade 1 e contorno visível. */
async function catTabSidePass(cdp, ctx) {
  if (!(await catLoad(cdp, ctx, "Tab até o ±2"))) return;
  await catFocus(cdp, CAT_ANTERIOR_SELECTOR);
  let tabs = 0;
  let pos = null;
  while (tabs < 15 && pos !== "2" && pos !== "-2") {
    await pressTab(cdp);
    tabs++;
    pos = await evalValue(cdp, `document.activeElement?.closest(".catalogo__cartao") === document.activeElement ? document.activeElement.dataset.pos : null`);
  }
  if (pos !== "2" && pos !== "-2") {
    ctx.fail(`Tab até o ±2: ${tabs} Tabs a partir da seta "anterior" sem chegar a um cartão ±2`);
    return;
  }
  await sleep(900); // a transição de 800 ms da opacidade e do filtro
  const focus = await evalValue(
    cdp,
    `(async () => {
      const el = document.activeElement;
      const opacity = await ${SETTLED_OPACITY_FN}(el, 0.99, 1500);
      const s = getComputedStyle(el);
      const rgba = /rgba?\\(([^)]*)\\)/.exec(s.outlineColor);
      const alpha = rgba ? Number(rgba[1].split(",")[3] ?? 1) : 1;
      return { id: el.id, opacity: Math.round(opacity * 100) / 100, filter: s.filter, outline: s.outlineStyle + " " + s.outlineWidth + " " + s.outlineColor, style: s.outlineStyle, width: parseFloat(s.outlineWidth), alpha, visible: el.matches(":focus-visible") };
    })()`,
    { awaitPromise: true },
  );
  if (focus.opacity < 0.99) ctx.fail(`Tab até o ±2: o cartão ${focus.id} focado ficou com opacidade efetiva ${focus.opacity} (esperado 1)`);
  if (focus.style === "none" || !(focus.width >= 2) || focus.alpha < 0.5 || !focus.visible) {
    ctx.fail(`Tab até o ±2: o cartão ${focus.id} focado não mostra contorno (${focus.outline}, :focus-visible ${focus.visible})`);
  }
  ctx.log(`Tab até o ±2: ${tabs} Tab(s) até ${focus.id} (data-pos ${pos}); opacidade ${focus.opacity}, filtro ${focus.filter}, contorno ${focus.outline}`);
}

/** Menu da barra: "Produtos ▾" leva ao Fleet Analytics BI e abre o painel (a 360, pelo Menu). */
async function catBarMenuPass(cdp, ctx) {
  if (!(await catLoad(cdp, ctx, "menu da barra", { center: false }))) return;
  const hash = BAR_ANCHOR_SIDE_SELECTOR;
  const viaMenu = await showProdutoLink(cdp, ctx, hash, "menu da barra");
  await clickFixed(cdp, produtoLink(hash));
  const aberto = await catWait(cdp, catAberto);
  await sleep(1200);
  const s = await catState(cdp);
  const nome = await catNome(cdp, hash.slice(1));
  if (!aberto || s.painel !== nome) ctx.fail(`menu da barra${viaMenu ? " (pelo Menu)" : ""}: ${hash} não abriu o painel de "${nome}" (data-estado=${s.estado}, painel "${s.painel}")`);
  if (s.hash !== hash) ctx.fail(`menu da barra: a URL ficou com "${s.hash}" (esperado ${hash})`);
  ctx.log(`menu da barra${viaMenu ? " (pelo Menu)" : ""}: ${hash} abriu "${s.painel}", URL ${s.hash}`);
}

/**
 * Toque de verdade a 360 px (Input.dispatchTouchEvent): o dedo 120 px para a
 * esquerda troca o centro; 200 px para cima rola a página e não troca
 * (Review Focus 1); e, depois do deslize, Enter no "Ver detalhes" abre (o
 * arrasto não engole o próximo Enter).
 */
async function catTouchPass(cdp, ctx) {
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: ctx.width, height: ctx.height, deviceScaleFactor: 2, mobile: true });
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  try {
    if (!(await catLoad(cdp, ctx, "toque"))) return;
    const palco = await evalValue(
      cdp,
      `(() => { const r = document.querySelector(${JSON.stringify(`${CAT_SELECTOR} .catalogo__palco`)}).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`,
    );
    const drag = async (dx, dy) => {
      const x0 = palco.x + (dx < 0 ? 60 : 0);
      const y0 = palco.y + (dy < 0 ? 100 : 0);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y: y0, id: 1 }] });
      for (let i = 1; i <= 8; i++) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + (dx * i) / 8, y: y0 + (dy * i) / 8, id: 1 }] });
        await sleep(25);
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await sleep(900);
    };
    const s0 = await catState(cdp);
    await drag(-120, 0);
    const s1 = await catState(cdp);
    if (s1.centro === s0.centro) ctx.fail(`toque: o dedo 120 px para a esquerda não trocou o centro (${s0.centro})`);
    await drag(0, -200);
    const s2 = await catState(cdp);
    if (s2.centro !== s1.centro) ctx.fail(`toque: o dedo 200 px para cima trocou o centro (${s1.centro} → ${s2.centro}); a página tem de rolar`);
    if (!(s2.scrollY > s1.scrollY + 50)) ctx.fail(`toque: o dedo 200 px para cima não rolou a página (scrollY ${s1.scrollY} → ${s2.scrollY})`);
    // Depois do deslize, o Enter no "Ver detalhes" vale (não é o clique do arrasto).
    await evalValue(cdp, `document.querySelector(${JSON.stringify(CAT_CORPO_SELECTOR)})?.scrollIntoView({ block: "center", behavior: "instant" })`);
    await drag(-120, 0);
    await catFocus(cdp, CAT_VER_SELECTOR);
    await pressKey(cdp, KEYS.Enter);
    const abriu = await catWait(cdp, catAberto, 2000);
    if (!abriu) ctx.fail("toque: depois de um deslize, Enter no \"Ver detalhes\" não abriu o painel (o arrasto engoliu o Enter?)");
    ctx.log(
      `toque: 120 px para a esquerda levou o centro de ${s0.centro} a ${s1.centro}; 200 px para cima rolou de ${Math.round(s1.scrollY)} a ${Math.round(s2.scrollY)} com o centro em ${s2.centro}; Enter no "Ver detalhes" depois de deslizar: ${abriu ? "abriu" : "não abriu"}`,
    );
  } finally {
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false }).catch(() => {});
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: ctx.width, height: ctx.height, deviceScaleFactor: 1, mobile: false });
  }
}

// Cores forçadas: a "tinta" de cada controle (a cor do ícone em
// currentColor, ou o contorno) contra o fundo efetivo atrás dele.
const CAT_FORCED_EXPR = `(() => {
  const rgb = (text) => { const m = /rgba?\\(([^)]*)\\)/.exec(text || ""); if (!m) return null; const [r, g, b, a = 1] = m[1].split(",").map(Number); return { r, g, b, a }; };
  const lum = ({ r, g, b }) => { const c = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b); };
  const ratio = (x, y) => { const [hi, lo] = [lum(x), lum(y)].sort((p, q) => q - p); return (hi + 0.05) / (lo + 0.05); };
  const back = (el) => { for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c && c.a > 0.5) return c; } return rgb(getComputedStyle(document.body).backgroundColor) ?? { r: 255, g: 255, b: 255, a: 1 }; };
  const show = (c) => (c ? [c.r, c.g, c.b].join(",") : "?");
  const read = (what, sel, kind) => {
    const el = document.querySelector(sel);
    if (!el) return { what, missing: true };
    const s = getComputedStyle(el);
    const ink = kind === "outline" ? (s.outlineStyle === "none" ? null : rgb(s.outlineColor)) : rgb(getComputedStyle(el.querySelector("svg") ?? el).color);
    const bg = back(kind === "outline" ? el.parentElement : el);
    return { what, ink: show(ink), bg: show(bg), ratio: ink && ink.a > 0.5 ? Math.round(ratio(ink, bg) * 100) / 100 : 0 };
  };
  return [
    read("seta Próximo", ${JSON.stringify(CAT_PROXIMA_SELECTOR)}, "icon"),
    read("seta anterior", ${JSON.stringify(CAT_ANTERIOR_SELECTOR)}, "icon"),
    read("X do painel", ${JSON.stringify(CAT_FECHAR_SELECTOR)}, "icon"),
    read("contorno do ativo na fita", ${JSON.stringify(`${CAT_SELECTOR} .catalogo__fita button[aria-current="true"] .catalogo__miniatura-arte`)}, "outline"),
  ];
})()`;

/** Cores forçadas: setas, o contorno do ativo na fita e o X continuam à vista (≥ 3:1). */
async function catForcedColorsPass(cdp, ctx) {
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "forced-colors", value: "active" },
      { name: "prefers-reduced-motion", value: "no-preference" },
    ],
  });
  try {
    await navigate(cdp, "about:blank", "sair da página antes das cores forçadas");
    await navigate(cdp, URL_TO_CHECK, `carregar com cores forçadas a ${ctx.size}`);
    await catWait(cdp, `document.querySelector(${JSON.stringify(CAT_SELECTOR)})?.dataset.js === "true"`, 8000);
    await catCenter(cdp, false);
    const fechado = await evalValue(cdp, CAT_FORCED_EXPR);
    await catClick(cdp, CAT_VER_SELECTOR);
    await catWait(cdp, catAberto);
    await sleep(1200);
    const aberto = await evalValue(cdp, CAT_FORCED_EXPR);
    // As setas, fechado; o X e a fita, aberto.
    const lidos = [...fechado.slice(0, 2), ...aberto.slice(2)];
    for (const item of lidos) {
      if (item.missing) ctx.fail(`cores forçadas: sem ${item.what}`);
      else if (item.ratio < 3) ctx.fail(`cores forçadas: ${item.what} some (cor ${item.ink} sobre ${item.bg}, contraste ${item.ratio}:1)`);
    }
    ctx.log(`cores forçadas: ${lidos.map((i) => `${i.what} ${i.missing ? "ausente" : `${i.ratio}:1`}`).join(", ")}`);
  } finally {
    await setReducedMotion(cdp, false);
  }
}

/**
 * WCAG 1.4.12 a 320 px: com o espaçamento de texto, tudo da Visão geral do
 * replay é alcançável (a seção cresce ou o painel rola) e a página não
 * ganha rolagem para o lado.
 */
async function catSpacingPass(cdp, ctx) {
  if (!(await catLoad(cdp, ctx, "espaçamento 1.4.12", { center: false }))) return;
  await evalValue(cdp, `(() => { const s = document.createElement("style"); s.textContent = ${JSON.stringify(TEXT_SPACING_CSS)}; document.head.appendChild(s); })()`);
  await catCenter(cdp, false);
  await catClick(cdp, CAT_VER_SELECTOR);
  await catWait(cdp, catAberto);
  await sleep(1200);
  const r = await evalValue(
    cdp,
    `(async () => {
      const painel = document.querySelector(${JSON.stringify(CAT_PAINEL_SELECTOR)});
      const visao = painel && painel.querySelector('[role="tabpanel"]:not([hidden])');
      if (!visao) return null;
      const interior = painel.querySelector(".catalogo__painel-interior");
      const doc = document.documentElement;
      const cw = doc.clientWidth;
      const problems = [];
      // O que está num <details> fechado (a descrição do vídeo) só aparece ao
      // abri-lo: alcançável é o summary dele.
      const leaves = [...visao.querySelectorAll("h3, h4, p, li, a, button, summary")].filter(
        (el) => el.getBoundingClientRect().height > 0 && (el.matches("summary") || !el.closest("details:not([open])")),
      );
      for (const el of leaves) {
        el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const b = el.getBoundingClientRect();
        const box = interior.getBoundingClientRect();
        const name = el.tagName.toLowerCase() + " '" + el.textContent.trim().slice(0, 30) + "'";
        if (b.top < box.top - 1 || b.bottom > box.bottom + 1) problems.push(name + ": fora da área visível do painel mesmo depois de rolar (y " + Math.round(b.top) + "–" + Math.round(b.bottom) + ", painel " + Math.round(box.top) + "–" + Math.round(box.bottom) + ")");
        else if (b.left < box.left - 1 || b.right > box.right + 1 || b.right > cw + 0.5) problems.push(name + ": cortado na largura (x " + Math.round(b.left) + "–" + Math.round(b.right) + ", painel " + Math.round(box.left) + "–" + Math.round(box.right) + ")");
      }
      if (doc.scrollWidth > cw) problems.push("a página rola de lado (" + (doc.scrollWidth - cw) + "px)");
      return { problems: problems.slice(0, 6), total: problems.length, leaves: leaves.length, interior: { sh: interior.scrollHeight, ch: interior.clientHeight }, cw };
    })()`,
    { awaitPromise: true },
  );
  if (!r) {
    ctx.fail("espaçamento 1.4.12: o painel aberto não tem a Visão geral");
    return;
  }
  for (const problem of r.problems) ctx.fail(`espaçamento 1.4.12: ${problem}`);
  ctx.log(
    `espaçamento 1.4.12 (${r.cw}px): ${r.leaves} trechos da Visão geral, ${r.total === 0 ? "todos alcançáveis" : `${r.total} inalcançável(is)`}; o painel rola ${r.interior.sh}px em ${r.interior.ch}px`,
  );
}

/**
 * O texto do cartão do centro, nos 10 produtos (WCAG 1.4.3, 1.4.12, 1.4.4):
 *   - no tamanho padrão (`css` vazio): a caixa .catalogo__info cabe no
 *     cartão sem rolar, e a linha da etiqueta e dos selos (.catalogo__meta)
 *     começa dentro da superfície e abaixo do esmaecimento (--info-fade), onde
 *     o véu já é o opaco (≥ 0,8): é o que a medida da MASTER §3.4 supõe;
 *   - com o espaçamento do 1.4.12 ou a fonte raiz a 200%: a caixa não passa
 *     do cartão, e a etiqueta, o nome e o "Ver detalhes" ficam à vista ou
 *     alcançáveis pela rolagem de dentro dela (nada cortado acima da borda),
 *     sem rolagem para o lado.
 */
async function catTextoCartaoPass(cdp, ctx, { css = "", what }) {
  if (!(await catLoad(cdp, ctx, what, { reduce: true, center: false }))) return;
  if (css) {
    await evalValue(cdp, `(() => { const s = document.createElement("style"); s.textContent = ${JSON.stringify(css)}; document.head.appendChild(s); })()`);
  }
  await catCenter(cdp, true);
  const r = await evalValue(
    cdp,
    `(async () => {
      const raiz = document.querySelector(${JSON.stringify(CAT_SELECTOR)});
      const bolinhas = [...raiz.querySelectorAll(".catalogo__bolinhas button")];
      const padrao = ${JSON.stringify(!css)};
      const quadro = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const problems = [];
      const itens = [];
      for (const bolinha of bolinhas) {
        bolinha.click();
        await new Promise((resolve) => setTimeout(resolve, 150));
        const c = raiz.querySelector('.catalogo__cartao[data-pos="0"]');
        const sup = c.querySelector(".catalogo__superficie");
        const info = c.querySelector(".catalogo__info");
        const meta = c.querySelector(".catalogo__meta");
        const s = sup.getBoundingClientRect();
        const i = info.getBoundingClientRect();
        const fade = parseFloat(getComputedStyle(info).paddingTop);
        if (i.top < s.top - 0.5 || i.bottom > s.bottom + 0.5) problems.push(c.id + ": a caixa do texto passa do cartão (" + Math.round(i.top - s.top) + " px do topo)");
        if (info.scrollWidth > info.clientWidth + 1) problems.push(c.id + ": o texto passa da largura do cartão (" + info.scrollWidth + " px em " + info.clientWidth + ")");
        if (padrao) {
          const m = meta.getBoundingClientRect();
          if (info.scrollHeight > info.clientHeight + 1) problems.push(c.id + ": no tamanho padrão, o texto não cabe no cartão (" + info.scrollHeight + " px em " + info.clientHeight + ")");
          if (m.top < s.top - 0.5) problems.push(c.id + ": a etiqueta e o selo começam acima do cartão (" + Math.round(m.top - s.top) + " px)");
          if (m.top < i.top + fade - 1) problems.push(c.id + ": a etiqueta e o selo caem no esmaecimento (" + Math.round(m.top - i.top) + " px do topo da caixa, esmaecimento de " + fade + " px)");
          itens.push(c.id + " " + info.scrollHeight + "/" + Math.round(s.height));
        } else {
          for (const [nome, el] of [["etiqueta", meta], ["nome", c.querySelector(".catalogo__nome")], ["Ver detalhes", c.querySelector(".catalogo__ver")]]) {
            // Alcançável: dentro do que a caixa rola (nada acima do início
            // da rolagem nem além do fim, que a superfície cortaria).
            info.scrollTop = 0;
            await quadro();
            const caixa = info.getBoundingClientRect();
            const b0 = el.getBoundingClientRect();
            const topo = b0.top - caixa.top;
            const base = b0.bottom - caixa.top;
            if (topo < -1 || base > info.scrollHeight + 1 || b0.left < caixa.left - 1 || b0.right > caixa.right + 1) {
              problems.push(c.id + ": " + nome + " fora do que a caixa rola (y " + Math.round(topo) + "–" + Math.round(base) + " em " + info.scrollHeight + ")");
              continue;
            }
            // E, se cabe na caixa, rolar até ele o deixa inteiro à vista.
            if (b0.height > caixa.height) continue;
            el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
            await quadro();
            const b = el.getBoundingClientRect();
            const s2 = sup.getBoundingClientRect();
            if (b.top < s2.top - 1 || b.bottom > s2.bottom + 1 || b.left < s2.left - 1 || b.right > s2.right + 1) {
              problems.push(c.id + ": " + nome + " fora do cartão mesmo depois de rolar (y " + Math.round(b.top - s2.top) + "–" + Math.round(b.bottom - s2.top) + " em " + Math.round(s2.height) + ")");
            }
          }
          info.scrollTop = 0;
          itens.push(c.id + " rola " + info.scrollHeight + "/" + info.clientHeight);
        }
      }
      return { problems, itens, total: bolinhas.length };
    })()`,
    { awaitPromise: true },
  );
  if (r.total !== CAT_TOTAL) ctx.fail(`${what}: ${r.total} bolinhas (esperado ${CAT_TOTAL})`);
  for (const problem of r.problems) ctx.fail(`${what}: ${problem}`);
  ctx.log(`${what}: ${r.problems.length === 0 ? "ok nos 10" : `${r.problems.length} problema(s)`} (${r.itens.join(", ")})`);
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
    roda("larguras")
      ? "largura | reduced motion | rolagem horizontal (pior ponto) | erros no console | FAB x controle (360/390/1024/1100/1199)"
      : "Larguras: etapa fora de CHECK_BROWSER_ETAPAS",
  );

  for (const reduce of roda("larguras") ? [false, true] : []) {
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
  for (const { width, height } of roda("hero") ? HERO_SIZES : []) {
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
            sequencia: section ? (section.dataset.sequencia ?? null) : null,
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
      // Prévia aprovada em 13/10/2026: a sequência de quadros está desligada (o
      // símbolo é desenhado pelo fio). O giro não existe, então o passo dele
      // avisa que pulou; a conferência do fio vem com a implementação definitiva
      // (spec do fio, §11.2). O resto da checagem continua igual.
      if (staticPage.sequencia === "desligada") {
        console.log(`  hero estudio: passo do giro pulado a ${size} (sequência de quadros desligada na prévia)`);
        continue;
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
  if (!roda("expansao")) {
    console.log(`\nHero "expansao": etapa fora de CHECK_BROWSER_ETAPAS`);
  } else if (heroVariant !== "expansao") {
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
      await runExpPass(ctx, "clique e foco", () => expFocusPass(cdp, ctx));
      if (width === 1440) await runExpPass(ctx, "cores forçadas", () => expForcedColorsPass(cdp, ctx));
      await runExpPass(ctx, "reduced motion", () => expReducedPass(cdp, ctx, staticHeight));
    }
    // Telas e entradas que as três passadas acima não cobrem: o 1.4.12 a
    // 320 px (com a barra de rolagem clássica e a do celular), o zoom de
    // 400% e o toque.
    for (const { width, height, run, what } of [
      { width: 320, height: 568, what: "espaçamento 1.4.12", run: (ctx) => expSpacingPass(cdp, ctx, { mobile: false }) },
      { width: 320, height: 640, what: "espaçamento 1.4.12", run: (ctx) => expSpacingPass(cdp, ctx, { mobile: true }) },
      { width: 320, height: 256, what: "zoom de 400%", run: (ctx) => expSpacingPass(cdp, ctx, { mobile: false, dsf: 4, spaced: false }) },
      { width: 390, height: 844, what: "toque", run: (ctx) => expTouchPass(cdp, ctx) },
    ]) {
      const size = `${width}×${height}`;
      const ctx = {
        size,
        width,
        height,
        fail: (message) => failures.push(`hero expansao a ${size}: ${message}`),
        log: (message) => console.log(`  ${message}`),
      };
      console.log(`\nHero "expansao" a ${size} (${what}):`);
      await runExpPass(ctx, what, () => run(ctx));
    }
    await setReducedMotion(cdp, false);
  }

  // --- Catálogo de produtos (#produtos): sem JS; mouse e altura constante;
  // teclado; link direto e voltar; reduced motion; loop; um vídeo por vez
  // (1440×900 e 360×740); e as conferências de uma largura só ---
  // Cada passada tem o próprio tempo-limite e os próprios erros de console;
  // um erro numa não derruba as outras nem os passos seguintes.
  if (!roda("catalogo")) {
    console.log("\nCatálogo: etapa fora de CHECK_BROWSER_ETAPAS");
  } else {
    const catCtx = (width, height) => {
      const size = `${width}×${height}`;
      return {
        size,
        width,
        height,
        fail: (message) => failures.push(`catálogo a ${size}: ${message}`),
        log: (message) => console.log(`  ${message}`),
      };
    };
    const runCatPass = async (ctx, what, pass) => {
      consoleErrors = [];
      await cdp.send("Emulation.setDeviceMetricsOverride", { width: ctx.width, height: ctx.height, deviceScaleFactor: 1, mobile: false });
      try {
        return await withTimeout(pass(), `catálogo a ${ctx.size}, ${what}`);
      } catch (error) {
        ctx.fail(`${what}: erro na passada (${error.message}); as seguintes continuam`);
        return null;
      } finally {
        await cdp.send("Emulation.setScriptExecutionDisabled", { value: false }).catch(() => {});
        for (const error of consoleErrors) ctx.fail(`${what}: erro no console: ${error.split("\n")[0]}`);
      }
    };
    const catalogoPass = async (ctx) => {
      await runCatPass(ctx, "sem JavaScript", () => catNoJsPass(cdp, ctx));
      await runCatPass(ctx, "mouse", () => catMousePass(cdp, ctx));
      await runCatPass(ctx, "teclado", () => catKeyPass(cdp, ctx));
      await runCatPass(ctx, "link direto", () => catLinkPass(cdp, ctx));
      await runCatPass(ctx, "reduced motion", () => catReducedPass(cdp, ctx));
      await runCatPass(ctx, "loop", () => catLoopPass(cdp, ctx));
      await runCatPass(ctx, "um vídeo por vez", () => catOneVideoPass(cdp, ctx));
    };
    const catalogoExtras = async () => {
      for (const { width, height, what, run } of [
        { width: 1440, height: 900, what: "histórico", run: (ctx) => catHistoryPass(cdp, ctx) },
        ...CAT_FIT_SIZES.map(({ width, height }) => ({ width, height, what: "Visão geral", run: (ctx) => catFitPass(cdp, ctx) })),
        { width: 1440, height: 900, what: "movimento", run: (ctx) => catMotionPass(cdp, ctx) },
        { width: 1440, height: 900, what: "Tab até o ±2", run: (ctx) => catTabSidePass(cdp, ctx) },
        { width: 1200, height: 900, what: "popover", run: (ctx) => catPopoverPass(cdp, ctx) },
        { width: 1440, height: 900, what: "popover", run: (ctx) => catPopoverPass(cdp, ctx) },
        { ...CAT_PISTA_SIZE, what: "pista de rolagem", run: (ctx) => catPistaPass(cdp, ctx) },
        { width: 1440, height: 900, what: "menu da barra", run: (ctx) => catBarMenuPass(cdp, ctx) },
        { width: 360, height: 740, what: "menu da barra", run: (ctx) => catBarMenuPass(cdp, ctx) },
        { width: 360, height: 740, what: "toque", run: (ctx) => catTouchPass(cdp, ctx) },
        { width: 1440, height: 900, what: "cores forçadas", run: (ctx) => catForcedColorsPass(cdp, ctx) },
        { width: 320, height: 640, what: "espaçamento 1.4.12", run: (ctx) => catSpacingPass(cdp, ctx) },
        ...CAT_TEXTO_SIZES.flatMap(({ width, height }) => [
          { width, height, what: "texto do cartão", run: (ctx) => catTextoCartaoPass(cdp, ctx, { what: "texto do cartão" }) },
          {
            width,
            height,
            what: "texto do cartão com 1.4.12",
            run: (ctx) => catTextoCartaoPass(cdp, ctx, { what: "texto do cartão com 1.4.12", css: TEXT_SPACING_CSS }),
          },
          {
            width,
            height,
            what: "texto do cartão com fonte raiz 200%",
            run: (ctx) =>
              catTextoCartaoPass(cdp, ctx, { what: "texto do cartão com fonte raiz 200%", css: "html { font-size: 200% !important; }" }),
          },
        ]),
      ]) {
        const ctx = catCtx(width, height);
        console.log(`\nCatálogo a ${ctx.size} (${what}):`);
        await runCatPass(ctx, what, () => run(ctx));
      }
    };
    for (const { width, height } of CAT_SIZES) {
      const ctx = catCtx(width, height);
      console.log(`\nCatálogo a ${ctx.size}:`);
      await catalogoPass(ctx);
    }
    await catalogoExtras();
    await setReducedMotion(cdp, false);
  }

  if (!roda("interacao")) {
    console.log("\nPasso de interação: etapa fora de CHECK_BROWSER_ETAPAS");
  } else {
    console.log(`\nPasso de interação a ${INTERACTION_WIDTH}px, reduced motion desligado (menu + Tab; vídeos do catálogo; Tab pela página; espaçamento de texto 1.4.12):`);
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

    // --- Vídeos: só um toca por vez (o do painel do catálogo, os loops) e o vídeo do hero, se existir, não toca por cima ---
    // (sem zerar consoleErrors: os erros do passo do menu também contam)
    loaded = cdp.once("Page.loadEventFired");
    await cdp.send("Page.navigate", { url: URL_TO_CHECK });
    await withTimeout(loaded, "carregar para o passo de interação (vídeos)");
    await sleep(1500);

    // O painel do replay (o 1º produto, no centro ao carregar), pelo "Ver detalhes".
    await evalValue(cdp, `document.querySelector(${JSON.stringify(CAT_CORPO_SELECTOR)})?.scrollIntoView({ block: "center", behavior: "instant" })`);
    await sleep(1300);
    await clickSelector(cdp, CAT_VER_SELECTOR).catch(() => {});
    await sleep(1200);
    const panelShown = await evalValue(cdp, `!!document.querySelector(${JSON.stringify(CAT_ASSISTIR_SELECTOR)})`);
    if (!panelShown) {
      failures.push(`vídeos: o painel do 1º produto não abriu com o botão "Assistir" (${CAT_ASSISTIR_SELECTOR})`);
    } else {
      const firstPlaying = await playVideo(cdp, CAT_VIDEO_SELECTOR, { viaButton: CAT_ASSISTIR_SELECTOR });
      if (!firstPlaying) failures.push("vídeos: o vídeo do 1º produto não tocou depois do clique em 'Assistir'");
      // Troca para o Rota de Vendas (2º do catálogo) pela fita; o conteúdo do
      // anterior sai em 350 ms, e só então o seletor acha o vídeo novo.
      await clickSelector(cdp, catMiniatura(2));
      await sleep(700);
      const secondName = (await catState(cdp))?.painel;
      if (secondName !== (await catNome(cdp, "rota-de-vendas"))) failures.push(`vídeos: a 2ª miniatura abriu "${secondName}" (esperado o Rota de Vendas)`);
      const secondPlaying = await playVideo(cdp, CAT_VIDEO_SELECTOR, { viaButton: CAT_ASSISTIR_SELECTOR });
      if (!secondPlaying) failures.push("vídeos: o vídeo do 2º produto não tocou depois do clique em 'Assistir'");
      const playingCount = await evalValue(
        cdp,
        `[...document.querySelectorAll("video")].filter((video) => !video.paused).length`,
      );
      if (playingCount !== 1) failures.push(`vídeos: ${playingCount} vídeos tocando ao mesmo tempo (deveria ser 1)`);
      if (await evalValue(cdp, `!!document.querySelector(${JSON.stringify(HERO_VIDEO_SELECTOR)})`)) {
        await evalValue(cdp, `window.scrollTo({ top: 0, behavior: "instant" })`);
        await sleep(1500);
        if (!(await isPaused(cdp, HERO_VIDEO_SELECTOR))) failures.push("vídeos: o hero tocou sozinho por cima do vídeo de produto que a pessoa estava vendo");
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
    'Hero "expansao" (idem), a 1440×900, 360×740 e 740×360: parado e legível sem JavaScript; a roda e o teclado expandem preso (o quadro cresce com as fórmulas do original, o título se abre, o conteúdo aparece) e depois a página rola até Produtos; no topo, recolhe; as âncoras terminam no alvo, sem voltar ao topo; clicar no quadro e focar o controle do vídeo não expandem; o ícone do controle aparece com cores forçadas; com reduced motion, nunca prende e a altura é a mesma; a 320 px, com o espaçamento do 1.4.12, e com 400% de zoom, as legendas não passam sob o controle e a linha de apoio termina dentro da tela; com toque de verdade, um dedo expande e a pinça não mexe no hero. ' +
    "Catálogo (1440×900 e 360×740): sem JavaScript, os 10 produtos e o <details>; mouse, teclado, miniaturas e filtro; altura constante; link direto e voltar; reduced motion instantâneo; o loop para em 5 s; um vídeo por vez; e, numa largura só, o histórico com o Next, a Visão geral cabendo sem rolar (1440×900 e 1280×800), a superfície sem crescer de caixa zerada, Tab até o ±2, o popover dentro da janela e sem misturar os itens, a pista de rolagem do painel a 390×844, o menu da barra, o toque, as cores forçadas e o 1.4.12 a 320 px; e o texto do cartão do centro (10 produtos, 360×740, 390×844 e 1440×900) cabendo sem rolar sobre o véu opaco e alcançável com o 1.4.12 e a fonte a 200%. " +
    "Menu fecha e o foco não fica coberto nem invisível ao sair com Tab; só um vídeo toca por vez na página (o do painel do catálogo, trocando pela fita) e o vídeo do hero, se existir, não toca por cima; " +
    "no Tab pela página (360/390/1024/1200px), nenhum controle focado fica sob a barra fixa do topo, coberto ou invisível; " +
    "com o espaçamento de texto da WCAG 1.4.12 (360–1440px), nada da barra é cortado e ela não cobre o hero.",
);
