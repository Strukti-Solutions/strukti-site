import type { Metadata, Viewport } from "next";
import { geologica } from "@/fonts";
import { landingContent } from "@/content/landing";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import "./globals.css";

const { title, description, ogSiteName, ogTitle, ogDescription } = landingContent.seo;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
