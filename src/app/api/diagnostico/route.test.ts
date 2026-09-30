// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const originalDatabaseUrl = process.env.DATABASE_URL;

function buildRequest(
  body: unknown,
  ip = "203.0.113.1",
  init: { contentType?: string; origin?: string } = {},
) {
  const headers: Record<string, string> = {
    "Content-Type": init.contentType ?? "application/json",
    "x-forwarded-for": ip,
  };
  if (init.origin) {
    headers.origin = init.origin;
  }

  return new NextRequest("http://localhost/api/diagnostico", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const validPayload = {
  name: "Maria Souza",
  company: "Distribuidora Souza Ltda",
  whatsapp: "(83) 99999-0000",
  problem: "Perco tempo montando a rota de entrega manualmente todo dia.",
  consent: true,
  codigoParceiro: "",
};

beforeEach(() => {
  // Sem DATABASE_URL por padrão: nenhum teste deve depender de um banco real.
  delete process.env.DATABASE_URL;
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

describe("POST /api/diagnostico", () => {
  it("retorna 400 para payload inválido", async () => {
    const { POST } = await import("./route");
    const response = await POST(buildRequest({ name: "M" }, "203.0.113.10"));
    expect(response.status).toBe(400);
  });

  it("retorna 415 quando o Content-Type não é application/json", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      buildRequest(validPayload, "203.0.113.14", { contentType: "text/plain" }),
    );
    expect(response.status).toBe(415);
  });

  it("retorna 403 quando a origem não bate com o host", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      buildRequest(validPayload, "203.0.113.15", { origin: "https://outro-site.example" }),
    );
    expect(response.status).toBe(403);
  });

  it("retorna 503 com mensagem clara quando DATABASE_URL não está configurado", async () => {
    const { POST } = await import("./route");
    const response = await POST(buildRequest(validPayload, "203.0.113.11"));
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.error).toBeTruthy();
  });

  it("responde ok sem gravar quando o honeypot vem preenchido", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      buildRequest({ ...validPayload, codigoParceiro: "http://spam.example" }, "203.0.113.12"),
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  it("aplica limite de taxa após várias tentativas seguidas", async () => {
    const { POST } = await import("./route");
    const ip = "203.0.113.13";

    let lastResponse;
    for (let i = 0; i < 7; i += 1) {
      lastResponse = await POST(buildRequest(validPayload, ip));
    }

    expect(lastResponse?.status).toBe(429);
  });
});

describe("POST /api/diagnostico — caminho feliz (repositório mockado)", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/repository/leadRepository");
    vi.resetModules();
  });

  it("grava o lead com consentimento e responde ok quando o repositório está configurado", async () => {
    vi.resetModules();
    const save = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@/lib/repository/leadRepository", () => ({
      createLeadRepository: () => ({ save }),
      RepositoryConfigError: class RepositoryConfigError extends Error {},
    }));

    const { POST } = await import("./route");
    const response = await POST(buildRequest(validPayload, "203.0.113.20"));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);

    expect(save).toHaveBeenCalledTimes(1);
    const savedLead = save.mock.calls[0]?.[0];
    expect(savedLead).toMatchObject({
      name: validPayload.name,
      company: validPayload.company,
      whatsapp: validPayload.whatsapp,
      problem: validPayload.problem,
    });
    expect(savedLead.consentAt).toBeInstanceOf(Date);
    expect(typeof savedLead.privacyPolicyVersion).toBe("string");
    expect(savedLead.privacyPolicyVersion.length).toBeGreaterThan(0);
  });
});
