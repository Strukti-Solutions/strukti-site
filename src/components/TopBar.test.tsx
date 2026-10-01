import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { landingContent } from "@/content/landing";
import { TopBar } from "./TopBar";

// O que muda por largura (links na barra ≥ 1024 px, painel abaixo disso) é
// CSS e fica com o check:browser; aqui vale o comportamento do menu.

afterEach(() => {
  cleanup();
});

function getToggle() {
  return screen.getByRole("button", { name: landingContent.header.menuButton });
}

describe("TopBar", () => {
  it("tem a marca, os 5 links das seções e o WhatsApp com os textos aprovados", () => {
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
});
