import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { geologica } from "@/fonts";
import { landingContent } from "@/content/landing";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { getSiteUrl } from "@/lib/siteUrl";
import "./globals.css";

const { title, description, ogSiteName, ogTitle, ogDescription } = landingContent.seo;

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title,
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    siteName: ogSiteName,
    title: ogTitle,
    description: ogDescription,
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description: ogDescription,
  },
};

// Cor da barra do navegador no celular: o "espaço" do cabeçalho
// (design-system/strukti-solucoes/MASTER.md, §2).
export const viewport: Viewport = {
  themeColor: "#08121d",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Só ler o nonce (sem usá-lo em lugar nenhum) já basta: é o sinal que o
  // Next.js App Router procura para aplicar, ele mesmo, o nonce do
  // Content-Security-Policy aos <script> que gera (guia oficial do Next.js
  // para CSP). Sem isto, o CSP com 'strict-dynamic' do middleware bloqueia
  // todo o JS da página — só o <video controls> nativo continua funcionando.
  await headers();

  return (
    <html lang="pt-BR" className={geologica.variable}>
      <body>
        <a href="#conteudo-principal" className="skip-link">
          {landingContent.header.skipLink}
        </a>
        {children}
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
