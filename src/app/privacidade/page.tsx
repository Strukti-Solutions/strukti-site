import type { Metadata } from "next";
import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";

function formatPrivacyPolicyDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export const metadata: Metadata = {
  title: `${landingContent.privacidade.title} | ${landingContent.seo.ogSiteName}`,
  alternates: {
    canonical: "/privacidade",
  },
};

export default function PrivacidadePage() {
  const { title, lastUpdatedLabel, intro, sections } = landingContent.privacidade;
  const lastUpdatedDate = formatPrivacyPolicyDate(siteConfig.privacyPolicyVersion);

  return (
    <main id="conteudo-principal" className="section surface-paper">
      <div className="container prose">
        <h1 className="section-title">{title}</h1>
        <p className="caption" style={{ margin: "var(--space-4) 0 var(--space-5)" }}>
          {lastUpdatedLabel} {lastUpdatedDate}
        </p>
        <p className="lead">{intro}</p>

        {sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {"list" in section && section.list && (
              <ul>
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {"paragraphsAfterList" in section &&
              section.paragraphsAfterList?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
          </section>
        ))}
      </div>
    </main>
  );
}
