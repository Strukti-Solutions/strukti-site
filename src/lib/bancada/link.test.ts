import { afterEach, describe, expect, it, vi } from "vitest";
import { LINK_BANCADA, linkBancadaSeAtiva } from "./link";

afterEach(() => vi.unstubAllEnvs());

describe("linkBancadaSeAtiva", () => {
  it("sem as variáveis da bancada, a barra do topo não ganha o botão", () => {
    vi.stubEnv("BANCADA_TOKEN", "");
    expect(linkBancadaSeAtiva()).toBeUndefined();
  });

  it("com todas as variáveis, devolve o link para /bancada", () => {
    for (const [k, v] of Object.entries({
      R2_ACCOUNT_ID: "c",
      R2_ACCESS_KEY_ID: "k",
      R2_SECRET_ACCESS_KEY: "s",
      R2_BUCKET: "b",
      BANCADA_TOKEN: "t".repeat(16),
      BANCADA_SENHA: "s".repeat(16),
    }))
      vi.stubEnv(k, v);
    expect(linkBancadaSeAtiva()).toEqual(LINK_BANCADA);
  });
});
