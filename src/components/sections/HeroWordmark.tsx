/**
 * A palavra "Strukti" gigante do hero "video" (MASTER §9.6). Decorativa
 * (`aria-hidden`): o nome da marca já está no logo da barra e o título da
 * página é o H1. O "i" é o i sem pingo (ı) e o pingo é o ponto azul do logo,
 * um elemento à parte que cai no lugar depois que a palavra sobe.
 *
 * A subida (word pull-up) é só CSS (ADR-004, aprovado pelo Claudinho no
 * HR1): começa no 1º quadro, sem esperar a hidratação, não pisca e some com
 * prefers-reduced-motion. Ver "Hero com vídeo" em globals.css.
 */
export function HeroWordmark() {
  return (
    <div className="hero-wordmark" aria-hidden="true">
      <span className="hero-wordmark__word">
        Strukt
        <span className="hero-wordmark__i">
          ı<span className="hero-wordmark__dot" />
        </span>
      </span>
    </div>
  );
}
