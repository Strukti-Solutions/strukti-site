import type { CSSProperties } from "react";
import geometria from "./aparelhoVetor.json";

/**
 * O aparelho em vetor da entrada pelo notebook (spec
 * 2026-10-23-hero-entrada-notebook-design.md, §4 e §6): a moldura, a base com
 * o teclado e o suporte, nítidos em qualquer escala, por cima da sala (a mídia
 * é renderizada sem o aparelho: o lugar dele fica vazio, com a sombra e o
 * brilho na mesa). O `ScrollExpandMedia` (modo entrada) o põe no quadro, num
 * invólucro `aria-hidden` do tamanho da janela útil, escalado como a tela (ver
 * Hero "entrada" em globals.css).
 *
 * A geometria e a luz vêm da arte: `scripts/hero-notebook/vetor.js` projeta o
 * notebook e o celular do `scene.js` pelas câmeras das mídias e grava o
 * `aparelhoVetor.json` (px da mídia, origem no meio do pé da tela, y para
 * baixo; o `cena.test.ts` confere que ele é a saída do vetor.js).
 *
 * Os dois aparelhos ficam no HTML; o CSS mostra um ou outro por
 * `(orientation: portrait)` (Q26). A caixa de cada um é o retângulo da tela,
 * na proporção da janela (Q13); a tela de verdade é o bloco de chamada
 * (`.hero-expansao__conteudo`), por cima, e o miolo fica vazio. A moldura (a
 * tampa, o corpo) é uma borda de espessura fixa em volta dele, em CSS. A base
 * e o suporte são SVG presos ao pé da tela, que fica sempre no pé da tela da
 * arte (`telaNaCena`): eles caem no lugar vazio da mesa em qualquer janela.
 * Sem texto, sem imagem e sem nada focável.
 */
export function AparelhoVetor() {
  const { notebook, celular } = geometria;
  const { base } = notebook;
  const { suporte } = celular;

  return (
    <div className="aparelho-vetor" aria-hidden="true">
      <div className="aparelho-vetor__notebook" style={moldura(notebook.tela.largura, notebook.tampa, notebook.cores)}>
        <svg className="aparelho-vetor__base" viewBox={base.caixa.join(" ")} style={caixa(base.caixa)} focusable="false">
          <defs>
            <radialGradient id="aparelho-vetor-contato">
              {sombra(base.cores.contato)}
            </radialGradient>
            <linearGradient
              id="aparelho-vetor-tampo"
              gradientUnits="userSpaceOnUse"
              x1={base.tampoX[0]}
              y1={0}
              x2={base.tampoX[1]}
              y2={0}
            >
              <stop offset={0} stopColor={base.cores.tampoEsq} />
              <stop offset={1} stopColor={base.cores.tampoDir} />
            </linearGradient>
            {/* A luz fria da tela no tampo e no teclado, mais forte junto da dobradiça (Q18). */}
            <linearGradient
              id="aparelho-vetor-brilho"
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={base.brilhoY[0]}
              x2={0}
              y2={base.brilhoY[1]}
            >
              {[0, 0.55, 1].map((offset, i) => (
                <stop key={offset} offset={offset} stopColor={base.cores.brilho} stopOpacity={base.cores.brilhoA[i]} />
              ))}
            </linearGradient>
            {degrade("aparelho-vetor-quina", base.quina)}
          </defs>
          <ellipse className="aparelho-vetor__contato" {...base.contato} fill="url(#aparelho-vetor-contato)" />
          <path className="aparelho-vetor__lateral" d={base.lateral} fill={base.cores.lateral} />
          <path className="aparelho-vetor__tampo" d={base.tampo} fill="url(#aparelho-vetor-tampo)" />
          <path className="aparelho-vetor__teclas" d={base.teclas} fill={base.cores.tecla} />
          <path
            className="aparelho-vetor__trackpad"
            d={base.trackpad}
            fill={base.cores.trackpad}
            stroke={base.cores.trackpadAro}
            strokeWidth={0.8}
          />
          <path
            className="aparelho-vetor__brilho"
            d={base.tampo}
            fill="url(#aparelho-vetor-brilho)"
            style={{ mixBlendMode: "screen" }}
          />
          {linha("aparelho-vetor__quina", "aparelho-vetor-quina", base.quina)}
          <path className="aparelho-vetor__dobradica" d={base.dobradica} fill={base.cores.dobradica} />
        </svg>
        <div className="aparelho-vetor__tampa">
          <span className="aparelho-vetor__camera" />
        </div>
      </div>
      <div className="aparelho-vetor__celular" style={moldura(celular.tela.largura, celular.corpo, celular.cores)}>
        <div className="aparelho-vetor__corpo" />
        <svg className="aparelho-vetor__suporte" viewBox={suporte.caixa.join(" ")} style={caixa(suporte.caixa)} focusable="false">
          <defs>
            <radialGradient id="aparelho-vetor-contato-celular">
              {sombra(suporte.cores.contato)}
            </radialGradient>
            {degrade("aparelho-vetor-chapa-quina", suporte.chapa.quina)}
            {degrade("aparelho-vetor-ressalto-quina", suporte.ressalto.quina)}
            {/* A chapa fica atrás do celular: o corpo a recorta. */}
            <clipPath id="aparelho-vetor-sem-corpo">
              <path d={suporte.semCorpo} clipRule="evenodd" />
            </clipPath>
          </defs>
          <ellipse className="aparelho-vetor__contato" {...suporte.contato} fill="url(#aparelho-vetor-contato-celular)" />
          <g className="aparelho-vetor__chapa" clipPath="url(#aparelho-vetor-sem-corpo)">
            <path className="aparelho-vetor__lateral" d={suporte.chapa.lateral} fill={suporte.chapa.cores.lateral} />
            <path d={suporte.chapa.topo} fill={suporte.chapa.cores.topo} />
            {linha(undefined, "aparelho-vetor-chapa-quina", suporte.chapa.quina)}
          </g>
          {/* O ressalto, à frente da borda de baixo do celular. */}
          <g className="aparelho-vetor__ressalto">
            <path className="aparelho-vetor__lateral" d={suporte.ressalto.frente} fill={suporte.ressalto.cores.frente} />
            <path d={suporte.ressalto.topo} fill={suporte.ressalto.cores.topo} />
            {linha(undefined, "aparelho-vetor-ressalto-quina", suporte.ressalto.quina)}
          </g>
        </svg>
      </div>
    </div>
  );
}

type Moldura = { lado: number; topo: number; queixo: number; raio: number; aro: number; camera?: number };
type Quina = { x1: number; y1: number; x2: number; y2: number; largura: number; de: string; para: string };

/**
 * As variáveis da moldura (globals.css): a largura da tela da arte (a
 * unidade, `--av-px`, é 1 px da mídia), as espessuras da borda, o raio, o
 * aro e as cores.
 */
function moldura(largura: number, m: Moldura, cores: { vidro: string; aro: string }): CSSProperties {
  return {
    "--av-largura": largura,
    "--av-lado": m.lado,
    "--av-topo": m.topo,
    "--av-queixo": m.queixo,
    "--av-raio": m.raio,
    "--av-aro": m.aro,
    ...(m.camera ? { "--av-camera": m.camera } : {}),
    "--av-vidro": cores.vidro,
    "--av-aro-cor": cores.aro,
  } as CSSProperties;
}

/** O SVG abaixo do pé da tela: o viewBox [x, y, largura, altura], em px da mídia a partir do meio do pé da tela. */
function caixa([x, y, w, h]: number[]): CSSProperties {
  return { "--av-x": x, "--av-y": y, "--av-w": w, "--av-h": h } as CSSProperties;
}

/** A sombra de contato: escura no meio, some na borda da elipse. */
function sombra(cor: string) {
  return (
    <>
      <stop offset={0} stopColor={cor} />
      <stop offset={0.6} stopColor={cor} stopOpacity={0.6} />
      <stop offset={1} stopColor={cor} stopOpacity={0} />
    </>
  );
}

/** O degradê de uma quina que pega a luz, ao longo dela. */
function degrade(id: string, q: Quina) {
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={q.x1} y1={q.y1} x2={q.x2} y2={q.y2}>
      <stop offset={0} stopColor={q.de} />
      <stop offset={1} stopColor={q.para} />
    </linearGradient>
  );
}

function linha(className: string | undefined, id: string, q: Quina) {
  return (
    <line className={className} x1={q.x1} y1={q.y1} x2={q.x2} y2={q.y2} stroke={`url(#${id})`} strokeWidth={q.largura} />
  );
}
