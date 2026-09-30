import type { Metadata } from "next";
import { inter } from "@/fonts";
import { siteConfig } from "@/config/site";
import "./globals.css";

const title = `${siteConfig.brand} — Software sob medida para distribuidoras e indústrias`;
const description =
  "Aplicativos sob medida para distribuidoras e indústrias pequenas: clientes, pedidos e rotas de entrega organizados num só lugar. Diagnóstico gratuito.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: ["/video/brag.jpg"],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/video/brag.jpg"],
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
          Pular para o conteúdo principal
        </a>
        {children}
      </body>
    </html>
  );
}
