import { describe, expect, it } from "vitest";
import { chaveValida, lerChave, lerHorario, lerOrigem, montarChave, pareceVideo, slug } from "./chave";

const apertadoEm = new Date("2026-10-08T20:37:12.345Z");

describe("slug", () => {
  it("normaliza acentos, espaços e caixa; vazio vira 'teste'", () => {
    expect(slug("Quadra Pôr do Sol 1")).toBe("quadra-por-do-sol-1");
    expect(slug("  ")).toBe("teste");
    expect(slug(undefined)).toBe("teste");
  });

  it("não deixa passar barras nem '..' (sem sair do prefixo bancada/)", () => {
    expect(slug("../../segredo")).toBe("segredo");
    expect(slug("a/b\\c")).toBe("a-b-c");
  });

  it("corta em 40 caracteres", () => {
    expect(slug("x".repeat(80))).toHaveLength(40);
  });
});

describe("montarChave / lerChave", () => {
  it("ida e volta: os dados do clipe ficam no nome do objeto", () => {
    const chave = montarChave({ quadra: "Society 1", camera: "Cam 2", botao: "B1", apertadoEm, origem: "app" }, "abc123");
    expect(chave).toBe("bancada/2026-10-08/society-1/cam-2/b1/20261008T203712Z--app--abc123.mp4");
    expect(chaveValida(chave)).toBe(true);
    expect(lerChave(chave)).toEqual({
      quadra: "society-1",
      camera: "cam-2",
      botao: "b1",
      apertadoEm: new Date("2026-10-08T20:37:12Z"),
      origem: "app",
    });
  });

  it("recusa chaves fora do formato", () => {
    expect(chaveValida("bancada/../outro.mp4")).toBe(false);
    expect(chaveValida("site/qualquer.mp4")).toBe(false);
    expect(chaveValida("bancada/2026-10-08/a/b/c/20261008T203712Z--hacker--x.mp4")).toBe(false);
    expect(lerChave("bancada/x.mp4")).toBeNull();
  });
});

describe("lerHorario", () => {
  const agora = new Date("2026-10-08T21:00:00Z");

  it("aceita ISO 8601 e epoch em segundos ou milissegundos", () => {
    expect(lerHorario("2026-10-08T20:37:12Z", agora).toISOString()).toBe("2026-10-08T20:37:12.000Z");
    expect(lerHorario("1791491832", agora).toISOString()).toBe(new Date(1791491832 * 1000).toISOString());
    expect(lerHorario("1791491832000", agora).getTime()).toBe(1791491832000);
  });

  it("ausente ou inválido vira o horário de chegada", () => {
    expect(lerHorario(null, agora)).toBe(agora);
    expect(lerHorario("ontem", agora)).toBe(agora);
  });
});

describe("lerOrigem / pareceVideo", () => {
  it("origem desconhecida cai no padrão", () => {
    expect(lerOrigem("automacao", "app")).toBe("automacao");
    expect(lerOrigem("qualquer", "app")).toBe("app");
  });

  it("reconhece MP4/MOV pela caixa ftyp", () => {
    const mp4 = new Uint8Array([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);
    expect(pareceVideo(mp4)).toBe(true);
    expect(pareceVideo(new TextEncoder().encode("<html>nao é video</html>"))).toBe(false);
  });
});
