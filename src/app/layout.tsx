import type { Metadata } from "next";
import { inter } from "@/fonts";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
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
