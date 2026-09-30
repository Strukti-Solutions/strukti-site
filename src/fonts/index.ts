import { Inter } from "next/font/google";

// next/font faz o download em tempo de build e auto-hospeda o arquivo:
// nenhuma requisição externa acontece em tempo de execução.
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
