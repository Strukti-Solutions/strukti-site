import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { landingContent } from "@/content/landing";
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
    for (const item of landingContent.header.nav) {
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
    const firstLink = screen.getByRole("link", { name: landingContent.header.nav[0].label });
    act(() => firstLink.focus());
    fireEvent.keyDown(document, { key: "Escape" });

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);
  });

  it("escolher um link fecha o painel", () => {
    render(<TopBar />);
    const toggle = getToggle();

    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("link", { name: landingContent.header.nav[1].label }));

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("o foco saindo da barra (Tab depois do último item) fecha o painel; andando dentro dela, não", () => {
    render(<TopBar />);
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    const toggle = getToggle();
    fireEvent.click(toggle);
    const whatsapp = screen.getByRole("link", { name: landingContent.header.whatsappButton });
    const firstLink = screen.getByRole("link", { name: landingContent.header.nav[0].label });

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
