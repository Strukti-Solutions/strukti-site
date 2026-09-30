import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";

export function Equipe() {
  const { title, intro } = landingContent.equipe;

  return (
    <section id="equipe" className="section section--alt" aria-labelledby="equipe-title">
      <div className="container">
        <h2 id="equipe-title" className="section-title">
          {title}
        </h2>
        <p className="section-subtitle">{intro}</p>

        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gap: "1.25rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          {siteConfig.team.map((member) => (
            <li key={member.name} style={{ textAlign: "center" }}>
              <span
                aria-hidden="true"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "4rem",
                  height: "4rem",
                  margin: "0 auto 0.75rem",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-petrol-800)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                }}
              >
                {member.initials}
              </span>
              <p style={{ margin: 0, fontWeight: 600, color: "var(--color-petrol-900)" }}>
                {member.name}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
