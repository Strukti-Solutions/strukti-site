import { landingContent } from "@/content/landing";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectGrid } from "@/components/sections/ProjectGrid";
import { InterestLink } from "@/components/InterestLink";

/** Aplicativos (spec §4, seção 4): a grade de vídeos atual, em palcos, com o selo de cada app. */
export function Aplicativos() {
  const { title, intro, cta, projects, grid, videoDescriptionLinkLabel } = landingContent.aplicativos;

  return (
    <section id="aplicativos" className="section surface-night aplicativos" aria-labelledby="aplicativos-title">
      <div className="container">
        <Reveal className="section-head">
          <h2 id="aplicativos-title" className="section-title">
            {title}
          </h2>
          <p className="lead">{intro}</p>
        </Reveal>
        <ProjectGrid projects={projects} labels={grid} descriptionLinkLabel={videoDescriptionLinkLabel} />
        <Reveal className="section-actions">
          <InterestLink interest="aplicativo" className="btn btn--primary">
            {cta}
          </InterestLink>
        </Reveal>
      </div>
    </section>
  );
}
