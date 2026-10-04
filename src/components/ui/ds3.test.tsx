import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import axe from "axe-core";
import { landingContent } from "@/content/landing";
import { Palco } from "./Palco";
import { SeloStatus } from "./SeloStatus";
import { FichaTecnica } from "./FichaTecnica";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("peças do DS v3", () => {
  it("o palco envolve o conteúdo e esconde a luz da tecnologia assistiva", () => {
    const { container } = render(
      <Palco className="extra">
        <p>produto</p>
      </Palco>,
    );
    const palco = container.querySelector(".palco.extra");
    expect(palco).not.toBeNull();
    expect(palco?.querySelector(".palco__luz")?.getAttribute("aria-hidden")).toBe("true");
    expect(palco?.querySelector(".palco__conteudo")?.textContent).toBe("produto");
    // A luz vem antes do conteúdo no DOM: o CSS a pinta atrás do produto.
    expect([...(palco?.children ?? [])].map((child) => child.className)).toEqual(["palco__luz", "palco__conteudo"]);
  });

  it.each([
    ["piloto", "selo--piloto"],
    ["desenvolvimento", "selo--desenvolvimento"],
    ["emUso", "selo--em-uso"],
    ["emBreve", "selo--em-breve"],
  ] as const)("o selo %s mostra o rótulo fixo", (status, className) => {
    render(<SeloStatus status={status} />);
    const selo = screen.getByText(landingContent.statusLabels[status]);
    expect(selo.classList.contains("selo")).toBe(true);
    expect(selo.classList.contains(className)).toBe(true);
  });

  it("a ficha técnica liga cada rótulo ao seu valor e passa no axe", async () => {
    const { container } = render(
      <FichaTecnica
        items={[
          { value: "30 s", label: "do lance" },
          { value: "Wi-Fi", label: "da arena" },
        ]}
      />,
    );
    // Cada item tem o seu dt seguido do seu dd (rótulo antes do valor), na ordem dos dados.
    const items = container.querySelectorAll("dl.ficha > .ficha__item");
    expect([...items].map((item) => [...item.children].map((child) => `${child.tagName}:${child.textContent}`))).toEqual([
      ["DT:do lance", "DD:30 s"],
      ["DT:da arena", "DD:Wi-Fi"],
    ]);
    expect((await axe.run(container)).violations).toEqual([]);
  });

  it("a ficha técnica aceita dois itens com o mesmo rótulo sem chave repetida", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(
      <FichaTecnica
        items={[
          { value: "30 s", label: "do lance" },
          { value: "60 s", label: "do lance" },
        ]}
      />,
    );
    expect(container.querySelectorAll("dl.ficha dd")).toHaveLength(2);
    const keyWarnings = consoleError.mock.calls.filter((args) => args.some((arg) => String(arg).includes("same key")));
    expect(keyWarnings).toEqual([]);
  });
});
