import { useId, type CSSProperties } from "react";
import geometria from "./aparelhoVetor.json";
import { VetorRasterizado } from "./VetorRasterizado";

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
 * Sem texto e sem nada focável; no servidor, sem imagem (depois de montar,
 * com movimento, a base e o suporte viram uma imagem do próprio SVG, ver
 * `VetorRasterizado`).
 *
 * Por cima da base e do suporte vai o grão da cena (três ladrilhos de pontos
 * do vetor.js, de lados primos entre si, em `<pattern>` de cada SVG): liso, o
 * vetor parecia colado na sala pintada.
 *
 * Os ids dos degradês, recortes e ladrilhos levam o `useId` (m4 da revisão
 * final da fase 2): com duas instâncias no mesmo documento (uma prévia com
 * dois heros), os `url(#…)` de cada uma apontam para o próprio SVG.
 */
export function AparelhoVetor() {
  // Só letras, dígitos, "-" e "_": o id do React traz pontuação que o url(#…) não aceita sem escape.
  const unico = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const idDe = (nome: string) => `aparelho-vetor-${unico}-${nome}`;
  const urlDe = (nome: string) => `url(#${idDe(nome)})`;
  const { notebook, celular, grao } = geometria;
  const { base } = notebook;
  const { suporte } = celular;

  return (
    <div className="aparelho-vetor" aria-hidden="true">
      <div className="aparelho-vetor__notebook" style={moldura(notebook.tela.largura, notebook.tampa, notebook.cores)}>
        <VetorRasterizado className="aparelho-vetor__base" viewBox={base.caixa.join(" ")} style={caixa(base.caixa)}>
          <defs>
            <radialGradient id={idDe("contato")}>
              {sombra(base.cores.contato)}
            </radialGradient>
            <linearGradient
              id={idDe("tampo")}
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
              id={idDe("brilho")}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={base.brilhoY[0]}
              x2={0}
              y2={base.brilhoY[1]}
            >
              {[0, 0.35, 1].map((offset, i) => (
                <stop key={offset} offset={offset} stopColor={base.cores.brilho} stopOpacity={base.cores.brilhoA[i]} />
              ))}
            </linearGradient>
            {degrade(idDe("quina"), base.quina)}
            {ladrilhos(idDe("grao-base"), grao)}
            <clipPath id={idDe("contorno-base")}>
              <path d={base.lateral} />
            </clipPath>
          </defs>
          <ellipse className="aparelho-vetor__contato" {...base.contato} fill={urlDe("contato")} />
          <path className="aparelho-vetor__lateral" d={base.lateral} fill={base.cores.lateral} />
          <path className="aparelho-vetor__tampo" d={base.tampo} fill={urlDe("tampo")} />
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
            fill={urlDe("brilho")}
            style={{ mixBlendMode: "screen" }}
          />
          {camadaDeGrao(idDe("grao-base"), idDe("contorno-base"), base.caixa, grao)}
          {linha("aparelho-vetor__quina", idDe("quina"), base.quina)}
          <path className="aparelho-vetor__dobradica" d={base.dobradica} fill={base.cores.dobradica} />
        </VetorRasterizado>
        <div className="aparelho-vetor__tampa">
          <span className="aparelho-vetor__camera" />
        </div>
      </div>
      <div className="aparelho-vetor__celular" style={moldura(celular.tela.largura, celular.corpo, celular.cores)}>
        <div className="aparelho-vetor__corpo">
          <span className="aparelho-vetor__camera" />
        </div>
        <VetorRasterizado className="aparelho-vetor__suporte" viewBox={suporte.caixa.join(" ")} style={caixa(suporte.caixa)}>
          <defs>
            <radialGradient id={idDe("contato-celular")}>
              {sombra(suporte.cores.contato)}
            </radialGradient>
            {degrade(idDe("chapa-quina"), suporte.chapa.quina)}
            {degrade(idDe("ressalto-quina"), suporte.ressalto.quina)}
            {/* A frente do ressalto: clara no alto, onde pega a luz, e escura junto da chapa. */}
            <linearGradient id={idDe("ressalto-frente")} x1={0} y1={0} x2={0} y2={1}>
              <stop offset={0} stopColor={suporte.ressalto.cores.frente} />
              <stop offset={1} stopColor={suporte.ressalto.cores.frentePe} />
            </linearGradient>
            {/* A luz quente da luminária na frente da aba, vinda da esquerda (crítica de arte N6 r1). */}
            <linearGradient id={idDe("ressalto-quente")} x1={0} y1={0} x2={1} y2={0}>
              <stop offset={0} stopColor={suporte.ressalto.cores.quente} stopOpacity={suporte.ressalto.cores.quenteA} />
              <stop offset={0.7} stopColor={suporte.ressalto.cores.quente} stopOpacity={0} />
            </linearGradient>
            {/* A sombra da aba na chapa: escura junto da frente, some para a frente da chapa. */}
            <linearGradient id={idDe("sombra-aba")} x1={0} y1={0} x2={0} y2={1}>
              <stop offset={0} stopColor={suporte.cores.contato} />
              <stop offset={1} stopColor={suporte.cores.contato} stopOpacity={0} />
            </linearGradient>
            {ladrilhos(idDe("grao-suporte"), grao)}
            <clipPath id={idDe("contorno-suporte")}>
              <path d={suporte.chapa.lateral} />
              <path d={suporte.ressalto.frente} />
            </clipPath>
            {/* A chapa fica atrás do celular: o corpo a recorta. */}
            <clipPath id={idDe("sem-corpo")}>
              <path d={suporte.semCorpo} clipRule="evenodd" />
            </clipPath>
          </defs>
          <ellipse className="aparelho-vetor__contato" {...suporte.contato} fill={urlDe("contato-celular")} />
          <g className="aparelho-vetor__chapa" clipPath={urlDe("sem-corpo")}>
            <path className="aparelho-vetor__lateral" d={suporte.chapa.lateral} fill={suporte.chapa.cores.lateral} />
            <path d={suporte.chapa.topo} fill={suporte.chapa.cores.topo} />
            {linha(undefined, idDe("chapa-quina"), suporte.chapa.quina)}
          </g>
          <path
            className="aparelho-vetor__sombra-aba"
            d={suporte.ressalto.sombraAba}
            fill={urlDe("sombra-aba")}
          />
          {/* O ressalto, a aba que abraça a borda de baixo do celular, à frente dela. */}
          <g className="aparelho-vetor__ressalto">
            <path
              className="aparelho-vetor__lateral"
              d={suporte.ressalto.frente}
              fill={urlDe("ressalto-frente")}
            />
            <path d={suporte.ressalto.frente} fill={urlDe("ressalto-quente")} />
            <path d={suporte.ressalto.topo} fill={suporte.ressalto.cores.topo} />
            {linha(undefined, idDe("ressalto-quina"), suporte.ressalto.quina)}
          </g>
          {/* O grão da chapa e do ressalto; atrás do celular, a chapa some, e o grão também. */}
          <g clipPath={urlDe("sem-corpo")}>
            {camadaDeGrao(idDe("grao-suporte"), idDe("contorno-suporte"), suporte.caixa, grao)}
          </g>
        </VetorRasterizado>
      </div>
    </div>
  );
}

type Grao = {
  ladrilhos: { lado: number; claro: string; escuro: string }[];
  cores: { claro: string; escuro: string };
};

/** Os ladrilhos do grão (px da mídia): os pontos claros e os escuros de cada um, do vetor.js. */
function ladrilhos(prefixo: string, g: Grao) {
  return g.ladrilhos.map(({ lado, claro, escuro }) => (
    <pattern key={lado} id={`${prefixo}-${lado}`} width={lado} height={lado} patternUnits="userSpaceOnUse">
      <path d={claro} fill={g.cores.claro} />
      <path d={escuro} fill={g.cores.escuro} />
    </pattern>
  ));
}

/** O grão por cima de uma peça: a caixa do SVG coberta pelos ladrilhos, recortada pelo contorno da peça. */
function camadaDeGrao(prefixo: string, contorno: string, [x, y, w, h]: number[], g: Grao) {
  return (
    <g className="aparelho-vetor__grao" clipPath={`url(#${contorno})`}>
      {g.ladrilhos.map(({ lado }) => (
        <rect key={lado} x={x} y={y} width={w} height={h} fill={`url(#${prefixo}-${lado})`} />
      ))}
    </g>
  );
}

type Moldura = { lado: number; topo: number; queixo: number; raio: number; aro: number; camera?: number };
type Quina = { x1: number; y1: number; x2: number; y2: number; largura: number; de: string; para: string };

/**
 * As variáveis da moldura (globals.css): a largura da tela da arte (a
 * unidade, `--av-px`, é 1 px da mídia), as espessuras da borda, o raio, o
 * aro e as cores.
 */
function moldura(largura: number, m: Moldura, cores: { vidro: string; aro: string; filete?: string }): CSSProperties {
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
    ...(cores.filete ? { "--av-filete": cores.filete } : {}),
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
