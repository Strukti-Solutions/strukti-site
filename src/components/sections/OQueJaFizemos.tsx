import Image from "next/image";
import { landingContent } from "@/content/landing";

export function OQueJaFizemos() {
  const { title, subtitle, appName, appDescription, videoSrc, videoPoster, disclaimer, screenshots } =
    landingContent.oQueJaFizemos;

  return (
    <section id="o-que-ja-fizemos" className="section section--alt" aria-labelledby="ojf-title">
      <div className="container">
        <h2 id="ojf-title" className="section-title">
          {title}
        </h2>
        <p className="section-subtitle">{subtitle}</p>

        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ color: "var(--color-petrol-900)", marginBottom: "0.5rem" }}>{appName}</h3>
          <p style={{ color: "var(--color-ink-muted)", maxWidth: "70ch", marginBottom: "1.5rem" }}>
            {appDescription}
          </p>

          <video
            controls
            preload="none"
            poster={videoPoster}
            style={{
              width: "100%",
              maxWidth: "720px",
              borderRadius: "0.75rem",
              border: "1px solid var(--color-border)",
              backgroundColor: "#000",
            }}
            aria-label={`Vídeo de demonstração do aplicativo ${appName}`}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        </div>

        <ul
          style={{
            listStyle: "none",
            margin: "0 0 0.75rem",
            padding: 0,
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          {screenshots.map((screenshot) => (
            <li key={screenshot.src}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "4 / 3",
                  borderRadius: "0.5rem",
                  overflow: "hidden",
                  border: "1px solid var(--color-border)",
                }}
              >
                <Image
                  src={screenshot.src}
                  alt={screenshot.alt}
                  fill
                  loading="lazy"
                  style={{ objectFit: "cover" }}
                  sizes="(min-width: 768px) 25vw, 50vw"
                />
              </div>
            </li>
          ))}
        </ul>
        <p style={{ fontSize: "0.9rem", color: "var(--color-ink-muted)" }}>{disclaimer}</p>
      </div>
    </section>
  );
}
