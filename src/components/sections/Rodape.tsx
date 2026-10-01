import Image from "next/image";
import { landingContent } from "@/content/landing";
import { siteConfig } from "@/config/site";

/** Rodapé na superfície "espaço", fechando a página como o topo (MASTER §8.11). */
export function Rodape() {
  const { tagline, whatsappLabel, emailLabel, location, privacyLinkLabel } = landingContent.rodape;
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer surface-space" data-hides-fab="">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            <Image
              className="site-footer__brand"
              src="/brand/strukti-assinatura-horizontal-fundo-escuro.svg"
              alt={siteConfig.brand}
              width={117}
              height={28}
              unoptimized
            />
            <p className="site-footer__tagline">{tagline}</p>
          </div>

          <div className="site-footer__contacts">
            <p>
              {whatsappLabel}{" "}
              <a
                href={siteConfig.whatsapp.linkWithMessage(landingContent.whatsappMessages.general)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {siteConfig.whatsapp.number}
              </a>
            </p>
            <p>
              {emailLabel} <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
            </p>
            <p>{location}</p>
          </div>

          <div>
            <a href="/privacidade">{privacyLinkLabel}</a>
          </div>
        </div>

        <div className="site-footer__legal">
          <p>
            © {year} {siteConfig.brand}
          </p>
        </div>
      </div>
    </footer>
  );
}
