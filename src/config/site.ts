/**
 * Peça de fundo do hero em uso. Trocar o visual é mudar este valor — ver
 * README, "Como trocar o visual do hero" — sem mexer no HeroContent nem no
 * resto da página.
 */
export type HeroVisual = "blackhole" | "static";

export const siteConfig = {
  brand: "Strukti Soluções",
  heroVisual: "blackhole" as HeroVisual,
  whatsapp: {
    number: "+55 83 99968-3670",
    link: "https://wa.me/5583999683670",
    linkWithMessage: (message: string) =>
      `https://wa.me/5583999683670?text=${encodeURIComponent(message)}`,
  },
  email: "struktisolutions@gmail.com",
  team: [
    { name: "Kauã Bruno", initials: "KB" },
    { name: "Gustavo Fernandes", initials: "GF" },
    { name: "Antonio Meira", initials: "AM" },
    { name: "Thiago Guedes", initials: "TG" },
  ],
  // Versão do aviso de privacidade em vigor. Muda sempre que o texto do
  // aviso mudar, para registrar qual versão a pessoa aceitou (LGPD, art. 8º).
  privacyPolicyVersion: "2026-09-30",
} as const;

export type TeamMember = (typeof siteConfig.team)[number];
