// Configuração global dos testes (vitest + testing-library).
// Sem matchers extras, para manter o mínimo de dependências.

// jsdom não implementa IntersectionObserver; o motion/react usa isso em
// `whileInView` (revelação ao rolar). Stub mínimo só para o motion montar
// sem erro — os testes não dependem de ele disparar de verdade.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (typeof window !== "undefined" && !("IntersectionObserver" in window)) {
  // @ts-expect-error stub mínimo, não implementa a interface inteira
  window.IntersectionObserver = IntersectionObserverStub;
  // @ts-expect-error idem, para o código que lê o global direto
  global.IntersectionObserver = IntersectionObserverStub;
}

// jsdom não implementa nenhum contexto de canvas (precisaria do pacote
// `canvas`, que não instalamos — ADR-003, quarentena de dependência nova).
// Sem este stub, toda chamada a getContext (ex.: BlackHoleHeroSection pedindo
// "webgl"/"webgl2", ou o axe-core pedindo "2d" para conferir contraste)
// imprime "Not implemented: HTMLCanvasElement's getContext()" pelo
// VirtualConsole padrão do jsdom — não é um console.error de verdade (os
// testes de hidratação e do axe continuam exigindo zero console.error), só
// polui a saída do `npm test` (achado da Crivo, revisão DS1). Devolver `null`
// sempre deixa explícito, no teste, o caminho "sem canvas" que o próprio
// componente trata (ver giveUp() em blackhole-hero-section.tsx) e que o
// axe-core já tolera.
if (typeof HTMLCanvasElement !== "undefined") {
  type GetContext = typeof HTMLCanvasElement.prototype.getContext;

  HTMLCanvasElement.prototype.getContext = function (): ReturnType<GetContext> {
    return null;
  } as GetContext;
}

export {};
