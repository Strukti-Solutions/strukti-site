import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import axe from "axe-core";
import { landingContent } from "@/content/landing";
import { Palco } from "./Palco";
import { SeloStatus } from "./SeloStatus";
import { FichaTecnica } from "./FichaTecnica";

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
    const terms = container.querySelectorAll("dl.ficha dt");
    const values = container.querySelectorAll("dl.ficha dd");
    expect([...terms].map((term) => term.textContent)).toEqual(["do lance", "da arena"]);
    expect([...values].map((value) => value.textContent)).toEqual(["30 s", "Wi-Fi"]);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
