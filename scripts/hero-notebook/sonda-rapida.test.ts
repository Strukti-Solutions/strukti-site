// @vitest-environment node
/**
 * A sonda rápida da faixa do título (sonda-rapida.js) só aprova o que mediu
 * de fato (m2 da revisão final da fase 2): sai com 1 quando o ffmpeg falha
 * (o master errado), quando não vieram os 251 quadros do loop ou quando uma
 * região não tem pixel nenhum no quadro. Os masters de teste são cor sólida,
 * gerados pelo ffmpeg numa pasta temporária.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SONDA = join(__dirname, "sonda-rapida.js");
const temFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0;

let pasta: string;
let caixas: string;

beforeAll(() => {
  pasta = mkdtempSync(join(tmpdir(), "sonda-rapida-"));
  caixas = join(pasta, "caixas.json");
  writeFileSync(caixas, JSON.stringify({ "linha 1": [100, 200, 300, 340] }));
});

afterAll(() => {
  rmSync(pasta, { recursive: true, force: true });
});

/** Um master de `quadros` quadros pretos, 1280 × 720 a 25 fps (FFV1, sem perda). */
function master(quadros: number) {
  const arquivo = join(pasta, `preto-${quadros}.mkv`);
  const r = spawnSync("ffmpeg", [
    "-v", "error", "-y",
    "-f", "lavfi", "-i", "color=c=black:s=1280x720:r=25",
    "-frames:v", String(quadros),
    "-c:v", "ffv1", arquivo,
  ]);
  if (r.status !== 0) throw new Error(`ffmpeg não gerou o master: ${r.stderr}`);
  return arquivo;
}

function sonda(...args: string[]) {
  const r = spawnSync(process.execPath, [SONDA, ...args], { encoding: "utf8" });
  return { status: r.status, saida: `${r.stdout}${r.stderr}` };
}

describe("sonda-rapida.js: só aprova o que mediu", () => {
  it("com o master inexistente (o ffmpeg falha), sai com 1", () => {
    const { status, saida } = sonda(join(pasta, "nao-existe.mkv"), "--caixas", caixas);
    expect(status).toBe(1);
    expect(saida).toMatch(/ffmpeg/);
  });

  it("uma região sem pixel nenhum no quadro sai com 1, antes de ler o master", () => {
    const vazias = join(pasta, "vazias.json");
    writeFileSync(vazias, JSON.stringify({ "fora do quadro": [1300, 1400, 0, 10] }));
    const { status, saida } = sonda(join(pasta, "nao-existe.mkv"), "--caixas", vazias);
    expect(status).toBe(1);
    expect(saida).toMatch(/fora do quadro.*sem pixel/);
  });

  it.skipIf(!temFfmpeg)("um master com outro número de quadros que 251 sai com 1", () => {
    const { status, saida } = sonda(master(3), "--caixas", caixas);
    expect(status).toBe(1);
    expect(saida).toMatch(/quadros 3/);
    expect(saida).toMatch(/251/);
  });

  it.skipIf(!temFfmpeg)("o master de 251 quadros escuro passa (sai com 0)", () => {
    const { status, saida } = sonda(master(251), "--caixas", caixas);
    expect(saida).toMatch(/quadros 251/);
    expect(status).toBe(0);
  }, 60_000);
});
