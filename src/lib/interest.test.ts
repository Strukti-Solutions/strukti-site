import { describe, expect, it, vi } from "vitest";
import { INTERESTS, onInterestSelected, selectInterest } from "./interest";

describe("interesse do formulário", () => {
  it("tem as quatro opções na ordem do formulário", () => {
    expect(INTERESTS).toEqual(["replay", "estacionamento", "aplicativo", "outro"]);
  });

  it("avisa quem está inscrito e para de avisar depois de desinscrever", () => {
    const handler = vi.fn();
    const unsubscribe = onInterestSelected(handler);
    selectInterest("aplicativo");
    expect(handler).toHaveBeenCalledWith("aplicativo");
    unsubscribe();
    selectInterest("outro");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("ignora eventos com um valor fora da lista", () => {
    const handler = vi.fn();
    const unsubscribe = onInterestSelected(handler);
    window.dispatchEvent(new CustomEvent("strukti:interesse", { detail: "hackeado" }));
    expect(handler).not.toHaveBeenCalled();
    unsubscribe();
  });
});
