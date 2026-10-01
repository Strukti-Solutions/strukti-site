import { Geologica } from "next/font/google";

// next/font faz o download em tempo de build e auto-hospeda o arquivo:
// nenhuma requisição externa acontece em tempo de execução.
// Geologica variável (wght 100–900) com o eixo SHRP, que corta as
// terminações no ângulo do hexágono do logo (design system v2, ADR-006).
export const geologica = Geologica({
  subsets: ["latin"],
  axes: ["SHRP"],
  display: "swap",
  variable: "--font-geologica",
});
