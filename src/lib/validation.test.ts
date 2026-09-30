import { describe, expect, it } from "vitest";
import { diagnosticoFormSchema } from "./validation";

const validPayload = {
  name: "Maria Souza",
  company: "Distribuidora Souza Ltda",
  whatsapp: "(83) 99999-0000",
  problem: "Perco tempo montando a rota de entrega manualmente todo dia.",
  consent: true,
};

describe("diagnosticoFormSchema", () => {
  it("aceita um payload válido", () => {
    const result = diagnosticoFormSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejeita nome muito curto", () => {
    const result = diagnosticoFormSchema.safeParse({ ...validPayload, name: "M" });
    expect(result.success).toBe(false);
  });

  it("rejeita descrição de problema muito curta", () => {
    const result = diagnosticoFormSchema.safeParse({ ...validPayload, problem: "curto" });
    expect(result.success).toBe(false);
  });

  it("rejeita whatsapp com letras", () => {
    const result = diagnosticoFormSchema.safeParse({ ...validPayload, whatsapp: "não é telefone" });
    expect(result.success).toBe(false);
  });

  it("rejeita quando o consentimento não é verdadeiro", () => {
    const result = diagnosticoFormSchema.safeParse({ ...validPayload, consent: false });
    expect(result.success).toBe(false);
  });

  it("aceita quando o honeypot vem vazio", () => {
    const result = diagnosticoFormSchema.safeParse({ ...validPayload, website: "" });
    expect(result.success).toBe(true);
  });

  it("aceita quando o honeypot vem preenchido (a rota de API decide o que fazer)", () => {
    const result = diagnosticoFormSchema.safeParse({ ...validPayload, website: "spam" });
    expect(result.success).toBe(true);
  });
});
