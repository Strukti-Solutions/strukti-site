import type { Metadata } from "next";
import { landingContent } from "@/content/landing";

export const metadata: Metadata = {
  title: `${landingContent.privacidade.title} — ${landingContent.seo.ogSiteName}`,
};

export default function PrivacidadePage() {
  const { title, lastUpdatedLabel, lastUpdatedDate, intro, sections } = landingContent.privacidade;

  return (
    <main id="conteudo-principal" className="section">
      <div className="container" style={{ maxWidth: "760px" }}>
        <h1 className="section-title">{title}</h1>
        <p style={{ color: "var(--color-ink-muted)", marginBottom: "1.5rem" }}>
          {lastUpdatedLabel} {lastUpdatedDate}
        </p>
        <p style={{ color: "var(--color-ink-muted)", marginBottom: "2rem" }}>{intro}</p>

        {sections.map((section) => (
          <section key={section.heading} style={{ marginBottom: "1.75rem" }}>
            <h2 style={{ color: "var(--color-petrol-900)", fontSize: "1.2rem" }}>
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} style={{ color: "var(--color-ink-muted)" }}>
                {paragraph}
              </p>
            ))}
            {"list" in section && section.list && (
              <ul style={{ color: "var(--color-ink-muted)" }}>
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {"paragraphsAfterList" in section &&
              section.paragraphsAfterList?.map((paragraph) => (
                <p key={paragraph} style={{ color: "var(--color-ink-muted)" }}>
                  {paragraph}
                </p>
              ))}
          </section>
        ))}
      </div>
    </main>
  );
}
