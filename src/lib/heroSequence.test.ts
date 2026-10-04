import { describe, expect, it } from "vitest";
import {
  CELULAR_MAX_WIDTH,
  frameForProgress,
  frameUrl,
  nearestLoadedFrame,
  pickFrameSet,
  posterUrl,
  sectionProgress,
} from "./heroSequence";

describe("frameForProgress", () => {
  it("vai do primeiro ao último quadro", () => {
    expect(frameForProgress(0, 90)).toBe(0);
    expect(frameForProgress(1, 90)).toBe(89);
    expect(frameForProgress(0.5, 90)).toBe(45);
  });

  it("prende valores fora de 0–1 nas pontas", () => {
    expect(frameForProgress(-0.3, 90)).toBe(0);
    expect(frameForProgress(1.7, 90)).toBe(89);
  });

  it("trata NaN e infinito como início", () => {
    expect(frameForProgress(Number.NaN, 90)).toBe(0);
    expect(frameForProgress(Number.POSITIVE_INFINITY, 90)).toBe(0);
  });

  it("com um quadro só, ou nenhum, devolve 0", () => {
    expect(frameForProgress(0.8, 1)).toBe(0);
    expect(frameForProgress(0.8, 0)).toBe(0);
  });
});

describe("sectionProgress", () => {
  it("é 0 com o topo da seção no topo da tela e 1 quando a seção acabou de rolar", () => {
    expect(sectionProgress(0, 2500, 1000)).toBe(0);
    expect(sectionProgress(-1500, 2500, 1000)).toBe(1);
    expect(sectionProgress(-750, 2500, 1000)).toBe(0.5);
  });

  it("prende antes da seção e depois dela", () => {
    expect(sectionProgress(300, 2500, 1000)).toBe(0);
    expect(sectionProgress(-4000, 2500, 1000)).toBe(1);
  });

  it("seção sem altura extra (sem animação) fica em 0", () => {
    expect(sectionProgress(-200, 900, 1000)).toBe(0);
    expect(sectionProgress(-200, 1000, 1000)).toBe(0);
  });

  it("NaN em qualquer entrada dá 0, em vez de propagar NaN", () => {
    expect(sectionProgress(Number.NaN, 2500, 1000)).toBe(0);
    expect(sectionProgress(-750, Number.NaN, 1000)).toBe(0);
    expect(sectionProgress(-750, 2500, Number.NaN)).toBe(0);
  });
});

describe("pickFrameSet", () => {
  it("usa celular até o ponto de corte e desktop depois", () => {
    expect(pickFrameSet(360)).toBe("celular");
    expect(pickFrameSet(CELULAR_MAX_WIDTH)).toBe("celular");
    expect(pickFrameSet(CELULAR_MAX_WIDTH + 1)).toBe("desktop");
    expect(pickFrameSet(1440)).toBe("desktop");
  });

  it("o corte fica em 767 px, o mesmo do CSS: 767 é celular e 768 é desktop", () => {
    expect(CELULAR_MAX_WIDTH).toBe(767);
    expect(pickFrameSet(767)).toBe("celular");
    expect(pickFrameSet(768)).toBe("desktop");
  });
});

describe("frameUrl e posterUrl", () => {
  it("monta o caminho com 3 dígitos", () => {
    expect(frameUrl("desktop", 0)).toBe("/hero/sequencia/desktop/f000.avif");
    expect(frameUrl("celular", 44)).toBe("/hero/sequencia/celular/f044.avif");
  });

  it("recusa índice negativo ou não inteiro", () => {
    expect(() => frameUrl("desktop", -1)).toThrow(RangeError);
    expect(() => frameUrl("desktop", 1.5)).toThrow(RangeError);
    expect(() => frameUrl("celular", Number.NaN)).toThrow(RangeError);
  });

  it("monta o pôster nos dois formatos", () => {
    expect(posterUrl("desktop", "avif")).toBe("/hero/sequencia/desktop/poster.avif");
    expect(posterUrl("celular", "jpg")).toBe("/hero/sequencia/celular/poster.jpg");
  });
});

describe("nearestLoadedFrame", () => {
  it("devolve o próprio quadro quando ele já chegou", () => {
    expect(nearestLoadedFrame([true, true, true], 1)).toBe(1);
  });

  it("procura o mais próximo, preferindo o anterior no empate", () => {
    const loaded = [true, false, false, false, true];
    expect(nearestLoadedFrame(loaded, 1)).toBe(0);
    expect(nearestLoadedFrame(loaded, 3)).toBe(4);
    expect(nearestLoadedFrame(loaded, 2)).toBe(0);
  });

  it("rolagem rápida: pede o 45 e só o 3 chegou", () => {
    const loaded = Array.from({ length: 90 }, (_, i) => i === 3);
    expect(nearestLoadedFrame(loaded, 45)).toBe(3);
  });

  it("prende o alvo fora da lista na ponta mais próxima", () => {
    expect(nearestLoadedFrame([true, false, false], 10)).toBe(0);
    expect(nearestLoadedFrame([false, false, true], -5)).toBe(2);
  });

  it("arredonda o alvo não inteiro", () => {
    const loaded = [false, true, false, true];
    expect(nearestLoadedFrame(loaded, 2.6)).toBe(3);
    expect(nearestLoadedFrame(loaded, 1.4)).toBe(1);
  });

  it("devolve null quando nada chegou", () => {
    expect(nearestLoadedFrame([false, false], 1)).toBeNull();
    expect(nearestLoadedFrame([], 0)).toBeNull();
  });
});
