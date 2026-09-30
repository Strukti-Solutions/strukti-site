import { describe, expect, it } from "vitest";
import { diagnosticoFormSchema, PROBLEM_MAX_LENGTH } from "./validation";

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

  it("rejeita nome vazio", () => {
    const result = diagnosticoFormSchema.safeParse({ ...validPayload, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejeita descrição de problema vazia", () => {
    const result = diagnosticoFormSchema.safeParse({ ...validPayload, problem: "" });
    expect(result.success).toBe(false);
  });

  it("rejeita descrição de problema maior que o limite", () => {
    const result = diagnosticoFormSchema.safeParse({
      ...validPayload,
      problem: "a".repeat(PROBLEM_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejeita whatsapp vazio com a mensagem de campo obrigatório", () => {
    const result = diagnosticoFormSchema.safeParse({ ...validPayload, whatsapp: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Informe o seu WhatsApp.");
    }
  });

  it("rejeita whatsapp com letras com a mensagem de número inválido", () => {
    const result = diagnosticoFormSchema.safeParse({ ...validPayload, whatsapp: "não é telefone" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Confira o número: ele precisa ter o DDD e o telefone completo.",
      );
    }
  });

  it("rejeita quando o consentimento não é verdadeiro", () => {
    const result = diagnosticoFormSchema.safeParse({ ...validPayload, consent: false });
    expect(result.success).toBe(false);
  });

  it("aceita quando o honeypot vem vazio", () => {
    const result = diagnosticoFormSchema.safeParse({ ...validPayload, codigoParceiro: "" });
    expect(result.success).toBe(true);
  });

  it("aceita quando o honeypot vem preenchido (a rota de API decide o que fazer)", () => {
    const result = diagnosticoFormSchema.safeParse({ ...validPayload, codigoParceiro: "spam" });
    expect(result.success).toBe(true);
  });
});
