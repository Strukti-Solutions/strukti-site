import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { CATALOGO, catalogoUi, type ItemCatalogo } from "@/content/catalogo";
import { onInterestSelected } from "@/lib/interest";
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
    const { raiz } = montar();

    fireEvent.click(screen.getByRole("button", { name: "Ver detalhes de Replay para quadras" }));
    expect(raiz.dataset.estado).toBe("aberto");
    expect(window.history.pushState).toHaveBeenCalledTimes(1);
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

// §8.6 (2.4.7) e 1.4.11: os laterais são paradas de Tab, e o contorno de foco
// é desenhado no próprio cartão. Se o cartão focado mantiver a opacidade e o
// filtro do ±1/±2, o anel sai apagado e borrado (no ±2, ~1,6:1 contra o fundo).
describe("catálogo: foco visível nos laterais (CSS)", () => {
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
});
