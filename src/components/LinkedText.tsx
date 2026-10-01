type LinkedTextProps = {
  text: string;
  linkLabel: string;
  href: string;
  external?: boolean;
};

/**
 * Renderiza `text`, transformando a primeira ocorrência de `linkLabel` num
 * link, sem alterar o texto aprovado em nenhum dos dois lados.
 */
export function LinkedText({ text, linkLabel, href, external }: LinkedTextProps) {
  const index = text.indexOf(linkLabel);
  if (index === -1) {
    return <>{text}</>;
  }

  const before = text.slice(0, index);
  const after = text.slice(index + linkLabel.length);

  return (
    <>
      {before}
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {linkLabel}
      </a>
      {after}
    </>
  );
}
