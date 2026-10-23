import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { CATALOGO } from "@/content/catalogo";
import { useCatalogo } from "./useCatalogo";

// jsdom não implementa `scrollIntoView`: um espião no protótipo, para ver em
// qual elemento e com quais opções a rolagem foi pedida.
const scrollIntoView = vi.fn();
let pushState: MockInstance<History["pushState"]>;
let replaceState: MockInstance<History["replaceState"]>;
let back: MockInstance<History["back"]>;
let secao: HTMLElement;
let links: HTMLAnchorElement[] = [];

// Os quadros (`requestAnimationFrame`) ficam numa fila e só rodam no
// `proximoQuadro()`: assim dá para ver que a rolagem espera um quadro.
let fila = new Map<number, FrameRequestCallback>();
let ultimoQuadro = 0;
function proximoQuadro() {
  const agora = [...fila.values()];
  fila = new Map();
  for (const callback of agora) callback(0);
}

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    writable: true,
    value: scrollIntoView,
  });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    fila.set(++ultimoQuadro, callback);
    return ultimoQuadro;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => fila.delete(id));
  pushState = vi.spyOn(window.history, "pushState");
  replaceState = vi.spyOn(window.history, "replaceState");
  // O `back()` de verdade do jsdom navega depois; aqui só conta as chamadas.
  back = vi.spyOn(window.history, "back").mockImplementation(() => {});
  secao = document.createElement("section");
  document.body.append(secao);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  scrollIntoView.mockReset();
  fila = new Map();
  secao.remove();
  for (const a of links) a.remove();
  links = [];
  // @ts-expect-error o protótipo do jsdom não tinha o método
  delete Element.prototype.scrollIntoView;
});

/** Muda a URL sem disparar evento (como o navegador antes do `hashchange`). */
function irPara(url: string) {
  window.history.replaceState(null, "", url);
  replaceState.mockClear();
}

/** Um `<a href>` de verdade na página, como os do menu "Produtos ▾". */
function criarLink(href: string) {
  const a = document.createElement("a");
  a.setAttribute("href", href);
  document.body.append(a);
  links.push(a);
  return a;
}

/** Promessa do próximo evento `tipo` na janela (depois do ouvinte do hook). */
function proximoEvento(tipo: "popstate" | "hashchange") {
  return new Promise<void>((resolve) => window.addEventListener(tipo, () => resolve(), { once: true }));
}

/**
 * Espera as tarefas na fila do jsdom: ele navega pelo link numa tarefa
 * (`_queueATask`), não no próprio clique.
 */
function esperarTarefas() {
  return new Promise<void>((resolve) => setImmediate(resolve));
}

/**
 * Anota a ordem dos `popstate`/`hashchange` que o jsdom dispara de verdade
 * (no clique num link e no voltar/avançar), para o teste mostrar a sequência.
 */
function anotarEventos() {
  const eventos: string[] = [];
  const anotar = (e: Event) => eventos.push(`${e.type} ${window.location.hash}`);
  window.addEventListener("popstate", anotar);
  window.addEventListener("hashchange", anotar);
  return {
    eventos,
    parar: () => {
      window.removeEventListener("popstate", anotar);
      window.removeEventListener("hashchange", anotar);
    },
  };
}

function montar() {
  // Um ref só por montagem, estável entre renders, como o de `useRef`.
  const secaoRef = { current: secao };
  return renderHook(() => useCatalogo(CATALOGO, secaoRef));
}

describe("useCatalogo: histórico", () => {
  it("abrir cria a entrada #replay; trocar com o painel aberto substitui por #rota-de-vendas", () => {
    const { result } = montar();
    expect(result.current.estado.aberto).toBe(false);

    act(() => result.current.despachar({ tipo: "abrir" }));
    expect(result.current.estado).toMatchObject({ aberto: true, ativo: "replay" });
    expect(pushState).toHaveBeenCalledTimes(1);
    expect(pushState).toHaveBeenCalledWith(null, "", "#replay");

    act(() => result.current.despachar({ tipo: "passo", delta: 1 }));
    expect(result.current.estado.ativo).toBe("rota-de-vendas");
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(replaceState).toHaveBeenCalledWith(null, "", "#rota-de-vendas");
    expect(pushState).toHaveBeenCalledTimes(1);
  });

  it("fechar depois de abrir volta 1 entrada (history.back), sem limpar a âncora", () => {
    const { result } = montar();
    act(() => result.current.despachar({ tipo: "abrir" }));
    act(() => result.current.despachar({ tipo: "fechar" }));

    expect(result.current.estado.aberto).toBe(false);
    expect(back).toHaveBeenCalledTimes(1);
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("chegou por /#fleet-analytics-bi: abre o Fleet, rola até a seção e fechar só limpa a âncora", () => {
    irPara("/?ref=x#fleet-analytics-bi");
    const { result } = montar();
    expect(result.current.estado).toMatchObject({ aberto: true, ativo: "fleet-analytics-bi", entradaPropria: false });

    // A rolagem espera um quadro (o hero completa a expansão antes).
    expect(scrollIntoView).not.toHaveBeenCalled();
    proximoQuadro();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(secao);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start", behavior: "instant" });

    act(() => result.current.despachar({ tipo: "fechar" }));
    expect(result.current.estado.aberto).toBe(false);
    expect(back).not.toHaveBeenCalled();
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(replaceState).toHaveBeenCalledWith(null, "", "/?ref=x");
  });

  it("eventos rápidos usam o estado mais novo: 2 abrir criam 1 entrada; 2 passos chegam ao 3º item", () => {
    const { result } = montar();
    act(() => {
      result.current.despachar({ tipo: "abrir" });
      result.current.despachar({ tipo: "abrir" });
    });
    expect(pushState).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.despachar({ tipo: "passo", delta: 1 });
      result.current.despachar({ tipo: "passo", delta: 1 });
    });
    expect(result.current.estado.ativo).toBe("fleet-analytics-bi");
    expect(replaceState.mock.calls.map((c) => c[2])).toEqual(["#rota-de-vendas", "#fleet-analytics-bi"]);
  });

  // Review Focus 5. O `back()` é assíncrono: o navegador aplica a volta e
  // dispara o popstate (com a URL da entrada anterior, aqui "/") e o
  // hashchange depois. Quem fecha e reabre antes disso não pode ter o painel
  // reaberto fechado pelo popstate atrasado. A ordem abaixo é a do navegador
  // (o jsdom resolve o `back()` contra a entrada atual na hora da tarefa e
  // não mostra a corrida, por isso o `back` é de mentira e a volta é feita
  // à mão: a URL muda e os dois eventos chegam, nessa ordem).
  function concluirVolta(url = "/") {
    irPara(url);
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    act(() => window.dispatchEvent(new HashChangeEvent("hashchange")));
    proximoQuadro();
  }

  it("fechar e reabrir antes de o popstate do back() chegar: o popstate atrasado não fecha o painel, e a entrada nova só é criada depois dele", () => {
    const { result } = montar();
    act(() => result.current.despachar({ tipo: "abrir" }));
    act(() => result.current.despachar({ tipo: "fechar" }));
    expect(back).toHaveBeenCalledTimes(1);

    act(() => result.current.despachar({ tipo: "abrir" }));
    expect(result.current.estado).toMatchObject({ aberto: true, ativo: "replay", entradaPropria: true });
    // Criar a entrada agora a perderia: a volta pendente ainda vai acontecer.
    expect(pushState).toHaveBeenCalledTimes(1);

    concluirVolta();
    expect(result.current.estado).toMatchObject({ aberto: true, ativo: "replay", entradaPropria: true });
    expect(pushState).toHaveBeenCalledTimes(2);
    expect(pushState).toHaveBeenLastCalledWith(null, "", "#replay");
    expect(window.location.hash).toBe("#replay");
    // O hashchange da volta não rola a página até a seção.
    expect(scrollIntoView).not.toHaveBeenCalled();

    // Fechar de novo volta a entrada criada agora.
    act(() => result.current.despachar({ tipo: "fechar" }));
    expect(back).toHaveBeenCalledTimes(2);
    concluirVolta();
    expect(result.current.estado.aberto).toBe(false);
    expect(pushState).toHaveBeenCalledTimes(2);
  });

  it("fechar, reabrir e fechar de novo antes do popstate: fica fechado, com 1 back só e nenhuma entrada nova", () => {
    const { result } = montar();
    act(() => result.current.despachar({ tipo: "abrir" }));
    act(() => {
      result.current.despachar({ tipo: "fechar" });
      result.current.despachar({ tipo: "abrir" });
      result.current.despachar({ tipo: "fechar" });
    });
    expect(result.current.estado.aberto).toBe(false);
    expect(back).toHaveBeenCalledTimes(1);

    concluirVolta();
    expect(result.current.estado.aberto).toBe(false);
    expect(pushState).toHaveBeenCalledTimes(1);
    expect(back).toHaveBeenCalledTimes(1);

    // Depois da volta, abrir cria a entrada na hora, como sempre.
    act(() => result.current.despachar({ tipo: "abrir" }));
    expect(pushState).toHaveBeenCalledTimes(2);
  });

  it("reabrir e trocar de produto antes do popstate: a entrada criada depois é a do produto novo, sem replace antes", () => {
    const { result } = montar();
    act(() => result.current.despachar({ tipo: "abrir" }));
    act(() => result.current.despachar({ tipo: "fechar" }));
    act(() => result.current.despachar({ tipo: "abrir" }));
    act(() => result.current.despachar({ tipo: "passo", delta: 1 }));
    expect(result.current.estado).toMatchObject({ aberto: true, ativo: "rota-de-vendas" });
    // A entrada atual ainda é a que o back() vai deixar: nada de replace nela.
    expect(replaceState).not.toHaveBeenCalled();

    concluirVolta();
    expect(result.current.estado).toMatchObject({ aberto: true, ativo: "rota-de-vendas" });
    expect(pushState).toHaveBeenLastCalledWith(null, "", "#rota-de-vendas");
    expect(window.location.hash).toBe("#rota-de-vendas");
  });

  it("`visiveis` segue o filtro e `despachar` é o mesmo entre renders", () => {
    const { result } = montar();
    const despachar = result.current.despachar;
    expect(result.current.visiveis).toBe(CATALOGO);

    act(() => result.current.despachar({ tipo: "filtrar", filtro: "site" }));
    expect(result.current.visiveis.map((i) => i.slug)).toEqual(["site-clinicas", "vitrine-lojas"]);
    expect(result.current.despachar).toBe(despachar);
  });
});

describe("useCatalogo: âncoras e rolagem", () => {
  it("sem âncora ao montar: fica fechado e não rola", () => {
    const { result } = montar();
    proximoQuadro();
    expect(result.current.estado.aberto).toBe(false);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("clique num link #site-clinicas (ex.: menu da barra): popstate e hashchange de verdade, abre e rola até o topo da seção", async () => {
    const { result } = montar();
    act(() => result.current.despachar({ tipo: "filtrar", filtro: "hardware" }));
    const { eventos, parar } = anotarEventos();

    await act(async () => {
      const chegou = proximoEvento("hashchange");
      criarLink("#site-clinicas").click();
      await chegou;
    });
    parar();
    // A mesma sequência de uma travessia: só o clique separa os dois casos.
    expect(eventos).toEqual(["popstate #site-clinicas", "hashchange #site-clinicas"]);
    // §3.3: o link para fora do filtro volta o filtro para "Todos".
    expect(result.current.estado).toMatchObject({ aberto: true, ativo: "site-clinicas", filtro: "todos" });
    expect(scrollIntoView).not.toHaveBeenCalled();

    proximoQuadro();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(secao);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start", behavior: "instant" });
  });

  it("clique num link para a âncora que já está na URL (sem hashchange) rola de novo até a seção", async () => {
    irPara("/#replay");
    const { result } = montar();
    proximoQuadro();
    scrollIntoView.mockClear();

    const { eventos, parar } = anotarEventos();
    await act(async () => {
      criarLink("#replay").click();
      await esperarTarefas();
    });
    parar();
    expect(eventos).toEqual([]);
    proximoQuadro();
    expect(result.current.estado).toMatchObject({ aberto: true, ativo: "replay" });
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("hashchange sem popstate antes (navegador que não dispara popstate na âncora) abre e rola", () => {
    const { result } = montar();
    irPara("/#site-clinicas");
    act(() => window.dispatchEvent(new HashChangeEvent("hashchange")));
    expect(result.current.estado).toMatchObject({ aberto: true, ativo: "site-clinicas" });
    proximoQuadro();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("popstate com hash vazio (voltar do navegador) fecha e não rola", () => {
    irPara("/#replay");
    const { result } = montar();
    proximoQuadro();
    scrollIntoView.mockClear();
    expect(result.current.estado.aberto).toBe(true);

    irPara("/");
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    proximoQuadro();
    expect(result.current.estado.aberto).toBe(false);
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(back).not.toHaveBeenCalled();
  });

  it("voltar e avançar do navegador (popstate e hashchange de verdade, sem clique) fecham e reabrem sem rolar", async () => {
    // O `back()` de verdade do jsdom, para a travessia ser a do navegador.
    back.mockRestore();
    const { result } = montar();
    await act(async () => {
      const chegou = proximoEvento("hashchange");
      criarLink("#rota-de-vendas").click();
      await chegou;
    });
    proximoQuadro();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    const { eventos, parar } = anotarEventos();
    await act(async () => {
      const chegou = proximoEvento("hashchange");
      window.history.back();
      await chegou;
    });
    proximoQuadro();
    expect(result.current.estado.aberto).toBe(false);

    await act(async () => {
      const chegou = proximoEvento("hashchange");
      window.history.forward();
      await chegou;
    });
    parar();
    proximoQuadro();
    expect(eventos).toEqual(["popstate ", "hashchange ", "popstate #rota-de-vendas", "hashchange #rota-de-vendas"]);
    expect(result.current.estado).toMatchObject({ aberto: true, ativo: "rota-de-vendas" });
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    // O próximo link volta a rolar.
    await act(async () => {
      const chegou = proximoEvento("hashchange");
      criarLink("#replay").click();
      await chegou;
    });
    proximoQuadro();
    expect(result.current.estado.ativo).toBe("replay");
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it("link com preventDefault não marca: a travessia que cair na mesma URL depois não rola", () => {
    const { result } = montar();
    const link = criarLink("#rota-de-vendas");
    link.addEventListener("click", (e) => e.preventDefault());
    act(() => link.click());
    expect(window.location.hash).toBe("");

    irPara("/#rota-de-vendas");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    proximoQuadro();
    expect(result.current.estado).toMatchObject({ aberto: true, ativo: "rota-de-vendas" });
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("âncora de outra seção (#contato) com o painel aberto fecha sem back e não rola", () => {
    const { result } = montar();
    act(() => result.current.despachar({ tipo: "abrir" }));

    irPara("/#contato");
    act(() => window.dispatchEvent(new HashChangeEvent("hashchange")));
    proximoQuadro();
    expect(result.current.estado.aberto).toBe(false);
    expect(back).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("decodifica a âncora e tolera uma mal codificada", () => {
    irPara("/#%73ite-clinicas");
    const { result, unmount } = montar();
    expect(result.current.estado).toMatchObject({ aberto: true, ativo: "site-clinicas" });
    unmount();

    irPara("/#%E0%A4%A");
    expect(() => montar()).not.toThrow();
  });

  it("ao desmontar, remove os ouvintes e cancela a rolagem pendente", () => {
    const adicionar = vi.spyOn(window, "addEventListener");
    const remover = vi.spyOn(window, "removeEventListener");
    irPara("/#replay");
    const { unmount } = montar();
    const ouvintes = adicionar.mock.calls.filter(([tipo]) => ["click", "hashchange", "popstate"].includes(tipo));
    expect(ouvintes.map(([tipo]) => tipo).sort()).toEqual(["click", "hashchange", "popstate"]);

    unmount();
    for (const [tipo, ouvinte] of ouvintes) expect(remover).toHaveBeenCalledWith(tipo, ouvinte);

    proximoQuadro();
    irPara("/#rota-de-vendas");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    proximoQuadro();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
