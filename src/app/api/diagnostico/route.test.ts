// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const originalDatabaseUrl = process.env.DATABASE_URL;

function buildRequest(body: unknown, ip = "203.0.113.1") {
  return new NextRequest("http://localhost/api/diagnostico", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  name: "Maria Souza",
  company: "Distribuidora Souza Ltda",
  whatsapp: "(83) 99999-0000",
  problem: "Perco tempo montando a rota de entrega manualmente todo dia.",
  consent: true,
  website: "",
};

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

  it("retorna 503 com mensagem clara quando DATABASE_URL não está configurado", async () => {
    delete process.env.DATABASE_URL;
    const { POST } = await import("./route");
    const response = await POST(buildRequest(validPayload, "203.0.113.11"));
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.error).toBeTruthy();
  });

  it("responde ok sem gravar quando o honeypot vem preenchido", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      buildRequest({ ...validPayload, website: "http://spam.example" }, "203.0.113.12"),
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
