/*
 * SPIKE (prévia [S1-B]): destaca as marcações [A PREENCHER: ...] como
 * rascunho bem visível. Nada disso vai ao ar: sem dado, não publica.
 */
export function Rascunho({ text }: { text: string }) {
  const parts = text.split(/(\[A PREENCHER[^\]]*\])/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("[A PREENCHER") ? (
          <mark key={index} className="rascunho">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
