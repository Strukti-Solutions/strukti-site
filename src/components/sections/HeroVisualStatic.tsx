/**
 * Fundo do tema do hero, sem WebGL: usado quando `heroVisual` é "static" e,
 * por trás do canvas, como fallback de qualquer outra peça (ex.:
 * HeroVisualBlackhole, sem WebGL ou com o contexto perdido). Não depende do
 * viewport (`narrow`), por isso não declara esse parâmetro — ver
 * HeroVisualProps em hero-visual.ts.
 */
export function HeroVisualStatic() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      style={{
        background:
          "linear-gradient(135deg, var(--color-petrol-900), var(--color-petrol-800))",
      }}
    />
  );
}
