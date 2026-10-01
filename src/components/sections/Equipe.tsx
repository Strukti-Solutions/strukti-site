import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";
import { Reveal, RevealStaggerList, RevealStaggerItem } from "@/components/motion/Reveal";

/**
 * Hexágono de pé, na proporção do símbolo da marca (406 × 498), com cantos
 * levemente arredondados como os blocos do logo.
 */
const HEXAGON_PATH =
  "M27.4 1.1Q29.5 0 31.6 1.1L56.9 14.5Q59 15.6 59 18V54Q59 56.4 56.9 57.5L31.6 70.9Q29.5 72 27.4 70.9L2.1 57.5Q0 56.4 0 54V18Q0 15.6 2.1 14.5Z";

/** Parede de 4 blocos com as iniciais num hexágono (MASTER §8.9). */
export function Equipe() {
  const { title, intro } = landingContent.equipe;

  return (
    <section id="equipe" className="section section--seam surface-paper" aria-labelledby="equipe-title">
      <div className="container">
        <Reveal className="section-head">
          <h2 id="equipe-title" className="section-title">
            {title}
          </h2>
          <p className="lead">{intro}</p>
        </Reveal>

        <RevealStaggerList className="wall wall--4 wall--team">
          {siteConfig.team.map((member) => (
            <RevealStaggerItem key={member.name} className="block member">
              <span className="member__hex" aria-hidden="true">
                <svg viewBox="0 0 59 72" focusable="false">
                  <path d={HEXAGON_PATH} fill="var(--color-navy-800)" />
                </svg>
                <span className="member__initials">{member.initials}</span>
              </span>
              <h3 className="block-title">{member.name}</h3>
            </RevealStaggerItem>
          ))}
        </RevealStaggerList>
      </div>
    </section>
  );
}
