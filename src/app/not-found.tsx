import type { Metadata } from "next";
import Link from "next/link";
import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const metadata: Metadata = {
  title: `${landingContent.notFound.title} | ${landingContent.seo.ogSiteName}`,
};

export default function NotFound() {
  const { title, homeLink } = landingContent.notFound;

  return (
    <main id="conteudo-principal" className="section surface-paper">
      <div className="container">
        <h1 className="section-title">{title}</h1>
        <div className="section-actions">
          <Link href="/" className="btn btn--outline">
            {homeLink}
          </Link>
          <WhatsAppButton message={landingContent.whatsappMessages.general}>
            {landingContent.header.whatsappButton}
          </WhatsAppButton>
        </div>
      </div>
    </main>
  );
}
