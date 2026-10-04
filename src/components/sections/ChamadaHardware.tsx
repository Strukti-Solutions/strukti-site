import { landingContent } from "@/content/landing";
import { Reveal } from "@/components/motion/Reveal";
import { InterestLink } from "@/components/InterestLink";

/** "Tem um problema que pede hardware?" (spec §4, seção 5): contato geral, interesse "Outro". */
export function ChamadaHardware() {
  const { title, body, cta } = landingContent.chamadaHardware;

  return (
    <section id="sob-medida" className="section surface-paper" aria-labelledby="sob-medida-title">
      <div className="container">
        <Reveal className="chamada">
          <h2 id="sob-medida-title" className="section-title">
            {title}
          </h2>
          <p className="lead">{body}</p>
          <InterestLink interest="outro" className="btn btn--primary">
            {cta}
          </InterestLink>
        </Reveal>
      </div>
    </section>
  );
}
