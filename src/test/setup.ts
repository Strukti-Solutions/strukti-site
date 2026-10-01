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

export {};
