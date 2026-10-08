// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as receber } from "./receber/route";
import { POST as uploadUrl } from "./upload-url/route";
import { POST as confirmar } from "./confirmar/route";
import { DELETE as apagarClipe, GET as listarClipes } from "./clipes/route";
import { POST as entrar } from "./entrar/route";
import { COOKIE_SESSAO, valorSessao } from "@/lib/bancada/auth";
import { lerConfigBancada } from "@/lib/bancada/config";

const TOKEN = "token-da-camera-123456";
const SENHA = "senha-da-equipe-123456";
const ENV = {
  R2_ACCOUNT_ID: "conta123",
  R2_ACCESS_KEY_ID: "AKID",
  R2_SECRET_ACCESS_KEY: "segredo",
  R2_BUCKET: "replay-teste",
  BANCADA_TOKEN: TOKEN,
  BANCADA_SENHA: SENHA,
};
const BASE = "http://localhost:3000/api/bancada";
const MP4 = new Uint8Array([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 1, 2, 3, 4]);

let r2: ReturnType<typeof vi.fn>;

beforeEach(() => {
  for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
  r2 = vi.fn(async () => new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", r2);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const cookieEquipe = () => `${COOKIE_SESSAO}=${valorSessao(lerConfigBancada()!)}`;
/** Primeira chamada ao R2: URL assinada e o init (o corpo vai no init, não num Request). */
const r2Chamado = () => {
  const [url, init] = r2.mock.calls[0]! as [string, RequestInit];
  return { url, method: init.method, body: init.body };
};

describe("bancada desligada", () => {
  it("sem as variáveis de ambiente, todas as rotas respondem 404", async () => {
    vi.stubEnv("BANCADA_TOKEN", "");
    const req = () => new Request(`${BASE}/receber?token=${TOKEN}`, { method: "POST", body: MP4 });
    expect((await receber(req())).status).toBe(404);
    expect((await uploadUrl(new Request(`${BASE}/upload-url`, { method: "POST" }))).status).toBe(404);
    expect((await listarClipes(new Request(`${BASE}/clipes`))).status).toBe(404);
    expect((await entrar(new Request(`${BASE}/entrar`, { method: "POST" }))).status).toBe(404);
    expect(r2).not.toHaveBeenCalled();
  });
});

describe("POST /api/bancada/receber (uma chamada só)", () => {
  it("recusa sem token ou com token errado", async () => {
    expect((await receber(new Request(`${BASE}/receber`, { method: "POST", body: MP4 }))).status).toBe(401);
    expect((await receber(new Request(`${BASE}/receber?token=errado`, { method: "POST", body: MP4 }))).status).toBe(401);
    expect(r2).not.toHaveBeenCalled();
  });

  it("vídeo bruto com o token na URL: grava no R2 com os dados no nome", async () => {
    const res = await receber(
      new Request(`${BASE}/receber?token=${TOKEN}&quadra=Society 1&camera=c2&botao=b1&apertadoEm=2026-10-08T20:37:12Z`, {
        method: "POST",
        headers: { "content-type": "video/mp4" },
        body: MP4,
      }),
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.chave).toMatch(/^bancada\/2026-10-08\/society-1\/c2\/b1\/20261008T203712Z--app--[a-z0-9]+\.mp4$/);
    expect(json.tamanho).toBe(MP4.byteLength);
    expect(r2Chamado().method).toBe("PUT");
    expect(r2Chamado().url).toContain(`conta123.r2.cloudflarestorage.com/replay-teste/${json.chave}`);
    // Regressão (R2 respondeu 411): o corpo vai como ArrayBuffer no init, para o
    // fetch mandar Content-Length; um Request com corpo vira stream sem tamanho.
    expect(r2Chamado().body).toBeInstanceOf(ArrayBuffer);
    expect((r2Chamado().body as ArrayBuffer).byteLength).toBe(MP4.byteLength);
  });

  it("multipart com o campo 'arquivo' e token no Authorization", async () => {
    const form = new FormData();
    form.set("arquivo", new File([MP4], "lance.mp4", { type: "video/mp4" }));
    form.set("quadra", "areia");
    const res = await receber(
      new Request(`${BASE}/receber`, { method: "POST", headers: { authorization: `Bearer ${TOKEN}` }, body: form }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).chave).toContain("/areia/teste/teste/");
  });

  it("recusa arquivo vazio e o que não é vídeo", async () => {
    const req = (body: BodyInit) => new Request(`${BASE}/receber?token=${TOKEN}`, { method: "POST", body });
    expect((await receber(req(new Uint8Array()))).status).toBe(400);
    expect((await receber(req("<html>pagina</html>"))).status).toBe(415);
    expect(r2).not.toHaveBeenCalled();
  });

  it("R2 recusando vira 502 com mensagem", async () => {
    r2.mockResolvedValueOnce(new Response(null, { status: 403 }));
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await receber(new Request(`${BASE}/receber?token=${TOKEN}`, { method: "POST", body: MP4 }));
    expect(res.status).toBe(502);
    erro.mockRestore();
  });
});

describe("envio em duas etapas", () => {
  it("upload-url devolve PUT assinado no R2 e a chave; origem padrão 'automacao'", async () => {
    const res = await uploadUrl(
      new Request(`${BASE}/upload-url`, {
        method: "POST",
        headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
        body: JSON.stringify({ quadra: "q1", apertadoEm: 1791491832 }),
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.chave).toMatch(/\/q1\/teste\/teste\/\d{8}T\d{6}Z--automacao--/);
    expect(new URL(json.urlUpload).searchParams.get("X-Amz-Signature")).toBeTruthy();
    expect(json.metodo).toBe("PUT");
  });

  it("confirmar: chave inválida 400, ainda não chegou 404, chegou 200 com tamanho", async () => {
    const chave = "bancada/2026-10-08/q1/teste/teste/20261008T203712Z--automacao--abc.mp4";
    const req = (body: unknown) =>
      new Request(`${BASE}/confirmar?token=${TOKEN}`, { method: "POST", body: JSON.stringify(body) });

    expect((await confirmar(req({ chave: "../segredo" }))).status).toBe(400);

    r2.mockResolvedValueOnce(new Response(null, { status: 404 }));
    expect((await confirmar(req({ chave }))).status).toBe(404);

    r2.mockResolvedValueOnce(new Response(null, { status: 200, headers: { "content-length": "5000" } }));
    const ok = await confirmar(req({ chave }));
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ ok: true, chave, tamanho: 5000 });
  });
});

describe("/api/bancada/clipes (só a equipe)", () => {
  it("o token do app não lista nem apaga", async () => {
    expect((await listarClipes(new Request(`${BASE}/clipes?token=${TOKEN}`))).status).toBe(401);
    expect((await apagarClipe(new Request(`${BASE}/clipes?token=${TOKEN}&chave=x`, { method: "DELETE" }))).status).toBe(401);
  });

  it("com a sessão: lista os clipes válidos, mais novos primeiro, com atraso e URL de leitura", async () => {
    r2.mockResolvedValueOnce(
      new Response(`<ListBucketResult><IsTruncated>false</IsTruncated>
        <Contents><Key>bancada/2026-10-08/q1/c1/b1/20261008T203712Z--app--a1.mp4</Key><LastModified>2026-10-08T20:37:20.000Z</LastModified><Size>100</Size></Contents>
        <Contents><Key>bancada/lixo.txt</Key><LastModified>2026-10-08T20:40:00.000Z</LastModified><Size>1</Size></Contents>
        <Contents><Key>bancada/2026-10-08/q1/c1/b1/20261008T205200Z--manual--b2.mp4</Key><LastModified>2026-10-08T20:52:05.000Z</LastModified><Size>200</Size></Contents>
      </ListBucketResult>`),
    );
    const res = await listarClipes(new Request(`${BASE}/clipes`, { headers: { cookie: cookieEquipe() } }));
    expect(res.status).toBe(200);
    const { clipes } = await res.json();
    expect(clipes.map((c: { origem: string }) => c.origem)).toEqual(["manual", "app"]);
    expect(clipes[1].atrasoSegundos).toBe(8);
    expect(new URL(clipes[0].url).searchParams.get("X-Amz-Expires")).toBe("3600");
  });

  it("apagar com a sessão chama DELETE no R2", async () => {
    const chave = "bancada/2026-10-08/q1/c1/b1/20261008T203712Z--app--a1.mp4";
    const res = await apagarClipe(
      new Request(`${BASE}/clipes?chave=${encodeURIComponent(chave)}`, { method: "DELETE", headers: { cookie: cookieEquipe() } }),
    );
    expect(res.status).toBe(200);
    expect(r2Chamado().method).toBe("DELETE");
  });
});

describe("POST /api/bancada/entrar", () => {
  const tentar = (senha: string, ip: string) => {
    const form = new URLSearchParams({ senha });
    return entrar(new Request(`${BASE}/entrar`, { method: "POST", headers: { "x-forwarded-for": ip }, body: form }));
  };

  it("senha errada volta para a página com erro e sem cookie", async () => {
    const res = await tentar("errada", "198.51.100.1");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost:3000/bancada?erro=senha");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("senha certa cria o cookie httpOnly com o HMAC (nunca a senha)", async () => {
    const res = await tentar(SENHA, "198.51.100.2");
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${COOKIE_SESSAO}=${valorSessao(lerConfigBancada()!)}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).not.toContain(SENHA);
  });
});
