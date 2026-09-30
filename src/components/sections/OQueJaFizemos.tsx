import Image from "next/image";
import { landingContent } from "@/content/landing";

export function OQueJaFizemos() {
  const {
    title,
    intro,
    highlights,
    videoTitle,
    videoAccessibleName,
    videoCaption,
    videoDescriptionLinkLabel,
    videoDescription,
    videoSrc,
    videoPoster,
    closing,
    button,
    screenshots,
    screenshotsDisclaimer,
  } = landingContent.oQueJaConstruimos;

  return (
    <section id="o-que-construimos" className="section section--alt" aria-labelledby="ojc-title">
      <div className="container">
        <h2 id="ojc-title" className="section-title">
          {title}
        </h2>
        <p className="section-subtitle">{intro}</p>

        <div style={{ marginBottom: "2.5rem" }}>
          <ul
            style={{
              listStyle: "none",
              margin: "0 0 2rem",
              padding: 0,
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            }}
          >
            {highlights.map((item) => (
              <li key={item.lead} style={{ color: "var(--color-ink-muted)" }}>
                <strong style={{ color: "var(--color-petrol-900)" }}>{item.lead}</strong> {item.rest}
              </li>
            ))}
          </ul>

          <h3 style={{ color: "var(--color-petrol-900)", marginBottom: "0.75rem" }}>{videoTitle}</h3>

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
            aria-label={videoAccessibleName}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>

          <p
            style={{
              margin: "0.75rem 0 0.35rem",
              color: "var(--color-ink-muted)",
              fontSize: "0.9rem",
              maxWidth: "720px",
            }}
          >
            {videoCaption}
          </p>

          <details style={{ maxWidth: "720px" }}>
            <summary
              style={{
                cursor: "pointer",
                color: "var(--color-petrol-700)",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              {videoDescriptionLinkLabel}
            </summary>
            <p style={{ margin: "0.5rem 0 0", color: "var(--color-ink-muted)" }}>{videoDescription}</p>
          </details>
        </div>

        <ul className="screenshot-grid" style={{ listStyle: "none", margin: "0 0 0.5rem", padding: 0 }}>
          {screenshots.map((screenshot) => (
            <li key={screenshot.src}>
              <Image
                src={screenshot.src}
                alt={screenshot.alt}
                width={screenshot.width}
                height={screenshot.height}
                loading="lazy"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--color-border)",
                }}
              />
            </li>
          ))}
        </ul>
        <p style={{ fontSize: "0.9rem", color: "var(--color-ink-muted)", marginBottom: "2rem" }}>
          {screenshotsDisclaimer}
        </p>

        <p style={{ color: "var(--color-ink-muted)", maxWidth: "62ch", marginBottom: "1.5rem" }}>
          {closing}
        </p>
        <a
          href="#diagnostico"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0.85rem 1.5rem",
            borderRadius: "999px",
            backgroundColor: "var(--color-petrol-800)",
            color: "#fff",
            fontWeight: 600,
            textDecoration: "none",
            minHeight: "48px",
          }}
        >
          {button}
        </a>
      </div>
    </section>
  );
}
