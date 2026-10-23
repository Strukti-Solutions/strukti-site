/**
 * O aparelho do protótipo cinza da entrada pelo notebook (spec
 * 2026-10-23-hero-entrada-notebook-design.md, §11.1): caixas no lugar do
 * vetor da fase de arte. O `ScrollExpandMedia` (modo entrada) o põe no quadro,
 * por cima da sala, num invólucro `aria-hidden` do tamanho da janela útil,
 * escalado como a tela (ver Hero "entrada" em globals.css).
 *
 * Os dois aparelhos ficam no HTML; o CSS mostra um ou outro por
 * `(orientation: portrait)` (Q26): deitado, o notebook (tampa e base com o
 * teclado); em pé, o celular (corpo e suporte). A moldura é uma borda em
 * volta do retângulo da tela, e o miolo fica vazio: a tela de verdade é o
 * bloco de chamada (`.hero-expansao__conteudo`), por cima. Sem texto e sem
 * nada focável.
 */
export function AparelhoCinza() {
  return (
    <div className="aparelho-cinza" aria-hidden="true">
      <div className="aparelho-cinza__notebook">
        <div className="aparelho-cinza__tampa" />
        <div className="aparelho-cinza__base" />
      </div>
      <div className="aparelho-cinza__celular">
        <div className="aparelho-cinza__corpo" />
        <div className="aparelho-cinza__suporte" />
      </div>
    </div>
  );
}
