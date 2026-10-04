/** Ficha técnica (MASTER §8.15): rótulo antes do valor no DOM; o CSS mostra o valor em cima. */
export function FichaTecnica({ items }: { items: readonly { value: string; label: string }[] }) {
  return (
    <dl className="ficha">
      {/* Chave pelo índice: a lista vem fixa do conteúdo, e o rótulo pode se repetir. */}
      {items.map((item, index) => (
        <div key={index} className="ficha__item">
          <dt className="ficha__rotulo">{item.label}</dt>
          <dd className="ficha__valor">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
