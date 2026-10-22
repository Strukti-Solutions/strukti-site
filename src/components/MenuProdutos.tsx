"use client";

import { useEffect, useId, useRef, useState, type FocusEvent } from "react";
import { CATALOGO, catalogoUi, type TipoProduto } from "@/content/catalogo";
import { landingContent } from "@/content/landing";

/** Ordem dos grupos no menu: a mesma das pílulas do filtro do catálogo. */
const ORDEM_TIPOS: readonly TipoProduto[] = ["hardware", "aplicativo", "site"];

/** Só os tipos que têm produto; dentro de cada um, a ordem do catálogo. */
const GRUPOS = ORDEM_TIPOS.map((tipo) => ({
  tipo,
  rotulo: catalogoUi.filtros[tipo],
  itens: CATALOGO.filter((item) => item.tipo === tipo),
})).filter((grupo) => grupo.itens.length > 0);

/** O texto do botão é o do item "#produtos" da barra (landingContent.header.nav). */
const ROTULO = landingContent.header.nav.find((item) => item.href === "#produtos")?.label ?? "Produtos";

/**
 * Menu "Produtos ▾" da barra do topo (spec do catálogo, 2026-10-16, §3.5):
 * um botão de divulgação (padrão disclosure, não `role="menu"`) que mostra os
 * produtos do catálogo agrupados por tipo, com links `#slug`. O catálogo abre
 * o painel do produto no `hashchange` (useCatalogo).
 *
 * A árvore é uma só (ADR-004): a partir de 75em a lista abre como popover
 * abaixo do botão; abaixo disso, dentro do painel do Menu, como sublista.
 * Quem muda é o CSS (seção "Barra do topo" de globals.css).
 *
 * Fecha com Esc (devolvendo o foco ao botão), com clique fora, quando o foco
 * sai dele e ao escolher um produto; nesse caso `aoEscolher` fecha também o
 * painel do Menu do celular.
 *
 * Sem JS, o botão não abriria nada: o servidor (e o 1º render do cliente,
 * para a hidratação não divergir) traz um link "Produtos" para #produtos, que
 * vira o botão depois de montar, como o `data-js` do catálogo.
 */
export function MenuProdutos({ ativo, aoEscolher }: { ativo: boolean; aoEscolher: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [js, setJs] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const listaId = useId();

  useEffect(() => {
    setJs(true);
  }, []);

  useEffect(() => {
    if (!aberto) return;

    // Na captura da janela, antes do Esc do painel do Menu (que ouve na captura do
    // document): com os dois abertos, o 1º Esc fecha só esta lista, que está
    // por dentro, e o 2º fecha o painel.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setAberto(false);
      botaoRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!raizRef.current?.contains(event.target as Node)) setAberto(false);
    };

    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [aberto]);

  // Fecha quando o foco sai do menu (para Equipe, ou para fora da barra, que
  // também fecha o painel do Menu): o popover aberto cobriria o que vem
  // abaixo dele. Sem destino (relatedTarget null), o pointerdown cuida.
  const fecharQuandoFocoSai = (event: FocusEvent<HTMLDivElement>) => {
    const proximo = event.relatedTarget;
    if (proximo instanceof Node && !event.currentTarget.contains(proximo)) setAberto(false);
  };

  const escolher = () => {
    setAberto(false);
    aoEscolher();
  };

  return (
    <div ref={raizRef} className="topbar__produtos-raiz" onBlur={fecharQuandoFocoSai}>
      {js ? (
        <button
          ref={botaoRef}
          type="button"
          className="topbar__produtos"
          aria-expanded={aberto}
          aria-controls={listaId}
          aria-current={ativo ? "true" : undefined}
          onClick={() => setAberto((valor) => !valor)}
        >
          {ROTULO}
          <span className="topbar__produtos-seta" aria-hidden="true" />
        </button>
      ) : (
        <a href="#produtos" className="topbar__produtos" aria-current={ativo ? "true" : undefined}>
          {ROTULO}
        </a>
      )}

      <div id={listaId} className="topbar__produtos-menu" hidden={!aberto}>
        {GRUPOS.map((grupo) => {
          const rotuloId = `${listaId}-${grupo.tipo}`;
          return (
            <div key={grupo.tipo} className="topbar__produtos-grupo">
              <p id={rotuloId} className="topbar__produtos-tipo">
                {grupo.rotulo}
              </p>
              <ul aria-labelledby={rotuloId} className="topbar__produtos-lista">
                {grupo.itens.map((item) => (
                  <li key={item.slug}>
                    <a href={`#${item.slug}`} onClick={escolher}>
                      {item.nome}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
