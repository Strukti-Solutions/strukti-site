import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import Home from "./page";

// Regra da definição de pronto (ADR-004): a página inteira hidrata sem
// divergência entre o HTML do servidor e o 1º render do cliente, com
// prefers-reduced-motion ligado e desligado. Falha em onRecoverableError ou
// em qualquer console.error (divergência de atributo só aparece lá).

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// O motion guarda a preferência de movimento num cache do módulo e só a
// atualiza pelo evento "change" da media query. Esta media query falsa deixa
// o teste fazer o "servidor" (sem preferência, como o `null` do SSR real) e
// depois trocar a preferência antes de hidratar, como num cliente de verdade.
const reducedMotionQuery = (() => {
  const listeners = new Set<() => void>();
  const query = {
    matches: false,
    media: "(prefers-reduced-motion)",
    onchange: null,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    addListener: (listener: () => void) => listeners.add(listener),
    removeListener: (listener: () => void) => listeners.delete(listener),
    dispatchEvent: () => false,
  };
  return {
    query,
    set(reduce: boolean) {
      query.matches = reduce;
      listeners.forEach((listener) => listener());
    },
  };
})();

beforeAll(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => reducedMotionQuery.query),
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

async function hydrateHome(clientPrefersReducedMotion: boolean) {
  reducedMotionQuery.set(false);
  const serverHtml = renderToString(<Home />);

  const container = document.createElement("div");
  container.innerHTML = serverHtml;
  document.body.appendChild(container);

  reducedMotionQuery.set(clientPrefersReducedMotion);

  const consoleErrors: unknown[][] = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    consoleErrors.push(args);
  });
  const recoverableErrors: unknown[] = [];

  let root: ReturnType<typeof hydrateRoot> | undefined;
  await act(async () => {
    root = hydrateRoot(container, <Home />, {
      onRecoverableError: (error) => {
        recoverableErrors.push(error);
      },
    });
  });
  act(() => root?.unmount());

  return { consoleErrors, recoverableErrors };
}

describe("página inicial — hidratação", () => {
  it.each([
    ["ligado", true],
    ["desligado", false],
  ])("com prefers-reduced-motion %s, hidrata sem divergência", async (_label, reduce) => {
    const { consoleErrors, recoverableErrors } = await hydrateHome(reduce);

    expect(recoverableErrors).toEqual([]);
    expect(consoleErrors.map((args) => args.map(String).join(" "))).toEqual([]);
  });
});
