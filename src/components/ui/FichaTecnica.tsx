/** Ficha técnica (MASTER §8.15): rótulo antes do valor no DOM; o CSS mostra o valor em cima. */
export function FichaTecnica({ items }: { items: readonly { value: string; label: string }[] }) {
  return (
    <dl className="ficha">
      {items.map((item) => (
        <div key={item.label} className="ficha__item">
          <dt className="ficha__rotulo">{item.label}</dt>
          <dd className="ficha__valor">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
