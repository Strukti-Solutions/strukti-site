import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { CATALOGO, catalogoUi, type ItemCatalogo } from "@/content/catalogo";
import { landingContent } from "@/content/landing";
import { onInterestSelected } from "@/lib/interest";
import { REDUCED_MOTION_QUERY } from "@/lib/motion";
import { Catalogo } from "@/components/sections/Catalogo";
import { CatalogoInterativo } from "./CatalogoInterativo";

// Ids da §5.2, na ordem do catálogo (escritos à mão, para pegar uma troca).
const IDS = [
  "replay",
  "rota-de-vendas",
  "fleet-analytics-bi",
  "placar-conectado",
  "agenda-de-quadras",
  "site-clinicas",
  "totem-check-in",
  "estoque-oficinas",
  "vitrine-lojas",
  "contador-de-fluxo",
];

const porSlug = (slug: string): ItemCatalogo => {
  const item = CATALOGO.find((i) => i.slug === slug);
  if (!item) throw new Error(`Item ${slug} fora do catálogo`);
  return item;
};

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  // Abrir cria entrada no histórico; aqui só conta, sem mexer na URL do jsdom.
  vi.spyOn(window.history, "pushState").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function montar() {
  const view = render(<CatalogoInterativo itens={CATALOGO} />);
  const raiz = view.container.querySelector<HTMLElement>(".catalogo")!;
  return { ...view, raiz };
}

/** Os cartões na ordem do DOM. */
const cartoes = (raiz: HTMLElement) => [...raiz.querySelectorAll<HTMLElement>(".catalogo__cartao")];
/** `data-pos` de cada cartão, na ordem do DOM. */
const posicoes = (raiz: HTMLElement) => cartoes(raiz).map((c) => c.dataset.pos);
/** Slug do cartão do centro. */
const centro = (raiz: HTMLElement) => raiz.querySelector<HTMLElement>('.catalogo__cartao[data-pos="0"]')?.id;
const anuncio = (raiz: HTMLElement) => raiz.querySelector('[aria-live="polite"]')?.textContent ?? "";
const cartao = (raiz: HTMLElement, slug: string) => raiz.querySelector<HTMLElement>(`#${slug}`)!;
/** Espera a tarefa seguinte: o clique que um arrasto do mouse gera já teria chegado. */
const proximaTarefa = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
/** O conteúdo do painel do produto atual; o do anterior, saindo, fica `aria-hidden`. */
const CONTEUDO_ATUAL = ".catalogo__painel-conteudo:not([aria-hidden])";

describe("catálogo: HTML do servidor", () => {
  it("HTML do servidor (renderToString): 10 cartões (group) com os ids da §5.2, o conteúdo dos painéis (para quem é, os 3 passos de cada um) e nenhum <video>", () => {
    const html = renderToString(<Catalogo />);
    const doc = document.createElement("div");
    doc.innerHTML = html;

    const secao = doc.querySelector("section#produtos")!;
    expect(secao).not.toBeNull();
    expect(secao.getAttribute("aria-labelledby")).toBe(secao.querySelector("h2")?.id);
    expect(secao.querySelector(".catalogo")?.getAttribute("data-js")).toBe("false");
    expect(secao.querySelector(".catalogo")?.getAttribute("data-estado")).toBe("fechado");

    const cartoesHtml = [...secao.querySelectorAll(".catalogo__cartao")];
    expect(cartoesHtml.map((a) => a.id)).toEqual(IDS);
    for (const artigo of cartoesHtml) {
      const item = porSlug(artigo.id);
      const ficha = artigo.querySelector("details.catalogo__ficha")!;
      expect(ficha).not.toBeNull();
      expect(ficha.textContent).toContain(item.painel.paraQuem);
      const passos = [...ficha.querySelectorAll("ol li")].map((li) => li.textContent);
      expect(passos).toHaveLength(3);
      item.painel.comoFunciona.forEach((passo, i) => {
        expect(passos[i]).toContain(passo.titulo);
        expect(passos[i]).toContain(passo.texto);
      });
      // Sem JS, nada fica escondido do leitor de tela nem fora do Tab.
      expect(artigo.hasAttribute("inert")).toBe(false);
      expect(artigo.hasAttribute("aria-hidden")).toBe(false);
    }
    expect(html).not.toContain("<video");
    expect(html).not.toMatch(/autoplay/i);
  });
});

describe("catálogo: estado fechado", () => {
  it("começa fechado com o replay no centro; data-pos dos cartões = 0,1,2,oculto…,-2,-1", () => {
    const { raiz } = montar();

    expect(raiz.dataset.js).toBe("true");
    expect(raiz.dataset.estado).toBe("fechado");
    expect(cartoes(raiz).map((c) => c.id)).toEqual(IDS);
    expect(posicoes(raiz)).toEqual(["0", "1", "2", "oculto", "oculto", "oculto", "oculto", "oculto", "-2", "-1"]);
    expect(cartao(raiz, "rota-de-vendas").getAttribute("aria-label")).toBe("2 de 10: Rota de Vendas");
    expect(cartao(raiz, "rota-de-vendas").getAttribute("aria-roledescription")).toBe(catalogoUi.roledescProduto);
    expect(screen.getByRole("region", { name: catalogoUi.rotuloCarrossel }).getAttribute("aria-roledescription")).toBe(
      catalogoUi.roledescCarrossel,
    );
    // A live region nasce vazia: só anuncia trocas.
    expect(anuncio(raiz)).toBe("");
  });

  it("seta 'Próximo produto' centraliza o Rota de Vendas e a live region diz '2 de 10: Rota de Vendas'", () => {
    const { raiz } = montar();

    fireEvent.click(screen.getByRole("button", { name: catalogoUi.proximo }));
    expect(centro(raiz)).toBe("rota-de-vendas");
    expect(anuncio(raiz)).toBe("2 de 10: Rota de Vendas");

    fireEvent.click(screen.getByRole("button", { name: catalogoUi.anterior }));
    fireEvent.click(screen.getByRole("button", { name: catalogoUi.anterior }));
    expect(centro(raiz)).toBe("contador-de-fluxo");
    expect(anuncio(raiz)).toBe("10 de 10: Contador de fluxo para lojas");
  });

  it("bolinhas: uma por produto, com nome; a ativa tem aria-current e leva ao produto", () => {
    const { raiz } = montar();
    const bolinhas = [...raiz.querySelectorAll<HTMLButtonElement>(".catalogo__bolinhas button")];

    expect(bolinhas.map((b) => b.getAttribute("aria-label"))).toEqual(
      CATALOGO.map((item) => catalogoUi.irPara.replace("{nome}", item.nome)),
    );
    expect(bolinhas.map((b) => b.getAttribute("aria-current"))).toEqual(["true", ...Array(9).fill(null)]);

    fireEvent.click(screen.getByRole("button", { name: "Ir para Totem de check-in para academias" }));
    expect(centro(raiz)).toBe("totem-check-in");
    expect(raiz.querySelector('.catalogo__bolinhas button[aria-current="true"]')?.getAttribute("aria-label")).toBe(
      "Ir para Totem de check-in para academias",
    );
  });

  it("clicar num lateral (data-pos=1) o centraliza; não abre", () => {
    const { raiz } = montar();

    fireEvent.click(cartao(raiz, "rota-de-vendas").querySelector("h3")!);
    expect(centro(raiz)).toBe("rota-de-vendas");
    expect(raiz.dataset.estado).toBe("fechado");
    expect(window.history.pushState).not.toHaveBeenCalled();
  });

  it("clicar no cartão do centro ou em 'Ver detalhes' abre (Q9)", () => {
    vi.spyOn(window.history, "back").mockImplementation(() => {});
    const { raiz } = montar();
    const fecharPainel = () => {
      fireEvent.click(screen.getByRole("button", { name: catalogoUi.fechar }));
      act(() => window.dispatchEvent(new PopStateEvent("popstate")));
      expect(raiz.dataset.estado).toBe("fechado");
    };

    // O nome (h3) do centro.
    fireEvent.click(cartao(raiz, "replay").querySelector("h3")!);
    expect(raiz.dataset.estado).toBe("aberto");
    expect(window.history.pushState).toHaveBeenCalledTimes(1);
    fecharPainel();

    // A arte do centro.
    fireEvent.click(cartao(raiz, "replay").querySelector(".catalogo__arte")!);
    expect(raiz.dataset.estado).toBe("aberto");
    expect(window.history.pushState).toHaveBeenCalledTimes(2);
    fecharPainel();

    // O botão "Ver detalhes".
    fireEvent.click(screen.getByRole("button", { name: "Ver detalhes de Replay para quadras" }));
    expect(raiz.dataset.estado).toBe("aberto");
    expect(window.history.pushState).toHaveBeenCalledTimes(3);
  });

  it("← → e Home/End trocam só com o foco dentro do carrossel; keydown no body não troca", () => {
    const { raiz } = montar();

    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(centro(raiz)).toBe("replay");

    const ver = screen.getByRole("button", { name: "Ver detalhes de Replay para quadras" });
    ver.focus();
    fireEvent.keyDown(ver, { key: "ArrowRight" });
    expect(centro(raiz)).toBe("rota-de-vendas");
    // O botão que tinha o foco saiu do centro: o foco segue o novo centro.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Ver detalhes de Rota de Vendas" }));

    const seta = screen.getByRole("button", { name: catalogoUi.proximo });
    fireEvent.keyDown(seta, { key: "End" });
    expect(centro(raiz)).toBe("contador-de-fluxo");
    fireEvent.keyDown(seta, { key: "Home" });
    expect(centro(raiz)).toBe("replay");
    fireEvent.keyDown(seta, { key: "ArrowLeft" });
    expect(centro(raiz)).toBe("contador-de-fluxo");
    // Com modificador (Alt+← é o voltar do navegador), não troca.
    fireEvent.keyDown(seta, { key: "ArrowRight", altKey: true });
    expect(centro(raiz)).toBe("contador-de-fluxo");
    // O filtro fica fora do carrossel.
    fireEvent.keyDown(screen.getByRole("button", { name: catalogoUi.filtros.site }), { key: "ArrowRight" });
    expect(centro(raiz)).toBe("contador-de-fluxo");
  });

  it("Enter num lateral o centraliza e leva o foco ao 'Ver detalhes' dele; no centro, abre", () => {
    const { raiz } = montar();
    const fleet = cartao(raiz, "fleet-analytics-bi");
    expect(fleet.tabIndex).toBe(0);

    fleet.focus();
    fireEvent.keyDown(fleet, { key: "Enter" });
    expect(centro(raiz)).toBe("fleet-analytics-bi");
    expect(raiz.dataset.estado).toBe("fechado");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Ver detalhes de Fleet Analytics BI" }));

    fireEvent.keyDown(fleet, { key: " " });
    expect(raiz.dataset.estado).toBe("aberto");
  });

  it("filtro 'Sites' deixa 2 cartões (data-pos 0 e 1), 2 bolinhas, sem cartão duplicado", () => {
    const { raiz } = montar();
    const sites = screen.getByRole("button", { name: catalogoUi.filtros.site });
    expect(sites.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(sites);
    expect(sites.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: catalogoUi.filtros.todos }).getAttribute("aria-pressed")).toBe("false");
    expect(cartoes(raiz).map((c) => c.id)).toEqual(["site-clinicas", "vitrine-lojas"]);
    expect(posicoes(raiz)).toEqual(["0", "1"]);
    expect(raiz.querySelectorAll(".catalogo__bolinhas button")).toHaveLength(2);
    expect(cartao(raiz, "vitrine-lojas").getAttribute("aria-label")).toBe("2 de 2: Vitrine para lojas de bairro");
    expect(anuncio(raiz)).toBe("1 de 2: Site para clínicas");
  });

  it("filtro 'Sites' e 'Próximo produto' duas vezes voltam ao Site para clínicas (volta circular)", () => {
    const { raiz } = montar();
    fireEvent.click(screen.getByRole("button", { name: catalogoUi.filtros.site }));

    const proximo = screen.getByRole("button", { name: catalogoUi.proximo });
    fireEvent.click(proximo);
    expect(centro(raiz)).toBe("vitrine-lojas");
    expect(posicoes(raiz)).toEqual(["1", "0"]);
    fireEvent.click(proximo);
    expect(centro(raiz)).toBe("site-clinicas");
    expect(posicoes(raiz)).toEqual(["0", "1"]);
  });

  it("com 1 item, sem setas e sem bolinhas", () => {
    render(<CatalogoInterativo itens={[porSlug("replay")]} />);

    expect(screen.queryByRole("button", { name: catalogoUi.proximo })).toBeNull();
    expect(screen.queryByRole("button", { name: catalogoUi.anterior })).toBeNull();
    expect(document.querySelector(".catalogo__bolinhas")).toBeNull();
    expect(document.querySelector('.catalogo__cartao[data-pos="0"]')?.id).toBe("replay");
  });

  it("deslizar o dedo 120 px para a esquerda troca; 30 px na horizontal com 200 px na vertical não troca", () => {
    const { raiz } = montar();
    const palco = raiz.querySelector<HTMLElement>(".catalogo__palco")!;

    // Gesto vertical (a página rola): não troca.
    fireEvent.pointerDown(palco, { clientX: 300, clientY: 100, pointerType: "touch" });
    fireEvent.pointerUp(palco, { clientX: 270, clientY: 300, pointerType: "touch" });
    expect(centro(raiz)).toBe("replay");

    // Curto demais (|dx| < 40): não troca.
    fireEvent.pointerDown(palco, { clientX: 300, clientY: 100, pointerType: "touch" });
    fireEvent.pointerUp(palco, { clientX: 270, clientY: 100, pointerType: "touch" });
    expect(centro(raiz)).toBe("replay");

    // Para a esquerda: o próximo.
    fireEvent.pointerDown(palco, { clientX: 300, clientY: 100, pointerType: "touch" });
    fireEvent.pointerUp(palco, { clientX: 180, clientY: 110, pointerType: "touch" });
    expect(centro(raiz)).toBe("rota-de-vendas");

    // Para a direita: o anterior; o clique que o navegador manda depois do
    // arrasto não abre nem centraliza o cartão de baixo.
    fireEvent.pointerDown(palco, { clientX: 100, clientY: 100, pointerType: "touch" });
    fireEvent.pointerUp(palco, { clientX: 220, clientY: 100, pointerType: "touch" });
    fireEvent.click(cartao(raiz, "replay"));
    expect(centro(raiz)).toBe("replay");
    expect(raiz.dataset.estado).toBe("fechado");
  });

  it("depois de deslizar o dedo (que não gera clique), o Enter no 'Ver detalhes' do novo centro abre", async () => {
    const { raiz } = montar();
    const palco = raiz.querySelector<HTMLElement>(".catalogo__palco")!;

    fireEvent.pointerDown(palco, { clientX: 300, clientY: 100, pointerType: "touch" });
    fireEvent.pointerUp(palco, { clientX: 180, clientY: 110, pointerType: "touch" });
    expect(centro(raiz)).toBe("rota-de-vendas");
    await proximaTarefa();

    // O Enter (ou o leitor de tela) gera um clique sem pointerdown antes.
    fireEvent.click(screen.getByRole("button", { name: "Ver detalhes de Rota de Vendas" }));
    expect(raiz.dataset.estado).toBe("aberto");
  });

  it("troca pelo teclado num cartão: o foco segue o novo centro e a live region não repete o anúncio; a seta 'Próximo produto' anuncia", () => {
    const { raiz } = montar();
    fireEvent.click(screen.getByRole("button", { name: catalogoUi.proximo }));
    expect(anuncio(raiz)).toBe("2 de 10: Rota de Vendas");

    // Enter num lateral: quem fala é o leitor, ao chegar ao grupo do novo centro.
    const fleet = cartao(raiz, "fleet-analytics-bi");
    fleet.focus();
    fireEvent.keyDown(fleet, { key: "Enter" });
    const verFleet = screen.getByRole("button", { name: "Ver detalhes de Fleet Analytics BI" });
    expect(document.activeElement).toBe(verFleet);
    expect(anuncio(raiz)).toBe("");

    // → com o foco no "Ver detalhes": o foco também segue o novo centro.
    fireEvent.keyDown(verFleet, { key: "ArrowRight" });
    expect(centro(raiz)).toBe("placar-conectado");
    expect(document.activeElement?.closest(".catalogo__cartao")?.id).toBe("placar-conectado");
    expect(anuncio(raiz)).toBe("");

    fireEvent.click(screen.getByRole("button", { name: catalogoUi.proximo }));
    expect(anuncio(raiz)).toBe(`5 de 10: ${porSlug("agenda-de-quadras").nome}`);
  });

  it("os ocultos têm inert e aria-hidden; os botões dos laterais não estão na ordem de Tab", () => {
    const { raiz } = montar();

    for (const c of cartoes(raiz)) {
      const oculto = c.dataset.pos === "oculto";
      expect(c.hasAttribute("inert")).toBe(oculto);
      expect(c.getAttribute("aria-hidden")).toBe(oculto ? "true" : null);
    }
    for (const lateral of cartoes(raiz).filter((c) => c.dataset.pos !== "0" && c.dataset.pos !== "oculto")) {
      expect(lateral.tabIndex).toBe(0);
      expect(lateral.querySelector(".catalogo__ver")).toBeNull();
    }
    const centroEl = cartao(raiz, "replay");
    expect(centroEl.tabIndex).toBe(-1);
    expect(within(centroEl).getByRole("button", { name: "Ver detalhes de Replay para quadras" }).tabIndex).toBe(0);
  });

  // Abaixo de 768 px os ±1 só aparecem pelas pontas (§3.1): focado, mais da
  // metade do cartão fica fora da tela e o resto sob a seta (2.4.11). O
  // teclado tem as setas e as bolinhas; o dedo e o clique continuam valendo.
  it("abaixo de 768 px: os ±1 saem da ordem de Tab (o clique ainda centraliza) e os ±2 ficam inert", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((media: string) => ({
        matches: false,
        media,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      })),
    );
    try {
      const { raiz } = montar();

      for (const c of cartoes(raiz)) {
        const pos = c.dataset.pos;
        if (pos === "1" || pos === "-1") {
          expect(c.tabIndex, c.id).toBe(-1);
          expect(c.hasAttribute("inert"), c.id).toBe(false);
        }
        if (pos === "2" || pos === "-2") expect(c.hasAttribute("inert"), c.id).toBe(true);
      }
      fireEvent.click(cartao(raiz, "rota-de-vendas"));
      expect(centro(raiz)).toBe("rota-de-vendas");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  // check:browser (Tab a 1024 e 1200 px): o centro do ±2 focado caía sob a
  // seta "Próximo" (que fica acima do palco) ou fora da tela. Um lateral só
  // entra no Tab se o centro dele (deslocado 0,86 ou 1,55 largura de cartão,
  // §3.1) fica no palco, longe das setas; o resto do teclado continua.
  it("um lateral só fica na ordem de Tab se o centro dele cabe no palco, fora das setas", () => {
    let medir: () => void = () => {};
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          medir = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    let palcoLargura = 1105;
    const offsetWidth = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function (this: HTMLElement) {
      if (this.matches('.catalogo__cartao[data-pos="0"]')) return 348;
      return this.matches(".catalogo__seta") ? 48 : 0;
    });
    const clientWidth = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
      return this.matches(".catalogo__palco") ? palcoLargura : 0;
    });
    try {
      const { raiz } = montar();
      act(() => medir());
      // 1105 / 2 − 48 = 504,5: o ±1 (0,86 × 348 = 299) cabe, o ±2 (1,55 × 348 = 539) não.
      const tabPorPos = () => Object.fromEntries(cartoes(raiz).filter((c) => c.dataset.pos !== "oculto").map((c) => [c.dataset.pos, c.tabIndex]));
      expect(tabPorPos()).toEqual({ "0": -1, "1": 0, "-1": 0, "2": -1, "-2": -1 });

      palcoLargura = 1200; // 552 px para cada lado: o ±2 cabe.
      act(() => medir());
      expect(tabPorPos()).toEqual({ "0": -1, "1": 0, "-1": 0, "2": 0, "-2": 0 });

      palcoLargura = 680; // 340 − 48 = 292 px: nem o ±1 (299) cabe.
      act(() => medir());
      expect(tabPorPos()).toEqual({ "0": -1, "1": -1, "-1": -1, "2": -1, "-2": -1 });
      // Fora do Tab, mas não inert: o clique ainda centraliza.
      fireEvent.click(cartao(raiz, "rota-de-vendas"));
      expect(centro(raiz)).toBe("rota-de-vendas");
    } finally {
      offsetWidth.mockRestore();
      clientWidth.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it("axe sem violações no estado fechado", async () => {
    const { container } = montar();
    expect((await axe.run(container)).violations).toEqual([]);
  });

  it("'Quero saber mais' no <details> do replay dispara selectInterest('replay'); no Site para clínicas, 'outro'", () => {
    const handler = vi.fn();
    const parar = onInterestSelected(handler);
    const { raiz } = montar();

    const replay = within(cartao(raiz, "replay").querySelector<HTMLElement>("details.catalogo__ficha")!);
    const saberReplay = replay.getByRole("link", { name: "Quero saber mais sobre Replay para quadras", hidden: true });
    expect(saberReplay.getAttribute("href")).toBe("#contato");
    fireEvent.click(saberReplay);
    expect(handler).toHaveBeenLastCalledWith("replay");

    window.history.replaceState(null, "", "/");
    const clinicas = within(cartao(raiz, "site-clinicas"));
    fireEvent.click(clinicas.getByRole("link", { name: "Quero saber mais sobre Site para clínicas", hidden: true }));
    expect(handler).toHaveBeenLastCalledWith("outro");
    expect(handler).toHaveBeenCalledTimes(2);
    parar();
  });
});

describe("catálogo: estado aberto", () => {
  beforeEach(async () => {
    // O jsdom navega pelo link numa tarefa: o #contato clicado num teste de
    // antes chegaria (hashchange) no meio de um teste daqui e fecharia o
    // painel. Espera as tarefas pendentes e volta para "/".
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    window.history.replaceState(null, "", "/");
    // O `back()` de verdade do jsdom navegaria pelas entradas dos outros
    // testes; aqui só conta (a ordem real do popstate é testada no hook).
    vi.spyOn(window.history, "back").mockImplementation(() => {});
  });

  /** Abre o produto do centro pelo "Ver detalhes" e devolve o painel. */
  function abrir(raiz: HTMLElement, nome = "Replay para quadras") {
    fireEvent.click(screen.getByRole("button", { name: `Ver detalhes de ${nome}` }));
    return raiz.querySelector<HTMLElement>(".catalogo__painel")!;
  }
  const tituloPainel = (raiz: HTMLElement) => raiz.querySelector(".catalogo__painel h3")?.textContent;
  const fita = (raiz: HTMLElement) => raiz.querySelector<HTMLElement>(".catalogo__fita")!;

  it("clicar em 'Ver detalhes' abre: data-estado='aberto', foco no h3 'Replay para quadras', fita com 10 botões e aria-current no replay", () => {
    const { raiz } = montar();
    expect(raiz.querySelector(".catalogo__painel")).toBeNull();

    const painel = abrir(raiz);
    expect(raiz.dataset.estado).toBe("aberto");
    expect(painel.tagName).toBe("SECTION");
    const h3 = within(painel).getByRole("heading", { level: 3, name: "Replay para quadras" });
    expect(painel.getAttribute("aria-labelledby")).toBe(h3.id);
    expect(document.activeElement).toBe(h3);
    // Cabeçalho: tipo, selo e o X.
    expect(within(painel).getByText(catalogoUi.tipos.hardware)).toBeTruthy();
    expect(within(painel).getByRole("button", { name: catalogoUi.fechar })).toBeTruthy();

    const botoes = [...fita(raiz).querySelectorAll<HTMLButtonElement>("button")];
    expect(botoes).toHaveLength(10);
    expect(botoes.map((b) => b.textContent)).toEqual(CATALOGO.map((item) => item.nome));
    expect(botoes.filter((b) => b.getAttribute("aria-current") === "true").map((b) => b.textContent)).toEqual([
      "Replay para quadras",
    ]);
    // O coverflow sai da tela, mas os cartões (com o id da âncora) ficam.
    expect(raiz.querySelector(".catalogo__carrossel")?.hasAttribute("hidden")).toBe(true);
    expect(cartao(raiz, "replay")).not.toBeNull();
  });

  it("abas: 'Como funciona' mostra 3 passos; → na aba ativa leva o foco para 'Telas'", () => {
    const { raiz } = montar();
    const painel = abrir(raiz);
    const abas = within(painel).getAllByRole("tab");
    expect(abas.map((a) => a.textContent)).toEqual([
      catalogoUi.abas.visaoGeral,
      catalogoUi.abas.comoFunciona,
      catalogoUi.abas.telas,
    ]);
    expect(abas.map((a) => a.getAttribute("aria-selected"))).toEqual(["true", "false", "false"]);
    expect(abas.map((a) => a.tabIndex)).toEqual([0, -1, -1]);

    fireEvent.click(abas[1]!);
    const visivel = within(painel).getByRole("tabpanel");
    expect(abas[1]!.getAttribute("aria-selected")).toBe("true");
    expect(abas[1]!.getAttribute("aria-controls")).toBe(visivel.id);
    expect(visivel.getAttribute("aria-labelledby")).toBe(abas[1]!.id);
    const passos = within(visivel).getAllByRole("listitem");
    expect(passos).toHaveLength(3);
    expect(passos[0]!.textContent).toContain(porSlug("replay").painel.comoFunciona[0].titulo);

    abas[1]!.focus();
    fireEvent.keyDown(abas[1]!, { key: "ArrowRight" });
    expect(document.activeElement).toBe(abas[2]);
    expect(abas[2]!.getAttribute("aria-selected")).toBe("true");
    // Telas: uma por vez, com as setas para passar.
    expect(within(painel).getByRole("tabpanel").querySelectorAll(".catalogo__tela:not([hidden])")).toHaveLength(1);
    expect(within(painel).getByRole("button", { name: catalogoUi.proximaTela })).toBeTruthy();
    // A seta nas abas não troca de produto; Home e End também andam nelas.
    expect(tituloPainel(raiz)).toBe("Replay para quadras");
    fireEvent.keyDown(abas[2]!, { key: "ArrowRight" });
    expect(document.activeElement).toBe(abas[0]);
    fireEvent.keyDown(abas[0]!, { key: "End" });
    expect(document.activeElement).toBe(abas[2]);
    fireEvent.keyDown(abas[2]!, { key: "Home" });
    expect(document.activeElement).toBe(abas[0]);
    expect(tituloPainel(raiz)).toBe("Replay para quadras");
  });

  it("Alt/Ctrl/Meta+← → nas abas não trocam de aba nem chamam preventDefault (voltar e avançar do navegador)", () => {
    const { raiz } = montar();
    const painel = abrir(raiz);
    const abas = within(painel).getAllByRole("tab");
    abas[0]!.focus();

    for (const modificador of [{ altKey: true }, { ctrlKey: true }, { metaKey: true }]) {
      for (const key of ["ArrowLeft", "ArrowRight"]) {
        // fireEvent devolve false quando alguém chamou preventDefault.
        expect(fireEvent.keyDown(abas[0]!, { key, ...modificador }), `${key} ${JSON.stringify(modificador)}`).toBe(true);
        expect(document.activeElement).toBe(abas[0]);
        expect(abas.map((a) => a.getAttribute("aria-selected"))).toEqual(["true", "false", "false"]);
      }
    }
    expect(tituloPainel(raiz)).toBe("Replay para quadras");
  });

  it("→ com o foco no X troca para o Rota de Vendas e a live region anuncia '2 de 10: Rota de Vendas'", () => {
    const { raiz } = montar();
    const painel = abrir(raiz);
    const fechar = within(painel).getByRole("button", { name: catalogoUi.fechar });

    fechar.focus();
    fireEvent.keyDown(fechar, { key: "ArrowRight" });
    expect(raiz.dataset.estado).toBe("aberto");
    expect(tituloPainel(raiz)).toBe("Rota de Vendas");
    expect(anuncio(raiz)).toBe("2 de 10: Rota de Vendas");
    expect(window.location.hash).toBe("#rota-de-vendas");
    // O foco fica no X, que não sai do painel.
    expect(document.activeElement).toBe(fechar);
    expect(fita(raiz).querySelector('button[aria-current="true"]')?.textContent).toBe("Rota de Vendas");

    // As setas ‹ › do painel também trocam; com Alt (voltar do navegador), não.
    fireEvent.click(within(painel).getByRole("button", { name: catalogoUi.anterior }));
    expect(tituloPainel(raiz)).toBe("Replay para quadras");
    fireEvent.keyDown(fechar, { key: "ArrowLeft", altKey: true });
    expect(tituloPainel(raiz)).toBe("Replay para quadras");
    fireEvent.keyDown(fechar, { key: "ArrowLeft" });
    expect(tituloPainel(raiz)).toBe("Contador de fluxo para lojas");
  });

  it("→ com o foco no <video> do painel não troca de produto", () => {
    const { raiz } = montar();
    const painel = abrir(raiz);
    fireEvent.click(within(painel).getByRole("button", { name: "Assistir ao vídeo: Replay para quadras (52 s)" }));
    const video = painel.querySelector<HTMLVideoElement>("video.catalogo__video")!;
    expect(document.activeElement).toBe(video);

    fireEvent.keyDown(video, { key: "ArrowRight" });
    fireEvent.keyDown(video, { key: "ArrowLeft" });
    expect(tituloPainel(raiz)).toBe("Replay para quadras");
    // Nem o dedo arrastando a barra do vídeo.
    fireEvent.pointerDown(video, { clientX: 300, clientY: 100, pointerType: "touch" });
    fireEvent.pointerUp(video, { clientX: 100, clientY: 100, pointerType: "touch" });
    expect(tituloPainel(raiz)).toBe("Replay para quadras");
  });

  it("→ com o foco na pílula do filtro não troca de produto", () => {
    const { raiz } = montar();
    abrir(raiz);
    const pilula = screen.getByRole("button", { name: catalogoUi.filtros.todos });

    pilula.focus();
    fireEvent.keyDown(pilula, { key: "ArrowRight" });
    expect(tituloPainel(raiz)).toBe("Replay para quadras");
    // Um campo de texto dentro do painel (Review Focus 2) também fica de fora.
    const campo = document.createElement("input");
    raiz.querySelector(".catalogo__painel")!.append(campo);
    fireEvent.keyDown(campo, { key: "ArrowRight" });
    expect(tituloPainel(raiz)).toBe("Replay para quadras");
  });

  it("o dedo no painel troca de produto com a regra do coverflow", () => {
    const { raiz } = montar();
    const painel = abrir(raiz);
    const alvo = painel.querySelector<HTMLElement>(".catalogo__painel-cabeca")!;

    fireEvent.pointerDown(alvo, { clientX: 300, clientY: 100, pointerType: "touch" });
    fireEvent.pointerUp(alvo, { clientX: 270, clientY: 300, pointerType: "touch" });
    expect(tituloPainel(raiz)).toBe("Replay para quadras");

    fireEvent.pointerDown(alvo, { clientX: 300, clientY: 100, pointerType: "touch" });
    fireEvent.pointerUp(alvo, { clientX: 180, clientY: 110, pointerType: "touch" });
    expect(tituloPainel(raiz)).toBe("Rota de Vendas");
  });

  it("depois de deslizar o dedo no painel (sem clique), o Enter no X fecha", async () => {
    const { raiz } = montar();
    const painel = abrir(raiz);
    const alvo = painel.querySelector<HTMLElement>(".catalogo__painel-cabeca")!;

    fireEvent.pointerDown(alvo, { clientX: 300, clientY: 100, pointerType: "touch" });
    fireEvent.pointerUp(alvo, { clientX: 180, clientY: 110, pointerType: "touch" });
    expect(tituloPainel(raiz)).toBe("Rota de Vendas");
    await proximaTarefa();

    const fechar = within(raiz.querySelector<HTMLElement>(".catalogo__painel")!).getByRole("button", {
      name: catalogoUi.fechar,
    });
    fireEvent.click(fechar);
    expect(raiz.dataset.estado).toBe("fechado");
  });

  it("arrastar o mouse sobre o texto do painel (selecionar) não troca de produto nem engole o clique", () => {
    const { raiz } = montar();
    const painel = abrir(raiz);
    const texto = painel.querySelector<HTMLElement>(".catalogo__para-quem")!;

    fireEvent.pointerDown(texto, { clientX: 300, clientY: 100, pointerType: "mouse", button: 0 });
    fireEvent.pointerUp(texto, { clientX: 100, clientY: 104, pointerType: "mouse", button: 0 });
    expect(tituloPainel(raiz)).toBe("Replay para quadras");
    // O clique que vem depois da seleção chega ao destino.
    fireEvent.click(within(painel).getByRole("tab", { name: catalogoUi.abas.comoFunciona }));
    expect(within(painel).getByRole("tab", { name: catalogoUi.abas.comoFunciona }).getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  it("'Quero saber mais' no painel leva a #contato: fecha sem levar o foco (nem a rolagem) de volta ao cartão", async () => {
    const { raiz } = montar();
    const painel = abrir(raiz);
    const focar = vi.spyOn(HTMLElement.prototype, "focus");
    const link = within(painel).getByRole("link", { name: /Quero saber mais sobre Replay para quadras/ });
    link.focus();

    // O navegador segue o link: a URL vai para #contato e vem o hashchange.
    window.history.replaceState(null, "", "#contato");
    act(() => window.dispatchEvent(new HashChangeEvent("hashchange")));
    expect(raiz.dataset.estado).toBe("fechado");
    expect(raiz.querySelector(".catalogo__painel")).toBeNull();
    expect(document.activeElement).not.toBe(cartao(raiz, "replay"));
    expect(focar.mock.contexts).not.toContain(cartao(raiz, "replay"));
    expect(window.location.hash).toBe("#contato");
  });

  it("fechar pelo X ou pelo voltar do navegador foca o cartão sem rolar a página (preventScroll)", () => {
    const { raiz } = montar();
    let painel = abrir(raiz);
    const focar = vi.spyOn(HTMLElement.prototype, "focus");
    fireEvent.click(within(painel).getByRole("button", { name: catalogoUi.fechar }));
    expect(document.activeElement).toBe(cartao(raiz, "replay"));
    const doCartao = () =>
      focar.mock.calls.filter((_, i) => focar.mock.contexts[i] === cartao(raiz, "replay")).map(([opcoes]) => opcoes);
    expect(doCartao()).toEqual([{ preventScroll: true }]);
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));

    // Voltar do navegador: o foco se perde com o painel e vai ao cartão.
    painel = abrir(raiz);
    focar.mockClear();
    window.history.replaceState(null, "", "/");
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    expect(raiz.dataset.estado).toBe("fechado");
    expect(document.activeElement).toBe(cartao(raiz, "replay"));
    expect(doCartao()).toEqual([{ preventScroll: true }]);
  });

  it("Visão geral com vídeo traz a legenda e a descrição do vídeo (alternativa em texto, WCAG 1.2.1)", () => {
    const { raiz } = montar();
    const painel = abrir(raiz);
    const { video } = porSlug("replay").painel;
    // A Visão geral do produto atual (a do anterior pode estar saindo, Task 7).
    const visao = () => painel.querySelector<HTMLElement>(`${CONTEUDO_ATUAL} .catalogo__aba-conteudo--visao`)!;

    expect(within(visao()).getByText(video!.caption)).toBeTruthy();
    const resumo = within(visao()).getByText(landingContent.aplicativos.videoDescriptionLinkLabel);
    expect(resumo.tagName).toBe("SUMMARY");
    expect(resumo.closest("details")?.textContent).toContain(video!.description);

    // Troca de produto: a legenda e a descrição acompanham o vídeo novo.
    fireEvent.click(within(painel).getByRole("button", { name: catalogoUi.proximo }));
    expect(within(visao()).getByText(porSlug("rota-de-vendas").painel.video!.caption)).toBeTruthy();
    // Os inventados não têm vídeo: nem legenda nem descrição.
    fireEvent.click(within(fita(raiz)).getByRole("button", { name: porSlug("placar-conectado").nome }));
    expect(within(visao()).queryByText(landingContent.aplicativos.videoDescriptionLinkLabel)).toBeNull();
  });

  it("miniatura do Fleet troca o painel para o Fleet sem fechar", () => {
    const { raiz } = montar();
    abrir(raiz);

    const fleet = within(fita(raiz)).getByRole("button", { name: "Fleet Analytics BI" });
    fireEvent.click(fleet);
    expect(raiz.dataset.estado).toBe("aberto");
    expect(tituloPainel(raiz)).toBe("Fleet Analytics BI");
    expect(fleet.getAttribute("aria-current")).toBe("true");
    expect(anuncio(raiz)).toBe("3 de 10: Fleet Analytics BI");
    expect(window.history.pushState).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe("#fleet-analytics-bi");
  });

  it("Esc fecha, data-estado='fechado' e o foco volta ao cartão do replay", () => {
    const { raiz } = montar();
    abrir(raiz);

    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(raiz.dataset.estado).toBe("fechado");
    expect(raiz.querySelector(".catalogo__painel")).toBeNull();
    expect(raiz.querySelector(".catalogo__carrossel")?.hasAttribute("hidden")).toBe(false);
    expect(document.activeElement).toBe(cartao(raiz, "replay"));
    expect(window.history.back).toHaveBeenCalledTimes(1);
    // O navegador conclui o back() (aqui de mentira): popstate em "/".
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    expect(raiz.dataset.estado).toBe("fechado");

    // O X faz o mesmo; depois de trocar, o cartão de origem é o do centro.
    const painel = abrir(raiz);
    expect(window.history.pushState).toHaveBeenCalledTimes(2);
    fireEvent.click(within(painel).getByRole("button", { name: catalogoUi.proximo }));
    fireEvent.click(within(painel).getByRole("button", { name: catalogoUi.fechar }));
    expect(raiz.dataset.estado).toBe("fechado");
    expect(centro(raiz)).toBe("rota-de-vendas");
    expect(document.activeElement).toBe(cartao(raiz, "rota-de-vendas"));
    // Fechado, o Esc não faz mais nada.
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(window.history.back).toHaveBeenCalledTimes(2);
  });

  it("abrir e apertar Esc no mesmo tick deixa fechado, com history.back chamado 1 vez e nenhum .catalogo__painel", () => {
    const { raiz } = montar();
    const ver = screen.getByRole("button", { name: "Ver detalhes de Replay para quadras" });

    fireEvent.click(ver);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(raiz.dataset.estado).toBe("fechado");
    expect(raiz.querySelector(".catalogo__painel")).toBeNull();
    expect(raiz.querySelector(".catalogo__fita")).toBeNull();
    expect(window.history.pushState).toHaveBeenCalledTimes(1);
    expect(window.history.back).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(cartao(raiz, "replay"));
  });

  it("dois cliques rápidos em 'Ver detalhes' fazem 1 pushState só", () => {
    const { raiz } = montar();
    const ver = screen.getByRole("button", { name: "Ver detalhes de Replay para quadras" });

    // No mesmo lote (antes do render) e logo depois dele.
    act(() => {
      ver.click();
      ver.click();
    });
    fireEvent.click(ver);
    expect(raiz.dataset.estado).toBe("aberto");
    expect(raiz.querySelectorAll(".catalogo__painel")).toHaveLength(1);
    expect(window.history.pushState).toHaveBeenCalledTimes(1);
  });

  it("a seção mantém as mesmas classes de altura nos dois estados (data-estado muda, .catalogo__corpo é o mesmo nó)", () => {
    const { raiz } = montar();
    const corpo = raiz.querySelector<HTMLElement>(".catalogo__corpo")!;
    const classes = corpo.className;

    const painel = abrir(raiz);
    expect(raiz.dataset.estado).toBe("aberto");
    expect(raiz.querySelector(".catalogo__corpo")).toBe(corpo);
    expect(corpo.className).toBe(classes);
    expect(corpo.contains(painel)).toBe(true);
    expect(corpo.contains(fita(raiz))).toBe(true);

    fireEvent.click(within(painel).getByRole("button", { name: catalogoUi.fechar }));
    expect(raiz.dataset.estado).toBe("fechado");
    expect(raiz.querySelector(".catalogo__corpo")).toBe(corpo);
    expect(corpo.className).toBe(classes);
  });

  it("vídeo só depois do clique em 'Assistir ao vídeo: Replay para quadras (52 s)'; tocar pausa um <video> de fora", () => {
    const { raiz } = montar();
    const painel = abrir(raiz);
    expect(raiz.querySelector("video")).toBeNull();

    fireEvent.click(within(painel).getByRole("button", { name: "Assistir ao vídeo: Replay para quadras (52 s)" }));
    const video = painel.querySelector<HTMLVideoElement>("video.catalogo__video")!;
    expect(video).not.toBeNull();
    expect(video.controls).toBe(true);
    expect(video.autoplay).toBe(true);
    expect(video.getAttribute("preload")).toBe("metadata");
    expect(video.getAttribute("aria-label")).toBe(porSlug("replay").painel.video!.accessibleName);
    expect(video.querySelector("source")?.getAttribute("src")).toBe("/video/replay.mp4");
    expect(document.activeElement).toBe(video);

    // Um vídeo por vez: o de fora (o hero, por exemplo) pausa.
    const fora = document.createElement("video");
    document.body.append(fora);
    Object.defineProperty(fora, "paused", { configurable: true, value: false });
    const pausar = vi.spyOn(fora, "pause").mockImplementation(() => {});
    video.dispatchEvent(new Event("play"));
    expect(pausar).toHaveBeenCalledTimes(1);
    fora.remove();
  });

  it("item fictício abre sem VideoDemo, com a arte grande", () => {
    const { raiz } = montar();
    const placar = porSlug("placar-conectado");
    fireEvent.click(screen.getByRole("button", { name: `Ir para ${placar.nome}` }));
    const painel = abrir(raiz, placar.nome);

    expect(tituloPainel(raiz)).toBe(placar.nome);
    expect(within(painel).queryByRole("button", { name: /Assistir/ })).toBeNull();
    const arte = within(painel).getByRole("img", { name: placar.arte.alt });
    expect(arte.getAttribute("src")).toBe(`${placar.arte.base}.jpg`);
    // As miniaturas da fita são decorativas: o nome está no botão.
    for (const img of fita(raiz).querySelectorAll("img")) expect(img.getAttribute("alt")).toBe("");
  });

  it("axe sem violações no estado aberto", async () => {
    const { container, raiz } = montar();
    abrir(raiz);
    expect((await axe.run(container)).violations).toEqual([]);

    fireEvent.click(screen.getByRole("tab", { name: catalogoUi.abas.telas }));
    expect((await axe.run(container)).violations).toEqual([]);
  });
});

// Task 7 (§3.1, §7, §9): o loop de 5 s do cartão, o fundo ambiente e a troca
// animada do conteúdo do painel. O jsdom não toca vídeo: `play` e `pause` são
// de mentira, e o IntersectionObserver é um falso que o teste aciona.
describe("catálogo: movimento, loop de 5 s e fundo ambiente", () => {
  let observadores: ObservadorFalso[] = [];

  class ObservadorFalso {
    alvos = new Set<Element>();
    constructor(public aviso: IntersectionObserverCallback) {
      observadores.push(this);
    }
    observe(alvo: Element) {
      this.alvos.add(alvo);
    }
    unobserve(alvo: Element) {
      this.alvos.delete(alvo);
    }
    disconnect() {
      this.alvos.clear();
    }
    takeRecords() {
      return [];
    }
  }

  /** A seção entra (ou sai) da tela: avisa todos os observadores. */
  const naTela = (visivel = true) =>
    act(() => {
      for (const obs of observadores) {
        const entradas = [...obs.alvos].map(
          (target) => ({ target, isIntersecting: visivel, intersectionRatio: visivel ? 1 : 0 }) as IntersectionObserverEntry,
        );
        if (entradas.length) obs.aviso(entradas, obs as unknown as IntersectionObserver);
      }
    });

  let play: ReturnType<typeof vi.fn>;
  let pause: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observadores = [];
    vi.stubGlobal("IntersectionObserver", ObservadorFalso);
    play = vi.fn(() => Promise.resolve());
    pause = vi.fn();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(play as never);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(pause as never);
    vi.spyOn(window.history, "back").mockImplementation(() => {});
  });

  afterEach(() => {
    // Desmonta antes de o afterEach do arquivo desfazer os falsos de play/pause.
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.querySelectorAll("body > video").forEach((v) => v.remove());
  });

  const loopDe = (raiz: HTMLElement, slug: string) =>
    cartao(raiz, slug).querySelector<HTMLVideoElement>("video.catalogo__loop");
  const fita = (raiz: HTMLElement) => raiz.querySelector<HTMLElement>(".catalogo__fita")!;

  it("o centro inicial do replay renderiza .catalogo__loop com preload='none' e sem atributo loop; os laterais não", () => {
    const { raiz } = montar();
    // Fora da tela, nada carrega nem toca (e o vídeo do hero segue tocando).
    expect(raiz.querySelector("video")).toBeNull();

    naTela();
    const loop = loopDe(raiz, "replay")!;
    expect(loop).not.toBeNull();
    expect(loop.getAttribute("preload")).toBe("none");
    expect(loop.hasAttribute("loop")).toBe(false);
    expect(loop.hasAttribute("controls")).toBe(false);
    expect(loop.hasAttribute("playsinline")).toBe(true);
    expect(loop.muted).toBe(true);
    expect(loop.getAttribute("poster")).toBe("/catalogo/replay/cartao.jpg");
    expect([...loop.querySelectorAll("source")].map((s) => [s.getAttribute("src"), s.getAttribute("type")])).toEqual([
      ["/catalogo/replay/cartao-loop.webm", "video/webm"],
      ["/catalogo/replay/cartao-loop.mp4", "video/mp4"],
    ]);
    // Decorativo, como a arte: fora da árvore de acessibilidade.
    expect(loop.getAttribute("aria-hidden")).toBe("true");
    expect(raiz.querySelectorAll("video.catalogo__loop")).toHaveLength(1);
    expect(play).toHaveBeenCalledTimes(1);
    expect(play.mock.contexts[0]).toBe(loop);

    // Os laterais têm loop (Rota e Fleet), mas só tocam com o mouse ou o foco.
    expect(loopDe(raiz, "rota-de-vendas")).toBeNull();
    expect(loopDe(raiz, "fleet-analytics-bi")).toBeNull();
    fireEvent.mouseEnter(cartao(raiz, "rota-de-vendas"));
    expect(loopDe(raiz, "rota-de-vendas")).not.toBeNull();
    fireEvent.mouseLeave(cartao(raiz, "rota-de-vendas"));
    expect(loopDe(raiz, "rota-de-vendas")).toBeNull();
    act(() => cartao(raiz, "fleet-analytics-bi").focus());
    expect(loopDe(raiz, "fleet-analytics-bi")).not.toBeNull();
    act(() => cartao(raiz, "fleet-analytics-bi").blur());
    expect(loopDe(raiz, "fleet-analytics-bi")).toBeNull();

    // Centralizar outro leva o loop junto; os inventados não têm loop.
    fireEvent.click(screen.getByRole("button", { name: catalogoUi.proximo }));
    expect(loopDe(raiz, "rota-de-vendas")).not.toBeNull();
    expect(loopDe(raiz, "replay")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Ir para Placar conectado para quadras" }));
    expect(raiz.querySelector('.catalogo__cartao[data-pos="0"] video')).toBeNull();
  });

  it("o loop pausa e volta a currentTime 0 aos 5 s", () => {
    vi.useFakeTimers();
    const { raiz } = montar();
    naTela();
    const loop = loopDe(raiz, "replay")!;

    // Os 5 s contam de quando o vídeo começa a se mexer (o `playing`).
    act(() => {
      loop.dispatchEvent(new Event("playing"));
    });
    loop.currentTime = 3.2;
    act(() => vi.advanceTimersByTime(4999));
    expect(pause).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(pause).toHaveBeenCalledTimes(1);
    expect(pause.mock.contexts[0]).toBe(loop);
    expect(loop.currentTime).toBe(0);
    // Uma vez só: não volta a tocar sozinho.
    act(() => vi.advanceTimersByTime(20_000));
    expect(play).toHaveBeenCalledTimes(1);
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it("o loop que termina antes dos 5 s (ended) também para no quadro 0", () => {
    vi.useFakeTimers();
    const { raiz } = montar();
    naTela();
    const loop = loopDe(raiz, "replay")!;

    act(() => {
      loop.dispatchEvent(new Event("playing"));
    });
    loop.currentTime = 4.96;
    act(() => {
      loop.dispatchEvent(new Event("ended"));
    });
    expect(pause).toHaveBeenCalledTimes(1);
    expect(loop.currentTime).toBe(0);
    act(() => vi.advanceTimersByTime(5000));
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it("com reduced motion não existe .catalogo__loop", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((media: string) => ({
        matches: media === REDUCED_MOTION_QUERY,
        media,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      })),
    );
    const { raiz } = montar();
    naTela();
    fireEvent.mouseEnter(cartao(raiz, "rota-de-vendas"));

    expect(raiz.querySelector(".catalogo__loop")).toBeNull();
    expect(play).not.toHaveBeenCalled();
    // A mesma árvore (ADR-004): o fundo e os cartões estão lá, sem entrada escondida.
    expect(raiz.querySelector(".catalogo__fundo")).not.toBeNull();
    const entradas = [...raiz.querySelectorAll<HTMLElement>(".catalogo__entrada")];
    expect(entradas).toHaveLength(10);
    for (const entrada of entradas) expect(entrada.style.opacity).not.toBe("0");
  });

  it("com um <video controls> tocando, o loop não chama play()", () => {
    const daPessoa = document.createElement("video");
    daPessoa.controls = true;
    Object.defineProperty(daPessoa, "paused", { configurable: true, value: false });
    document.body.append(daPessoa);

    const { raiz } = montar();
    naTela();
    expect(loopDe(raiz, "replay")).not.toBeNull();
    expect(play).not.toHaveBeenCalled();
  });

  it("FundoAmbiente usa /catalogo/<centro>/cartao-480.jpg e troca ao centralizar outro", () => {
    const { raiz } = montar();
    const fundo = raiz.querySelector<HTMLElement>(".catalogo__fundo")!;
    const camadas = () => [...fundo.querySelectorAll<HTMLImageElement>("img")];
    const visivel = () => fundo.querySelector<HTMLImageElement>('img[data-visivel="true"]')?.getAttribute("src");

    /** O jsdom não carrega imagens: o teste avisa que a camada nova carregou. */
    const carregar = (src: string) =>
      fireEvent.load(camadas().find((img) => img.getAttribute("src") === src && img.dataset.visivel === "false")!);

    // Decorativo e fora da árvore de acessibilidade.
    expect(fundo.getAttribute("aria-hidden")).toBe("true");
    expect(visivel()).toBe("/catalogo/replay/cartao-480.jpg");

    fireEvent.click(screen.getByRole("button", { name: catalogoUi.proximo }));
    // A arte nova só aparece depois de carregar (sem esmaecer para o navy).
    expect(visivel()).toBe("/catalogo/replay/cartao-480.jpg");
    carregar("/catalogo/rota-de-vendas/cartao-480.jpg");
    expect(visivel()).toBe("/catalogo/rota-de-vendas/cartao-480.jpg");
    // Duas camadas: a nova por cima, a anterior saindo (crossfade).
    expect(camadas().map((img) => img.getAttribute("src")).sort()).toEqual([
      "/catalogo/replay/cartao-480.jpg",
      "/catalogo/rota-de-vendas/cartao-480.jpg",
    ]);
    for (const img of camadas()) {
      expect(img.getAttribute("alt")).toBe("");
      expect(img.getAttribute("aria-hidden")).toBe("true");
    }

    fireEvent.click(screen.getByRole("button", { name: catalogoUi.proximo }));
    carregar("/catalogo/fleet-analytics-bi/cartao-480.jpg");
    expect(visivel()).toBe("/catalogo/fleet-analytics-bi/cartao-480.jpg");
    expect(camadas()).toHaveLength(2);
    // Com o painel aberto, o fundo segue o produto do painel.
    fireEvent.click(screen.getByRole("button", { name: "Ver detalhes de Fleet Analytics BI" }));
    fireEvent.click(within(fita(raiz)).getByRole("button", { name: porSlug("placar-conectado").nome }));
    carregar("/catalogo/placar-conectado/cartao-480.jpg");
    expect(visivel()).toBe("/catalogo/placar-conectado/cartao-480.jpg");
  });

  it("FundoAmbiente monta as duas camadas desde o 1º render: a 1ª troca também é um crossfade", () => {
    const { raiz } = montar();
    const fundo = raiz.querySelector<HTMLElement>(".catalogo__fundo")!;
    const camadas = () => [...fundo.querySelectorAll<HTMLImageElement>("img")];

    // A camada de trás já existe, apagada: ao trocar, ela vai de 0 a 1 (com
    // transição), em vez de nascer já visível (corte seco).
    expect(camadas()).toHaveLength(2);
    expect(camadas().map((img) => img.dataset.visivel)).toEqual(["true", "false"]);
    const [frente, tras] = camadas() as [HTMLImageElement, HTMLImageElement];

    fireEvent.click(screen.getByRole("button", { name: catalogoUi.proximo }));
    // Os mesmos dois elementos: nenhuma camada nova entra no DOM na troca.
    expect(camadas()).toEqual([frente, tras]);
    expect(tras.getAttribute("src")).toBe("/catalogo/rota-de-vendas/cartao-480.jpg");
    expect(tras.dataset.visivel).toBe("false");
    fireEvent.load(tras);
    expect(tras.dataset.visivel).toBe("true");
    expect(frente.dataset.visivel).toBe("false");

    // Voltar ao produto anterior: a camada já tem a arte carregada, aparece direto.
    fireEvent.click(screen.getByRole("button", { name: catalogoUi.anterior }));
    expect(frente.getAttribute("src")).toBe("/catalogo/replay/cartao-480.jpg");
    expect(frente.dataset.visivel).toBe("true");
    expect(tras.dataset.visivel).toBe("false");
  });

  it("abrir o painel com o loop tocando o pausa (1 vídeo por vez)", () => {
    const { raiz } = montar();
    naTela();
    const loop = loopDe(raiz, "replay")!;
    Object.defineProperty(loop, "paused", { configurable: true, value: false });

    fireEvent.click(screen.getByRole("button", { name: "Ver detalhes de Replay para quadras" }));
    expect(raiz.dataset.estado).toBe("aberto");
    expect(pause.mock.contexts).toContain(loop);
    // O coverflow escondido não carrega loop nenhum enquanto o painel está aberto.
    expect(raiz.querySelector("video")).toBeNull();
  });

  it("trocar com o painel aberto: o conteúdo que sai fica inert e aria-hidden, sem id repetido", () => {
    const { raiz } = montar();
    fireEvent.click(screen.getByRole("button", { name: "Ver detalhes de Replay para quadras" }));
    const painel = raiz.querySelector<HTMLElement>(".catalogo__painel")!;
    expect(painel.querySelector(CONTEUDO_ATUAL)?.getAttribute("data-direcao")).toBe("0");

    fireEvent.click(within(painel).getByRole("button", { name: catalogoUi.proximo }));
    const conteudos = [...painel.querySelectorAll<HTMLElement>(".catalogo__painel-conteudo")];
    // O do replay ainda está saindo (350 ms), por baixo do novo.
    expect(conteudos).toHaveLength(2);
    const atual = painel.querySelector<HTMLElement>(CONTEUDO_ATUAL)!;
    expect(conteudos.filter((c) => !c.hasAttribute("aria-hidden"))).toEqual([atual]);
    expect(atual.getAttribute("data-direcao")).toBe("1");
    expect(atual.textContent).toContain(porSlug("rota-de-vendas").painel.paraQuem);
    for (const saindo of conteudos.filter((c) => c !== atual)) {
      expect(saindo.hasAttribute("inert")).toBe(true);
      expect(saindo.getAttribute("aria-hidden")).toBe("true");
      expect(saindo.querySelector("[id]")).toBeNull();
    }
    // As abas apontam para os painéis do produto atual.
    for (const aba of within(painel).getAllByRole("tab")) {
      expect(atual.querySelector(`#${CSS.escape(aba.getAttribute("aria-controls")!)}`)).not.toBeNull();
    }
    const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// §8.6 (2.4.7) e 1.4.11: os laterais são paradas de Tab, e o contorno de foco
// é desenhado no próprio cartão. Se o cartão focado mantiver a opacidade e o
// filtro do ±1/±2, o anel sai apagado e borrado (no ±2, ~1,6:1 contra o fundo).
describe("catálogo: CSS (foco nos laterais, cores forçadas e altura sem JS)", () => {
  const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8").replace(/\r\n/g, "\n");
  const inicio = css.indexOf("/* 11b. Catálogo de produtos");
  const fim = css.indexOf("/* 12. Diagnóstico e formulário");
  const secao = css.slice(inicio, fim);
  const regra = (seletor: string) => {
    const i = secao.indexOf(`${seletor} {`);
    return { i, corpo: i < 0 ? "" : secao.slice(i, secao.indexOf("}", i)) };
  };

  it("o cartão focado volta a opacidade 1 e sem filtro, depois das regras do ±1/±2", () => {
    expect(inicio).toBeGreaterThan(-1);
    expect(fim).toBeGreaterThan(inicio);
    const foco = regra('.catalogo[data-js="true"] .catalogo__cartao:focus-visible');
    expect(foco.i).toBeGreaterThan(-1);
    expect(foco.corpo).toMatch(/opacity: 1;/);
    expect(foco.corpo).toMatch(/filter: none;/);
    // Mesma especificidade (0,4,0) que as regras de data-pos: vence pela ordem.
    for (const pos of ["1", "-1", "2", "-2"]) {
      const lateral = regra(`.catalogo[data-js="true"] .catalogo__cartao[data-pos="${pos}"]`);
      expect(lateral.i).toBeGreaterThan(-1);
      expect(foco.i).toBeGreaterThan(lateral.i);
    }
  });


  // §4 e §9 (CLS 0): sem JS (o HTML do servidor e o 1º render do cliente), a
  // caixa já tem a altura do coverflow. Antes, ela crescia ~195 px ao montar
  // (data-js="true"), e o /#contato carregado direto parava ~195 px abaixo
  // do formulário (check:browser, âncora direta do hero "expansao").
  it("sem JS, a caixa do catálogo já tem a altura do coverflow (nada abaixo se mexe ao montar)", () => {
    const altura = /height: (clamp\([^;]+\));/.exec(regra('.catalogo[data-js="true"] .catalogo__corpo').corpo)?.[1];
    expect(altura).toBeDefined();
    const semJs = regra('.catalogo[data-js="false"] .catalogo__corpo');
    expect(semJs.i).toBeGreaterThan(-1);
    expect(semJs.corpo).toContain(`min-height: ${altura};`);
  });

  // §8.7: com `forced-color-adjust: none` nas abas, a cor do autor fica. A
  // aba ativa e a com o mouse (0,2,0, fora do bloco) davam texto branco
  // sobre o Canvas branco de um tema de alto contraste claro.
  it("cores forçadas: a aba normal, a com o mouse e a ativa têm texto CanvasText", () => {
    const i = secao.lastIndexOf("@media (forced-colors: active) {");
    expect(i).toBeGreaterThan(-1);
    const bloco = secao.slice(i);
    const regras = [...bloco.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, seletores, corpo]) => ({
      seletores: seletores!.split(",").map((s) => s.trim()),
      corpo: corpo!,
    }));
    for (const seletor of [".catalogo__aba", ".catalogo__aba:hover", '.catalogo__aba[aria-selected="true"]']) {
      const comCor = regras.filter((r) => r.seletores.includes(seletor) && /(^|[\s;])color: CanvasText;/.test(r.corpo));
      expect(comCor, seletor).not.toHaveLength(0);
    }
  });
});
