import { landingContent } from "@/content/landing";
import { CATALOGO } from "@/content/catalogo";
import { Reveal } from "@/components/motion/Reveal";
import { CatalogoInterativo } from "@/components/catalogo/CatalogoInterativo";

/**
 * A seção #produtos (spec 2026-10-16): o título e a introdução da v2.2
 * (§5.3) e o catálogo em coverflow. Cada cartão leva o `id` do produto
 * (`#replay`, `#rota-de-vendas`, ...), a âncora do link direto (§3.4).
 */
export function Catalogo() {
  const { title, intro } = landingContent.produtos;

  return (
    <section id="produtos" className="section surface-space catalogo-secao" aria-labelledby="produtos-title">
      <div className="container">
        <Reveal className="section-head">
          <h2 id="produtos-title" className="section-title">
            {title}
          </h2>
          <p className="lead">{intro}</p>
        </Reveal>
        <CatalogoInterativo itens={CATALOGO} />
      </div>
    </section>
  );
}
