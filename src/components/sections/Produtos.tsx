import { landingContent, type Project } from "@/content/landing";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectGrid } from "./ProjectGrid";

/**
 * PRÉVIA v2.2 [S1-B] (spike, sem portões): uma seção só, "Produtos", com os
 * 3 cartões no mesmo formato (landing-copy-v2.2 §3), na parede de blocos
 * com a junta (MASTER §5.2): vídeo no palco → selo (no replay, + "Ilustração
 * do conceito") → nome → frase → etiquetas → legenda e descrição → botão.
 * Cada cartão tem a sua âncora (#replay, #rota-de-vendas, #fleet-analytics-bi).
 */
export function Produtos() {
  const { title, intro, replay } = landingContent.produtos;
  const { projects, grid, videoDescriptionLinkLabel } = landingContent.aplicativos;

  const replayCard: Project = {
    slug: "replay",
    name: replay.name,
    summary: replay.oneLiner,
    videoTitle: "",
    video: replay.video,
    platforms: [],
    status: "piloto",
    illustrationBadge: replay.illustrationBadge,
    cta: { label: replay.cta, kind: "whatsapp-replay" },
  };

  return (
    <section id="produtos" className="section surface-space produtos-secao" aria-labelledby="produtos-title">
      <div className="container">
        <Reveal className="section-head">
          <h2 id="produtos-title" className="section-title">
            {title}
          </h2>
          <p className="lead">{intro}</p>
        </Reveal>
        <ProjectGrid projects={[replayCard, ...projects]} labels={grid} descriptionLinkLabel={videoDescriptionLinkLabel} />
      </div>
    </section>
  );
}
