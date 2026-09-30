export const siteConfig = {
  brand: "Strukti Soluções",
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
} as const;

export type TeamMember = (typeof siteConfig.team)[number];
