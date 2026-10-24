// @vitest-environment node
/**
 * O CLI do loop.js exige o enquadramento nas três ações (m7 da revisão final
 * da fase 2): antes, `node loop.js vapor` sem argumento gravava o vapor do em
 * pé e `node loop.js` mostrava o deitado. Sem o argumento (ou com um
 * desconhecido), sai com 1 e mostra o uso, sem gravar nada.
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const LOOP = join(__dirname, "loop.js");

function loop(...args: string[]) {
  const r = spawnSync(process.execPath, [LOOP, ...args], { encoding: "utf8" });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

describe("loop.js: o CLI exige o enquadramento", () => {
  it.each([[[]], [["recorte"]], [["vapor"]], [["vapor", "retrato"]], [["deitado"]]])(
    "node loop.js %j sai com 1 e mostra o uso",
    (args: string[]) => {
      const { status, stdout, stderr } = loop(...args);
      expect(status).toBe(1);
      expect(stdout).toBe("");
      expect(stderr).toMatch(/uso:/);
      expect(stderr).toMatch(/media\|mediaRetrato/);
    },
  );

  it("com o enquadramento, o JSON e o recorte seguem como antes", () => {
    for (const cam of ["media", "mediaRetrato"]) {
      const json = loop(cam);
      expect(json.status).toBe(0);
      expect(JSON.parse(json.stdout)).toHaveProperty("recorteVapor");
      const recorte = loop("recorte", cam);
      expect(recorte.status).toBe(0);
      expect(recorte.stdout.trim()).toMatch(/^\d+:\d+:\d+:\d+$/);
    }
  });
});
