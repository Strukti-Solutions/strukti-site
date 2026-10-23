"use client";

import { useState, type SyntheticEvent } from "react";

type Par<T> = readonly [T, T];

interface Camadas {
  /** A imagem de cada uma das duas camadas. */
  srcs: Par<string>;
  /** A imagem que cada camada já terminou de carregar. */
  carregadas: Par<string | null>;
  /** A camada que recebeu a arte do produto atual. */
  frente: 0 | 1;
}

/**
 * O fundo ambiente do catálogo (spec 2026-10-16, §3.1 e §7): a arte do
 * produto do centro (o `cartao-480.jpg`), desenhada pequena e ampliada,
 * desfocada, sob uma camada navy forte. Desfoque barato: a imagem tem 64 px
 * de largura e cresce pelo `transform` (nada de desfoque grande calculado
 * em tela cheia).
 *
 * Duas camadas fixas, as duas no DOM desde o 1º render (a de trás apagada):
 * um elemento novo não ganha transição no 1º estilo, e a 1ª troca sairia em
 * corte seco. Ao trocar de produto, a de trás recebe a arte nova e só acende
 * quando a imagem carregou (antes disso, a anterior segue acesa: nada de
 * esmaecer para o navy e a arte pular depois). A CSS faz o crossfade de 1 s
 * (instantâneo com movimento reduzido). Decorativo: fora da árvore de
 * acessibilidade.
 */
export function FundoAmbiente({ src }: { src: string }) {
  // A arte inicial conta como pronta: sai acesa já no HTML do servidor.
  const [camadas, setCamadas] = useState<Camadas>({ srcs: [src, src], carregadas: [src, src], frente: 0 });

  // Guardar o que veio do render anterior (padrão do React): sem efeito,
  // a troca já sai no mesmo render.
  if (camadas.srcs[camadas.frente] !== src) {
    const tras = camadas.frente === 0 ? 1 : 0;
    const srcs: Par<string> = tras === 0 ? [src, camadas.srcs[1]] : [camadas.srcs[0], src];
    setCamadas({ ...camadas, srcs, frente: tras });
  }

  const { srcs, carregadas, frente } = camadas;
  // A da frente acende quando a arte dela carregou; até lá, fica a outra.
  const acesa = carregadas[frente] === srcs[frente] ? frente : frente === 0 ? 1 : 0;

  const aoCarregar = (indice: 0 | 1) => (evento: SyntheticEvent<HTMLImageElement>) => {
    const carregou = evento.currentTarget.getAttribute("src");
    setCamadas((atual) => {
      if (carregou !== atual.srcs[indice] || atual.carregadas[indice] === carregou) return atual;
      const carregadas: Par<string | null> =
        indice === 0 ? [carregou, atual.carregadas[1]] : [atual.carregadas[0], carregou];
      return { ...atual, carregadas };
    });
  };

  return (
    <div className="catalogo__fundo" aria-hidden="true">
      {srcs.map((camada, indice) => (
        // eslint-disable-next-line @next/next/no-img-element -- 64 px desfocado: o otimizador do next/image não ganha nada aqui
        <img
          // Pela posição: a camada é o mesmo elemento, só a imagem troca.
          key={indice}
          className="catalogo__fundo-camada"
          src={camada}
          width={64}
          height={96}
          alt=""
          aria-hidden="true"
          data-visivel={indice === acesa ? "true" : "false"}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={aoCarregar(indice as 0 | 1)}
        />
      ))}
    </div>
  );
}
