// @vitest-environment node
import { describe, expect, it } from "vitest";
import { CATALOGO } from "@/content/catalogo";
import {
  deslocamento,
  estadoInicial,
  filtrar,
  reduzir,
  type EstadoCatalogo,
  type EventoCatalogo,
} from "./estado";

const fechado = (parcial: Partial<EstadoCatalogo> = {}): EstadoCatalogo => ({
  ...estadoInicial(CATALOGO),
  ...parcial,
});
const aberto = (parcial: Partial<EstadoCatalogo> = {}): EstadoCatalogo =>
  fechado({ aberto: true, entradaPropria: true, ...parcial });
const reduz = (estado: EstadoCatalogo, evento: EventoCatalogo) => reduzir(CATALOGO, estado, evento);

describe("estadoInicial", () => {
  it("começa em Todos, no 1º item, fechado", () => {
    expect(estadoInicial(CATALOGO)).toEqual({
      filtro: "todos",
      ativo: "replay",
      aberto: false,
      entradaPropria: false,
      direcao: 0,
    });
  });
});

describe("filtrar", () => {
  it("Todos devolve a lista inteira, na ordem", () => {
    expect(filtrar(CATALOGO, "todos")).toEqual(CATALOGO);
  });

  it("um tipo devolve só os itens dele, na ordem do catálogo", () => {
    expect(filtrar(CATALOGO, "site").map((i) => i.slug)).toEqual(["site-clinicas", "vitrine-lojas"]);
    expect(filtrar(CATALOGO, "hardware").map((i) => i.slug)).toEqual([
      "replay",
      "placar-conectado",
      "totem-check-in",
      "contador-de-fluxo",
    ]);
  });
});

describe("deslocamento", () => {
  it("é circular com 10 itens", () => {
    expect(deslocamento(0, 0, 10)).toBe(0);
    expect(deslocamento(1, 0, 10)).toBe(1);
    expect(deslocamento(9, 0, 10)).toBe(-1);
    expect(deslocamento(5, 0, 10)).toBe(5);
  });

  it("com 2 itens o lateral fica sempre do mesmo lado (nunca −1 e +1 ao mesmo tempo)", () => {
    expect(deslocamento(1, 0, 2)).toBe(1);
    expect(deslocamento(0, 1, 2)).toBe(1);
  });

  it("com 4 itens o oposto fica em +2, e com 1 item tudo é 0", () => {
    expect(deslocamento(2, 0, 4)).toBe(2);
    expect(deslocamento(0, 0, 1)).toBe(0);
  });

  it("fica sempre em (−total/2, total/2]", () => {
    for (const total of [1, 2, 3, 4, 5, 10]) {
      for (let ativo = 0; ativo < total; ativo++) {
        const vistos = new Set<number>();
        for (let i = 0; i < total; i++) {
          const d = deslocamento(i, ativo, total);
          expect(d).toBeGreaterThan(-total / 2);
          expect(d).toBeLessThanOrEqual(total / 2);
          vistos.add(d);
        }
        // Cada cartão numa posição só: nada duplicado.
        expect(vistos.size).toBe(total);
      }
    }
  });
});

describe("reduzir: passo e irPara", () => {
  it("fechado, no último, +1 volta ao primeiro, sem mexer no histórico", () => {
    const { estado, historico } = reduz(fechado({ ativo: "contador-de-fluxo" }), { tipo: "passo", delta: 1 });
    expect(estado.ativo).toBe("replay");
    expect(estado.direcao).toBe(1);
    expect(historico).toBeNull();
  });

  it("fechado, no primeiro, −1 vai ao último", () => {
    const { estado } = reduz(fechado(), { tipo: "passo", delta: -1 });
    expect(estado.ativo).toBe("contador-de-fluxo");
    expect(estado.direcao).toBe(-1);
  });

  it("com 2 itens filtrados, −1 alterna entre os dois", () => {
    let estado = fechado({ filtro: "site", ativo: "site-clinicas" });
    estado = reduz(estado, { tipo: "passo", delta: -1 }).estado;
    expect(estado.ativo).toBe("vitrine-lojas");
    estado = reduz(estado, { tipo: "passo", delta: -1 }).estado;
    expect(estado.ativo).toBe("site-clinicas");
  });

  it("aberto, o passo substitui a entrada do histórico", () => {
    const { estado, historico } = reduz(aberto(), { tipo: "passo", delta: 1 });
    expect(estado.ativo).toBe("rota-de-vendas");
    expect(estado.aberto).toBe(true);
    expect(historico).toEqual({ tipo: "replace", slug: "rota-de-vendas" });
  });

  it("irPara início e fim levam ao 1º e ao último do filtro", () => {
    const base = fechado({ filtro: "aplicativo", ativo: "fleet-analytics-bi" });
    expect(reduz(base, { tipo: "irPara", posicao: "inicio" }).estado.ativo).toBe("rota-de-vendas");
    expect(reduz(base, { tipo: "irPara", posicao: "fim" }).estado.ativo).toBe("estoque-oficinas");
  });

  it("irPara aberto substitui a entrada; já estando lá, nada muda", () => {
    const base = aberto({ ativo: "fleet-analytics-bi" });
    expect(reduz(base, { tipo: "irPara", posicao: "fim" }).historico).toEqual({
      tipo: "replace",
      slug: "contador-de-fluxo",
    });
    const noInicio = aberto();
    const r = reduz(noInicio, { tipo: "irPara", posicao: "inicio" });
    expect(r.estado).toBe(noInicio);
    expect(r.historico).toBeNull();
  });

  it("com 1 item só, o passo não muda nada", () => {
    const um = CATALOGO.slice(0, 1);
    const estado = estadoInicial(um);
    const r = reduzir(um, estado, { tipo: "passo", delta: 1 });
    expect(r.estado).toBe(estado);
    expect(r.historico).toBeNull();
  });
});

describe("reduzir: centralizar", () => {
  it("fechado, leva o slug ao centro sem mexer no histórico", () => {
    const { estado, historico } = reduz(fechado(), { tipo: "centralizar", slug: "fleet-analytics-bi" });
    expect(estado.ativo).toBe("fleet-analytics-bi");
    expect(estado.direcao).toBe(1);
    expect(historico).toBeNull();
  });

  it("vai pelo caminho mais curto: do 1º ao último a direção é −1", () => {
    expect(reduz(fechado(), { tipo: "centralizar", slug: "contador-de-fluxo" }).estado.direcao).toBe(-1);
  });

  it("aberto (miniatura da fita), substitui a entrada do histórico", () => {
    const { estado, historico } = reduz(aberto(), { tipo: "centralizar", slug: "totem-check-in" });
    expect(estado.ativo).toBe("totem-check-in");
    expect(estado.aberto).toBe(true);
    expect(historico).toEqual({ tipo: "replace", slug: "totem-check-in" });
  });

  it("slug fora do filtro, desconhecido ou já no centro não muda nada", () => {
    const base = fechado({ filtro: "site", ativo: "site-clinicas" });
    for (const slug of ["replay", "nao-existe", "site-clinicas"]) {
      const r = reduz(base, { tipo: "centralizar", slug });
      expect(r.estado).toBe(base);
      expect(r.historico).toBeNull();
    }
  });
});

describe("reduzir: abrir e fechar", () => {
  it("abrir cria uma entrada no histórico com o ativo", () => {
    const { estado, historico } = reduz(fechado({ ativo: "rota-de-vendas" }), { tipo: "abrir" });
    expect(estado.aberto).toBe(true);
    expect(estado.entradaPropria).toBe(true);
    expect(historico).toEqual({ tipo: "push", slug: "rota-de-vendas" });
  });

  it("dois abrir seguidos: o 2º não cria outra entrada", () => {
    const primeiro = reduz(fechado(), { tipo: "abrir" });
    const segundo = reduz(primeiro.estado, { tipo: "abrir" });
    expect(segundo.estado).toBe(primeiro.estado);
    expect(segundo.historico).toBeNull();
  });

  it("fechar o que a gente abriu volta no histórico", () => {
    const { estado, historico } = reduz(aberto(), { tipo: "fechar" });
    expect(estado.aberto).toBe(false);
    expect(estado.entradaPropria).toBe(false);
    expect(historico).toEqual({ tipo: "back" });
  });

  it("fechar o que veio por link direto só limpa a âncora", () => {
    const { estado, historico } = reduz(aberto({ entradaPropria: false }), { tipo: "fechar" });
    expect(estado.aberto).toBe(false);
    expect(historico).toEqual({ tipo: "limpar" });
  });

  it("fechar já fechado não faz nada", () => {
    const base = fechado();
    const r = reduz(base, { tipo: "fechar" });
    expect(r.estado).toBe(base);
    expect(r.historico).toBeNull();
  });

  it("abrir, fechar e abrir de novo: um push, um back, um push", () => {
    const efeitos: unknown[] = [];
    let estado = fechado();
    for (const evento of [{ tipo: "abrir" }, { tipo: "fechar" }, { tipo: "abrir" }] as const) {
      const r = reduz(estado, evento);
      estado = r.estado;
      efeitos.push(r.historico);
    }
    expect(efeitos).toEqual([{ tipo: "push", slug: "replay" }, { tipo: "back" }, { tipo: "push", slug: "replay" }]);
  });
});

describe("reduzir: filtrar", () => {
  it("fechado, com o ativo fora do novo filtro, vai ao 1º do filtro", () => {
    const { estado, historico } = reduz(fechado(), { tipo: "filtrar", filtro: "site" });
    expect(estado.filtro).toBe("site");
    expect(estado.ativo).toBe("site-clinicas");
    expect(historico).toBeNull();
  });

  it("aberto, com o ativo fora do novo filtro, abre o 1º e substitui a entrada", () => {
    const { estado, historico } = reduz(aberto(), { tipo: "filtrar", filtro: "site" });
    expect(estado.ativo).toBe("site-clinicas");
    expect(estado.aberto).toBe(true);
    expect(estado.entradaPropria).toBe(true);
    expect(historico).toEqual({ tipo: "replace", slug: "site-clinicas" });
  });

  it("com o ativo dentro do novo filtro, mantém o ativo", () => {
    const fechadoR = reduz(fechado({ ativo: "totem-check-in" }), { tipo: "filtrar", filtro: "hardware" });
    expect(fechadoR.estado.ativo).toBe("totem-check-in");
    expect(fechadoR.historico).toBeNull();
    const abertoR = reduz(aberto({ ativo: "totem-check-in" }), { tipo: "filtrar", filtro: "hardware" });
    expect(abertoR.estado.ativo).toBe("totem-check-in");
    expect(abertoR.historico).toBeNull();
  });

  it("voltar a Todos mantém o ativo", () => {
    const { estado } = reduz(fechado({ filtro: "site", ativo: "vitrine-lojas" }), { tipo: "filtrar", filtro: "todos" });
    expect(estado.filtro).toBe("todos");
    expect(estado.ativo).toBe("vitrine-lojas");
  });

  it("o mesmo filtro não muda nada", () => {
    const base = fechado({ filtro: "site", ativo: "site-clinicas" });
    expect(reduz(base, { tipo: "filtrar", filtro: "site" }).estado).toBe(base);
  });
});

describe("reduzir: hash (link direto, menu da barra, voltar do navegador)", () => {
  it("produto fora do filtro: volta a Todos e abre, sem entrada própria", () => {
    const { estado, historico } = reduz(fechado({ filtro: "site", ativo: "site-clinicas" }), {
      tipo: "hash",
      slug: "rota-de-vendas",
    });
    expect(estado).toMatchObject({ filtro: "todos", ativo: "rota-de-vendas", aberto: true, entradaPropria: false });
    expect(historico).toBeNull();
  });

  it("produto dentro do filtro: mantém o filtro", () => {
    const { estado } = reduz(fechado({ filtro: "site", ativo: "site-clinicas" }), {
      tipo: "hash",
      slug: "vitrine-lojas",
    });
    expect(estado).toMatchObject({ filtro: "site", ativo: "vitrine-lojas", aberto: true });
  });

  it("o mesmo produto já aberto não muda nada (nem a entrada própria)", () => {
    const base = aberto({ ativo: "rota-de-vendas" });
    const r = reduz(base, { tipo: "hash", slug: "rota-de-vendas" });
    expect(r.estado).toBe(base);
    expect(r.historico).toBeNull();
  });

  it("sem âncora com o painel aberto fecha sem mexer no histórico (voltar do navegador)", () => {
    const { estado, historico } = reduz(aberto(), { tipo: "hash", slug: null });
    expect(estado.aberto).toBe(false);
    expect(estado.entradaPropria).toBe(false);
    expect(historico).toBeNull();
  });

  it("sem âncora com o painel fechado não muda nada", () => {
    const base = fechado();
    const r = reduz(base, { tipo: "hash", slug: null });
    expect(r.estado).toBe(base);
    expect(r.historico).toBeNull();
  });

  // Review Focus 3: "Contato" na barra com o painel aberto.
  it("âncora de outra seção com o painel aberto fecha sem history.back()", () => {
    const { estado, historico } = reduz(aberto({ ativo: "fleet-analytics-bi" }), { tipo: "hash", slug: "contato" });
    expect(estado.aberto).toBe(false);
    expect(estado.ativo).toBe("fleet-analytics-bi");
    expect(historico).toBeNull();
  });

  it("âncora de outra seção com o painel fechado não muda nada", () => {
    const base = fechado();
    const r = reduz(base, { tipo: "hash", slug: "contato" });
    expect(r.estado).toBe(base);
    expect(r.historico).toBeNull();
  });

  it("slug desconhecido é ignorado: não abre, não troca filtro nem ativo", () => {
    const base = fechado({ filtro: "site", ativo: "vitrine-lojas" });
    const r = reduz(base, { tipo: "hash", slug: "nao-existe" });
    expect(r.estado).toBe(base);
    expect(r.historico).toBeNull();
  });
});
