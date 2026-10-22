// @vitest-environment node
import { describe, expect, it } from "vitest";
import { landingContent } from "@/content/landing";
import { siteConfig } from "./site";

const { whatsappMessages } = landingContent;

describe("mensagem pronta do WhatsApp", () => {
  it("codifica acentos, espaços e &", () => {
    expect(siteConfig.whatsapp.linkWithMessage("Olá & até já")).toBe(
      "https://wa.me/5583999683670?text=Ol%C3%A1%20%26%20at%C3%A9%20j%C3%A1",
    );
  });

  it("a mensagem do replay leva as linhas Cidade e Quantas quadras (as quebras viram %0A)", () => {
    expect(whatsappMessages.replay.split("\n")).toEqual([
      "Olá! Vim pelo site da Strukti Soluções e quero o piloto gratuito do replay na minha quadra.",
      "Cidade:",
      "Quantas quadras:",
    ]);
    expect(siteConfig.whatsapp.linkWithMessage(whatsappMessages.replay)).toContain("%0ACidade%3A%0AQuantas%20quadras%3A");
  });
});
