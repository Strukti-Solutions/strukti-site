import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { landingContent } from "@/content/landing";
import { CATALOGO, catalogoUi } from "@/content/catalogo";
import { TOPBAR_WIDE_QUERY, TopBar } from "./TopBar";
import { LINK_BANCADA } from "@/lib/bancada/link";

// O que muda por largura (links na barra ≥ 75em, painel abaixo disso) é CSS
// e fica com o check:browser; aqui vale o comportamento do menu e a conferência
// de que o CSS e o TopBar usam o mesmo ponto de corte.

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function getToggle() {
  return screen.getByRole("button", { name: landingContent.header.menuButton });
}

describe("TopBar", () => {
  it("tem a marca, os links das seções e o WhatsApp com os textos aprovados", () => {
    render(<TopBar />);

    expect(screen.getByRole("img", { name: "Strukti Soluções" })).toBeTruthy();
    const nav = screen.getByRole("navigation", { name: "Principal" });
    // "Produtos" é o botão do menu (describe "menu Produtos"); os outros, links.
    for (const item of landingContent.header.nav.filter((entry) => entry.href !== "#produtos")) {
      const link = screen.getByRole("link", { name: item.label });
      expect(link.getAttribute("href")).toBe(item.href);
      expect(nav.contains(link)).toBe(true);
    }
    expect(screen.getByRole("link", { name: landingContent.header.whatsappButton })).toBeTruthy();
  });

  it("sem a bancada ligada, não mostra o botão da aba de testes", () => {
    render(<TopBar />);
    expect(screen.queryByRole("link", { name: LINK_BANCADA.label })).toBeNull();
  });

  it("com a bancada ligada, mostra o botão para /bancada dentro da navegação, antes do WhatsApp", () => {
    render(<TopBar linkBancada={LINK_BANCADA} />);
    const link = screen.getByRole("link", { name: LINK_BANCADA.label });
    expect(link.getAttribute("href")).toBe("/bancada");
    expect(screen.getByRole("navigation", { name: "Principal" }).contains(link)).toBe(true);
    const whatsapp = screen.getByRole("link", { name: landingContent.header.whatsappButton });
    expect(link.compareDocumentPosition(whatsapp) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("o botão Menu abre e fecha o painel e diz o estado em aria-expanded", () => {
    const { container } = render(<TopBar />);
    const toggle = getToggle();
    const header = container.querySelector("header.topbar");

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-controls")).toBe(screen.getByRole("navigation").id);
    expect(header?.getAttribute("data-open")).toBe("false");

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(header?.getAttribute("data-open")).toBe("true");

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("Esc fecha o painel e devolve o foco ao botão", () => {
    render(<TopBar />);
    const toggle = getToggle();

    fireEvent.click(toggle);
    const firstLink = screen.getByRole("link", { name: "Equipe" });
    act(() => firstLink.focus());
    fireEvent.keyDown(document, { key: "Escape" });

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);
  });

  it("escolher um link fecha o painel", () => {
    render(<TopBar />);
    const toggle = getToggle();

    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("link", { name: "Equipe" }));

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("o foco saindo da barra (Tab depois do último item) fecha o painel; andando dentro dela, não", () => {
    render(<TopBar />);
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    const toggle = getToggle();
    fireEvent.click(toggle);
    const whatsapp = screen.getByRole("link", { name: landingContent.header.whatsappButton });
    const firstLink = screen.getByRole("link", { name: "Equipe" });

    fireEvent.focusOut(firstLink, { relatedTarget: whatsapp });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    fireEvent.focusOut(whatsapp, { relatedTarget: outside });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    outside.remove();
  });

  it("tocar fora da barra fecha o painel; tocar dentro, não", () => {
    render(<TopBar />);
    const toggle = getToggle();

    fireEvent.click(toggle);
    fireEvent.pointerDown(screen.getByRole("navigation"));
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    fireEvent.pointerDown(document.body);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("passar para a largura da barra larga fecha o painel", () => {
    let onChange: (() => void) | undefined;
    const wide = {
      matches: false,
      addEventListener: (_type: string, listener: () => void) => {
        onChange = listener;
      },
      removeEventListener: () => {},
    };
    const matchMedia = vi.fn(() => wide);
    vi.stubGlobal("matchMedia", matchMedia);
    render(<TopBar />);
    const toggle = getToggle();

    fireEvent.click(toggle);
    expect(matchMedia).toHaveBeenCalledWith(TOPBAR_WIDE_QUERY);
    wide.matches = true;
    act(() => onChange?.());

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });
});

// Spec do catálogo (2026-10-16, §3.5): os links de produto da v2.2 dão lugar
// a um botão de divulgação "Produtos ▾" (padrão disclosure, não role=menu),
// com os produtos agrupados por tipo. Na barra larga a lista abre como
// popover; no painel do Menu, como sublista. A árvore é a mesma: só o CSS muda.
describe("menu Produtos", () => {
  const produtos = landingContent.header.nav.find((item) => item.href === "#produtos")!;
  const GRUPOS = [
    { rotulo: catalogoUi.filtros.hardware, tipo: "hardware" },
    { rotulo: catalogoUi.filtros.aplicativo, tipo: "aplicativo" },
    { rotulo: catalogoUi.filtros.site, tipo: "site" },
  ] as const;

  function getProdutos() {
    return screen.getByRole("button", { name: produtos.label });
  }

  function getLista() {
    return document.getElementById(getProdutos().getAttribute("aria-controls")!)!;
  }

  it("a barra tem 'Produtos' (botão com aria-expanded=false), 'Equipe' e 'Contato'; nenhum link #replay à mostra", () => {
    render(<TopBar />);
    const nav = screen.getByRole("navigation", { name: "Principal" });

    expect(landingContent.header.nav.map((item) => item.href)).toEqual(["#produtos", "#equipe", "#contato"]);
    const botao = getProdutos();
    expect(nav.contains(botao)).toBe(true);
    expect(botao.classList.contains("topbar__produtos")).toBe(true);
    expect(botao.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("link", { name: "Equipe" }).getAttribute("href")).toBe("#equipe");
    expect(screen.getByRole("link", { name: "Contato" }).getAttribute("href")).toBe("#contato");
    expect(screen.queryByRole("link", { name: "Replay" })).toBeNull();
    expect(screen.queryAllByRole("link").filter((link) => link.getAttribute("href") === "#replay")).toEqual([]);
  });

  it("clicar em 'Produtos' abre 3 grupos (Hardware, Aplicativos, Sites) com os 10 links #slug", () => {
    render(<TopBar />);
    const botao = getProdutos();

    fireEvent.click(botao);
    expect(botao.getAttribute("aria-expanded")).toBe("true");
    const lista = getLista();
    expect(lista.classList.contains("topbar__produtos-menu")).toBe(true);
    expect(lista.hidden).toBe(false);
    // Disclosure: links comuns, sem role=menu/menuitem.
    expect(screen.queryByRole("menu")).toBeNull();

    const rotulos = [...lista.querySelectorAll("p")].map((p) => p.textContent);
    expect(rotulos).toEqual(GRUPOS.map((grupo) => grupo.rotulo));
    for (const grupo of GRUPOS) {
      const ul = within(lista).getByRole("list", { name: grupo.rotulo });
      const esperados = CATALOGO.filter((item) => item.tipo === grupo.tipo);
      expect(within(ul).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")])).toEqual(
        esperados.map((item) => [item.nome, `#${item.slug}`]),
      );
    }
    expect(lista.querySelectorAll('a[href^="#"]')).toHaveLength(CATALOGO.length);

    fireEvent.click(botao);
    expect(botao.getAttribute("aria-expanded")).toBe("false");
    expect(lista.hidden).toBe(true);
  });

  it("Esc fecha e devolve o foco ao botão; clique fora fecha", () => {
    render(<TopBar />);
    const botao = getProdutos();

    fireEvent.click(botao);
    const link = within(getLista()).getByRole("link", { name: "Rota de Vendas" });
    act(() => link.focus());
    fireEvent.keyDown(link, { key: "Escape" });
    expect(botao.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(botao);

    fireEvent.click(botao);
    fireEvent.pointerDown(getLista());
    expect(botao.getAttribute("aria-expanded")).toBe("true");
    fireEvent.pointerDown(document.body);
    expect(botao.getAttribute("aria-expanded")).toBe("false");
  });

  it("com o painel do Menu aberto, o 1º Esc fecha só a lista de produtos; o 2º, o painel", () => {
    render(<TopBar />);
    const toggle = getToggle();
    const botao = getProdutos();

    fireEvent.click(toggle);
    fireEvent.click(botao);
    act(() => botao.focus());
    fireEvent.keyDown(botao, { key: "Escape" });
    expect(botao.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(botao);

    fireEvent.keyDown(botao, { key: "Escape" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);
  });

  it("o foco saindo da lista de produtos (para Equipe ou para fora da barra) fecha a lista; andando dentro dela, não", () => {
    render(<TopBar />);
    const botao = getProdutos();
    fireEvent.click(botao);
    const [primeiro, segundo] = within(getLista()).getAllByRole("link") as [HTMLElement, HTMLElement];

    fireEvent.focusOut(botao, { relatedTarget: primeiro });
    fireEvent.focusOut(primeiro, { relatedTarget: segundo });
    expect(botao.getAttribute("aria-expanded")).toBe("true");

    fireEvent.focusOut(segundo, { relatedTarget: screen.getByRole("link", { name: "Equipe" }) });
    expect(botao.getAttribute("aria-expanded")).toBe("false");

    const fora = document.createElement("button");
    document.body.appendChild(fora);
    fireEvent.click(botao);
    fireEvent.focusOut(botao, { relatedTarget: fora });
    expect(botao.getAttribute("aria-expanded")).toBe("false");
    fora.remove();
  });

  it("escolher 'Rota de Vendas' fecha o menu e o painel do Menu, e o link aponta para #rota-de-vendas", () => {
    render(<TopBar />);
    const toggle = getToggle();
    const botao = getProdutos();

    fireEvent.click(toggle);
    fireEvent.click(botao);
    const rota = within(getLista()).getByRole("link", { name: "Rota de Vendas" });
    expect(rota.getAttribute("href")).toBe("#rota-de-vendas");
    fireEvent.click(rota);

    expect(botao.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("axe sem violações com o menu aberto", async () => {
    const { container } = render(<TopBar />);
    fireEvent.click(getToggle());
    fireEvent.click(getProdutos());
    expect((await axe.run(container)).violations).toEqual([]);
  });
});

// N1/N2 (docs/superpowers/specs/2026-10-15-hero-triangulo-3d-design.md): a
// barra recolhe numa cápsula ao rolar, e o item do trecho visível ganha
// aria-current. A troca de visual (cápsula) é CSS, por data-scrolled; aqui
// só o estado que o CSS lê. Desde o catálogo (spec 2026-10-16, §3.5), os
// alvos são as seções #produtos, #equipe e #contato; os produtos (#slug)
// ficam no menu "Produtos ▾", e quem ganha aria-current é o botão dele.
describe("barra ao rolar", () => {
  let mockedSections: HTMLElement[] = [];

  /** Um alvo do menu de `top` a `top + height` na página (o retângulo acompanha a rolagem). */
  function mockSection(id: string, top: number, height = 900) {
    const el = document.createElement("div");
    el.id = id;
    el.getBoundingClientRect = () => {
      const y = top - window.scrollY;
      return { top: y, bottom: y + height, left: 0, right: 0, width: 0, height, x: 0, y, toJSON: () => ({}) };
    };
    document.body.appendChild(el);
    mockedSections.push(el);
    return el;
  }

  function setScrollY(value: number) {
    Object.defineProperty(window, "scrollY", { configurable: true, value });
  }

  /** Os itens da barra com aria-current: o href dos links e "#produtos" para o botão. */
  function current() {
    const nav = screen.getByRole("navigation", { name: "Principal" });
    return [...nav.querySelectorAll('[aria-current="true"]')].map((el) =>
      el.classList.contains("topbar__produtos") ? "#produtos" : el.getAttribute("href"),
    );
  }

  // Onde o clique na barra deixa as seções (globals.css, barra larga): o
  // scroll-padding-top do html (barra de 72 px + 16). Sem isso, no jsdom vale 0.
  const PADDING = 88;

  /** O que o clique num item da barra faz: a âncora na URL e a página parada com o alvo em `landing`. */
  function landOn(href: string, top: number, landing: number) {
    window.history.replaceState(null, "", href);
    setScrollY(top - landing);
    act(() => {
      fireEvent(window, new HashChangeEvent("hashchange"));
      fireEvent.scroll(window);
    });
  }

  /** Produtos (o catálogo, 1000 a 1800), a Equipe e o Contato. */
  function mockPage() {
    mockSection("produtos", 1000, 800);
    mockSection("equipe", 3000);
    mockSection("contato", 4500);
    document.documentElement.style.setProperty("scroll-padding-top", `${PADDING}px`);
  }

  afterEach(() => {
    setScrollY(0);
    mockedSections.forEach((el) => el.remove());
    mockedSections = [];
    document.documentElement.style.removeProperty("scroll-padding-top");
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  });

  it("sem rolar, data-scrolled é false e nenhum item tem aria-current", () => {
    for (const item of landingContent.header.nav) mockSection(item.href.slice(1), 1000);
    const { container } = render(<TopBar />);
    act(() => fireEvent.scroll(window));

    expect(container.querySelector("header.topbar")?.getAttribute("data-scrolled")).toBe("false");
    expect(current()).toEqual([]);
  });

  it("ao passar de 40px, data-scrolled vira true", () => {
    const { container } = render(<TopBar />);
    setScrollY(80);
    act(() => fireEvent.scroll(window));
    expect(container.querySelector("header.topbar")?.getAttribute("data-scrolled")).toBe("true");
  });

  it("o link do trecho visível ganha aria-current; os outros, não", () => {
    mockSection("produtos", 0);
    mockSection("equipe", 900);

    render(<TopBar />);
    setScrollY(950);
    act(() => fireEvent.scroll(window));

    expect(current()).toEqual(["#equipe"]);
  });

  it("o botão 'Produtos' ganha aria-current quando #produtos cruza a linha da barra (mesma conta de antes)", () => {
    mockPage();
    render(<TopBar />);

    // A seção a 88 px do topo (onde o clique a deixa): cruza a linha (88 + 1).
    landOn("#produtos", 1000, PADDING);
    expect(current()).toEqual(["#produtos"]);
    expect(screen.getByRole("button", { name: "Produtos" }).getAttribute("aria-current")).toBe("true");

    // Meio pixel abaixo da linha (arredondamento da rolagem) ainda vale; 2 px, não.
    landOn("#produtos", 1000, PADDING + 0.5);
    expect(current()).toEqual(["#produtos"]);
    landOn("#produtos", 1000, PADDING + 2);
    expect(current()).toEqual([]);

    // O painel de um produto aberto pelo menu (#slug), com a página 300 px
    // dentro do catálogo: o slug não é alvo da barra, e o botão segue marcado.
    landOn("#rota-de-vendas", 1000, PADDING - 300);
    expect(current()).toEqual(["#produtos"]);

    // Equipe e Contato continuam como antes.
    landOn("#equipe", 3000, PADDING);
    expect(current()).toEqual(["#equipe"]);
    landOn("#contato", 4500, PADDING);
    expect(current()).toEqual(["#contato"]);
  });

  it("entre os alvos (ex.: Sob medida), nada fica marcado", () => {
    mockPage();
    render(<TopBar />);

    setScrollY(2000);
    act(() => fireEvent.scroll(window));
    expect(current()).toEqual([]);
  });
});

// TB2 (WCAG 1.4.12): o ponto da barra larga é um só. Se o CSS e o TopBar
// divergirem, numa faixa de larguras o painel fica aberto sem botão, ou o
// FAB some sem o WhatsApp da barra à mostra.
describe("ponto de corte da barra larga", () => {
  const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8").replace(/\r\n/g, "\n");
  const start = css.indexOf("/* 8b. Barra do topo");
  const end = css.indexOf("/* 8c. Hero com vídeo");
  const topbarSection = css.slice(start, end);

  it("é 75em, em em, para acompanhar a fonte do navegador", () => {
    expect(TOPBAR_WIDE_QUERY).toBe("(min-width: 75em)");
  });

  it("a seção da barra no globals.css troca de layout só nesse ponto", () => {
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const queries = [...topbarSection.matchAll(/@media \((min|max)-width: [^)]+\)/g)].map((m) => m[0]);
    expect(queries).toContain(`@media ${TOPBAR_WIDE_QUERY}`);
    expect(queries.filter((q) => q !== `@media ${TOPBAR_WIDE_QUERY}` && q !== "@media (min-width: 80em)")).toEqual([]);
  });

  it("a altura da barra larga e a regra do FAB usam o mesmo ponto", () => {
    expect(css).toMatch(/@media \(min-width: 75em\) \{\s*:root \{\s*--topbar-height: 60px;/);
    expect(css).toMatch(/@media \(min-width: 75em\) \{\s*\.topbar ~ \.fab-whatsapp \{\s*display: none;/);
  });
});
