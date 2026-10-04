import { describe, expect, it } from "vitest";
import { landingContent } from "@/content/landing";
import { contatoFormSchema, PROBLEM_MAX_LENGTH } from "./validation";

const validPayload = {
  name: "Maria Souza",
  company: "Distribuidora Souza Ltda",
  whatsapp: "(83) 99999-0000",
  interest: "replay",
  problem: "Perco tempo montando a rota de entrega manualmente todo dia.",
  consent: true,
};

describe("contatoFormSchema", () => {
  it("aceita um payload válido", () => {
    const result = contatoFormSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    const result = contatoFormSchema.safeParse({ ...validPayload, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejeita descrição de problema vazia", () => {
    const result = contatoFormSchema.safeParse({ ...validPayload, problem: "" });
    expect(result.success).toBe(false);
  });

  it("rejeita descrição de problema maior que o limite", () => {
    const result = contatoFormSchema.safeParse({
      ...validPayload,
      problem: "a".repeat(PROBLEM_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejeita whatsapp vazio com a mensagem de campo obrigatório", () => {
    const result = contatoFormSchema.safeParse({ ...validPayload, whatsapp: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(landingContent.contato.form.fields.whatsapp.errorEmpty);
    }
  });

  it("rejeita whatsapp com letras com a mensagem de número inválido", () => {
    const result = contatoFormSchema.safeParse({ ...validPayload, whatsapp: "não é telefone" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(landingContent.contato.form.fields.whatsapp.errorInvalid);
    }
  });

  it("rejeita interesse ausente com a mensagem do campo", () => {
    const withoutInterest: Partial<typeof validPayload> = { ...validPayload };
    delete withoutInterest.interest;
    const result = contatoFormSchema.safeParse(withoutInterest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(landingContent.contato.form.fields.interest.errorEmpty);
    }
  });

  it("rejeita interesse fora da lista", () => {
    const result = contatoFormSchema.safeParse({ ...validPayload, interest: "drone" });
    expect(result.success).toBe(false);
  });

  it.each(["replay", "estacionamento", "aplicativo", "outro"])("aceita o interesse %s", (interest) => {
    expect(contatoFormSchema.safeParse({ ...validPayload, interest }).success).toBe(true);
  });

  it("rejeita quando o consentimento não é verdadeiro", () => {
    const result = contatoFormSchema.safeParse({ ...validPayload, consent: false });
    expect(result.success).toBe(false);
  });

  it("aceita quando o honeypot vem vazio", () => {
    const result = contatoFormSchema.safeParse({ ...validPayload, codigoParceiro: "" });
    expect(result.success).toBe(true);
  });

  it("aceita quando o honeypot vem preenchido (a rota de API decide o que fazer)", () => {
    const result = contatoFormSchema.safeParse({ ...validPayload, codigoParceiro: "spam" });
    expect(result.success).toBe(true);
  });
});
