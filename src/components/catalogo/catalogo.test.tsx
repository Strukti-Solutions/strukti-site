import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
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
