// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { criarR2, ErroR2, lerListagem } from "./r2";
import { lerConfigBancada } from "./config";

const r2Config = { accountId: "conta123", accessKeyId: "AKID", secretAccessKey: "segredo", bucket: "replay-teste" };

describe("lerListagem", () => {
  it("lê chave, tamanho e data, e o token de continuação quando truncado", () => {
    const xml = `<?xml version="1.0"?><ListBucketResult><IsTruncated>true</IsTruncated>
      <Contents><Key>bancada/a.mp4</Key><LastModified>2026-10-08T20:37:20.000Z</LastModified><Size>1024</Size></Contents>
      <Contents><Key>bancada/b&amp;c.mp4</Key><LastModified>2026-10-08T20:38:00.000Z</LastModified><Size>2048</Size></Contents>
      <NextContinuationToken>tok==</NextContinuationToken></ListBucketResult>`;
    const { objetos, continuacao } = lerListagem(xml);
    expect(objetos).toEqual([
      { chave: "bancada/a.mp4", tamanho: 1024, modificadoEm: new Date("2026-10-08T20:37:20.000Z") },
      { chave: "bancada/b&c.mp4", tamanho: 2048, modificadoEm: new Date("2026-10-08T20:38:00.000Z") },
    ]);
    expect(continuacao).toBe("tok==");
  });
});

describe("criarR2", () => {
  it("URL de upload: PUT assinado na query, no host do R2, válido por 15 min", async () => {
    const url = new URL(await criarR2(r2Config).urlUpload("bancada/2026-10-08/a/b/c/x.mp4"));
    expect(url.host).toBe("conta123.r2.cloudflarestorage.com");
    expect(url.pathname).toBe("/replay-teste/bancada/2026-10-08/a/b/c/x.mp4");
    expect(url.searchParams.get("X-Amz-Expires")).toBe("900");
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
    expect(url.searchParams.get("X-Amz-Credential")).toContain("/auto/s3/aws4_request");
  });

  it("tamanho: 404 vira null; outro erro vira ErroR2", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(null, { status: 404 }));
    expect(await criarR2(r2Config, fetcher).tamanho("bancada/x.mp4")).toBeNull();

    fetcher.mockResolvedValueOnce(new Response(null, { status: 200, headers: { "content-length": "4096" } }));
    expect(await criarR2(r2Config, fetcher).tamanho("bancada/x.mp4")).toBe(4096);

    fetcher.mockResolvedValueOnce(new Response(null, { status: 403 }));
    await expect(criarR2(r2Config, fetcher).tamanho("bancada/x.mp4")).rejects.toBeInstanceOf(ErroR2);
  });
});

describe("lerConfigBancada", () => {
  const completo = {
    R2_ACCOUNT_ID: "c",
    R2_ACCESS_KEY_ID: "k",
    R2_SECRET_ACCESS_KEY: "s",
    R2_BUCKET: "b",
    BANCADA_TOKEN: "t".repeat(16),
    BANCADA_SENHA: "s".repeat(16),
  };

  it("liga só com todas as variáveis", () => {
    expect(lerConfigBancada(completo)).not.toBeNull();
    expect(lerConfigBancada({ ...completo, R2_BUCKET: "" })).toBeNull();
    expect(lerConfigBancada({})).toBeNull();
  });

  it("token ou senha curtos desligam a bancada", () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(lerConfigBancada({ ...completo, BANCADA_TOKEN: "curto" })).toBeNull();
    expect(lerConfigBancada({ ...completo, BANCADA_SENHA: "curta" })).toBeNull();
    erro.mockRestore();
  });
});

describe("criarR2: falha de rede", () => {
  it("DNS/TLS/R2 fora do ar viram ErroR2 (a rota responde 502, não 500)", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    await expect(criarR2(r2Config, fetcher).listar()).rejects.toBeInstanceOf(ErroR2);
    await expect(criarR2(r2Config, fetcher).tamanho("bancada/x.mp4")).rejects.toBeInstanceOf(ErroR2);
  });
});
