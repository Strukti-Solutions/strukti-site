import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getSiteUrl } from "./siteUrl";

const ENV_KEYS = ["SITE_URL", "VERCEL_ENV", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL"] as const;

// Guarda o ambiente de quem roda os testes (shell, CI) e o devolve no fim:
// cada teste começa sem nenhuma dessas variáveis, então um SITE_URL ou
// VERCEL_* do ambiente não contamina os casos de fallback.
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

function clearEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

describe("getSiteUrl", () => {
  beforeEach(clearEnv);
  afterAll(() => {
    clearEnv();
    for (const key of ENV_KEYS) {
      const value = originalEnv[key];
      if (value !== undefined) process.env[key] = value;
    }
  });

  it("usa SITE_URL quando definido, normalizado (sem barra final)", () => {
    process.env.SITE_URL = "https://strukti.com.br/";
    expect(getSiteUrl()).toBe("https://strukti.com.br");
  });

  it("em produção na Vercel, sem SITE_URL, usa o domínio fixo do projeto (não o VERCEL_URL do deploy)", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "strukti.vercel.app";
    process.env.VERCEL_URL = "strukti-git-main-abc123.vercel.app";
    expect(getSiteUrl()).toBe("https://strukti.vercel.app");
  });

  it("em preview na Vercel, sem SITE_URL, usa o VERCEL_URL do próprio deploy", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "strukti-pr-42.vercel.app";
    expect(getSiteUrl()).toBe("https://strukti-pr-42.vercel.app");
  });

  it("fora da Vercel e sem SITE_URL, cai em localhost", () => {
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("SITE_URL vazio conta como ausente: fora da Vercel, cai em localhost (antes quebrava o build)", () => {
    process.env.SITE_URL = "";
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("SITE_URL vazio conta como ausente: em produção na Vercel, cai no domínio fixo do projeto", () => {
    process.env.SITE_URL = "";
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "strukti.vercel.app";
    process.env.VERCEL_URL = "strukti-git-main-abc123.vercel.app";
    expect(getSiteUrl()).toBe("https://strukti.vercel.app");
  });

  it("SITE_URL só com espaços também conta como ausente", () => {
    process.env.SITE_URL = "   ";
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "strukti-pr-42.vercel.app";
    expect(getSiteUrl()).toBe("https://strukti-pr-42.vercel.app");
  });

  it("SITE_URL com espaços em volta é aparado", () => {
    process.env.SITE_URL = "  https://strukti.com.br/  ";
    expect(getSiteUrl()).toBe("https://strukti.com.br");
  });

  it("VERCEL_PROJECT_PRODUCTION_URL e VERCEL_URL vazios também contam como ausentes", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "";
    process.env.VERCEL_URL = "";
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("em produção com VERCEL_PROJECT_PRODUCTION_URL vazio, cai no VERCEL_URL do deploy", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "";
    process.env.VERCEL_URL = "strukti-git-main-abc123.vercel.app";
    expect(getSiteUrl()).toBe("https://strukti-git-main-abc123.vercel.app");
  });

  it("um SITE_URL sem protocolo quebra alto (new URL), em vez de virar um caminho relativo silencioso", () => {
    process.env.SITE_URL = "dominio-sem-protocolo.com";
    expect(() => getSiteUrl()).toThrow();
  });
});
