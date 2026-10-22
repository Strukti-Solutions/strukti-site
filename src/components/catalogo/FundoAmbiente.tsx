"use client";

import { useState } from "react";

interface Camadas {
  /** A imagem de cada uma das duas camadas (a de trás nasce vazia). */
  srcs: readonly [string, string | null];
  /** A camada que está por cima, visível. */
  frente: 0 | 1;
}

/**
 * O fundo ambiente do catálogo (spec 2026-10-16, §3.1 e §7): a arte do
 * produto do centro (o `cartao-480.jpg`), desenhada pequena e ampliada,
 * desfocada, sob uma camada navy forte. Desfoque barato: a imagem tem 64 px
 * de largura e cresce pelo `transform` (nada de desfoque grande calculado
 * em tela cheia).
 *
 * Duas camadas fixas: ao trocar de produto, a de trás recebe a arte nova e
 * vira a da frente, e a CSS faz o crossfade de 1 s (instantâneo com
 * movimento reduzido). Decorativo: fora da árvore de acessibilidade.
 */
export function FundoAmbiente({ src }: { src: string }) {
  const [camadas, setCamadas] = useState<Camadas>({ srcs: [src, null], frente: 0 });

  // Guardar o que veio do render anterior (padrão do React): sem efeito,
  // a troca já sai no mesmo render.
  if (camadas.srcs[camadas.frente] !== src) {
    const [primeira, segunda] = camadas.srcs;
    setCamadas(camadas.frente === 0 ? { srcs: [primeira, src], frente: 1 } : { srcs: [src, segunda], frente: 0 });
  }

  return (
    <div className="catalogo__fundo" aria-hidden="true">
      {camadas.srcs.map((camada, indice) =>
        camada === null ? null : (
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
            data-visivel={indice === camadas.frente ? "true" : "false"}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ),
      )}
    </div>
  );
}
