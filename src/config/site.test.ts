// @vitest-environment node
import { describe, expect, it } from "vitest";
import { siteConfig } from "./site";

describe("mensagem pronta do WhatsApp", () => {
  it("codifica acentos, espaços e &", () => {
    expect(siteConfig.whatsapp.linkWithMessage("Olá & até já")).toBe(
      "https://wa.me/5583999683670?text=Ol%C3%A1%20%26%20at%C3%A9%20j%C3%A1",
    );
  });

  it("as quebras de linha viram %0A", () => {
    expect(siteConfig.whatsapp.linkWithMessage("Cidade:\nQuantas quadras:")).toBe(
      "https://wa.me/5583999683670?text=Cidade%3A%0AQuantas%20quadras%3A",
    );
  });
});
