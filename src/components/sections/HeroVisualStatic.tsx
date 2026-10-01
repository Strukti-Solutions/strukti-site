import Image from "next/image";

/**
 * Visual "static" do hero, sem WebGL (MASTER §9.4): o símbolo da Strukti em
 * vista explodida — as peças prestes a se encaixar no hexágono — sobre o
 * espaço, com uma luz azul atrás. Decorativo e parado; funciona sem
 * JavaScript. Também é o fallback do buraco negro quando o WebGL falha (ver
 * HeroVisualBlackhole e a seção "Hero" de globals.css). A posição segue o
 * mesmo ponto focal de qualquer visual, só por CSS — por isso não usa
 * `narrow` (ver HeroVisualProps em hero-visual.ts).
 */
export function HeroVisualStatic() {
  return (
    <div className="hero-static">
      <div className="hero-static__light" />
      <Image
        className="hero-static__symbol"
        src="/brand/strukti-encaixe.svg"
        alt=""
        width={494}
        height={570}
        unoptimized
      />
    </div>
  );
}
