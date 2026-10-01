import Image from "next/image";
import { siteConfig } from "@/config/site";
import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export function Header() {
  const { nav, whatsappButton } = landingContent.header;

  return (
    <header className="site-header surface-space">
      <div className="container site-header__bar">
        <a href="#inicio" className="site-header__brand">
          <Image
            src="/brand/strukti-assinatura-horizontal-fundo-escuro.svg"
            alt={siteConfig.brand}
            width={134}
            height={32}
            unoptimized
            priority
          />
        </a>

        <nav aria-label="Principal" className="site-header__nav">
          {nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <WhatsAppButton message={landingContent.whatsappMessages.general} compact>
          {whatsappButton}
        </WhatsAppButton>
      </div>
    </header>
  );
}
