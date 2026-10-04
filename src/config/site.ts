/**
 * Versão do topo da página (barra do topo + hero) em uso. Trocar é mudar
 * `siteConfig.heroVariant` — ver README, "Como trocar o visual do hero":
 * - "estudio" (padrão): hero da v3 (MASTER §9.7): produto 3D em sequência
 *   de quadros guiada pela rolagem; usa a barra do topo do "video";
 * - "video": barra escura fixa de borda a borda no topo, vídeo de fundo e
 *   a palavra "Strukti" gigante (MASTER §8.3.1 e §9.6);
 * - "classic": o cabeçalho fixo e o hero com fundo trocável (MASTER
 *   §9.1–9.5), escolhido em `siteConfig.heroVisual`.
 */
export type HeroVariant = "estudio" | "video" | "classic";

/**
 * Peça de fundo do hero "classic". Trocar o visual é mudar este valor — ver
 * README, "Como trocar o visual do hero" — sem mexer no HeroContent nem no
 * resto da página.
 */
export type HeroVisual = "blackhole" | "static";

/** Um recorte do vídeo de fundo: o loop e o quadro parado do mesmo instante. */
export interface HeroVideoRendition {
  /** H.264 em MP4, sem áudio, com faststart. */
  mp4: string;
  /** Pôster (o 1º quadro do loop) em AVIF, com JPG para quem não lê AVIF. */
  posterAvif: string;
  posterJpg: string;
  width: number;
  height: number;
}

/**
 * Vídeo de fundo do hero "video", servido pelo próprio site (public/), nunca
 * de CDN externa (MASTER §9.6). `null` deixa o hero só com a base, o grão e o
 * véu, sem quebrar nada.
 */
export interface HeroVideoSource {
  /** Telas deitadas (computador, tablet e celular na horizontal). */
  landscape: HeroVideoRendition;
  /** Telas em pé (celular): recorte vertical centrado na estrada, mais leve. */
  portrait: HeroVideoRendition;
}

/** Um conjunto de quadros do hero "estudio" (MASTER §9.7). */
export interface HeroFrameSet {
  /** Quantidade de quadros: f000.avif … f(N-1).avif. */
  frames: number;
  width: number;
  height: number;
}

/**
 * Quadros do hero "estudio", gerados por scripts/hero-3d/ e servidos de
 * public/hero/sequencia/ (nunca de CDN). Os caminhos saem de
 * src/lib/heroSequence.ts (frameUrl, posterUrl).
 */
export interface HeroSequenceSource {
  desktop: HeroFrameSet;
  celular: HeroFrameSet;
}

/*
 * "Rota ao entardecer": "Aerial Footage of Truck on the Road", de K (Pexels),
 * https://www.pexels.com/video/aerial-footage-of-truck-on-the-road-9339061/
 * Licença Pexels (https://www.pexels.com/license/, conferida em 01/10/2026):
 * uso comercial livre, sem atribuição obrigatória, edição permitida. Editado
 * por nós (loop de 12 s, tom marinho, recortes): docs/hero-video-opcoes/.
 */
const ROTA_ENTARDECER: HeroVideoSource = {
  landscape: {
    mp4: "/video/hero/rota-entardecer-1920x1080.mp4",
    posterAvif: "/video/hero/rota-entardecer-1920x1080.avif",
    posterJpg: "/video/hero/rota-entardecer-1920x1080.jpg",
    width: 1920,
    height: 1080,
  },
  portrait: {
    mp4: "/video/hero/rota-entardecer-720x1280.mp4",
    posterAvif: "/video/hero/rota-entardecer-720x1280.avif",
    posterJpg: "/video/hero/rota-entardecer-720x1280.jpg",
    width: 720,
    height: 1280,
  },
};

export const siteConfig = {
  brand: "Strukti Soluções",
  heroVariant: "estudio" as HeroVariant,
  heroVisual: "blackhole" as HeroVisual,
  heroVideo: ROTA_ENTARDECER as HeroVideoSource | null,
  heroSequence: {
    desktop: { frames: 90, width: 1600, height: 1000 },
    celular: { frames: 45, width: 800, height: 900 },
  } as HeroSequenceSource,
  whatsapp: {
    number: "+55 83 99968-3670",
    link: "https://wa.me/5583999683670",
    linkWithMessage: (message: string) =>
      `https://wa.me/5583999683670?text=${encodeURIComponent(message)}`,
  },
  email: "struktisolutions@gmail.com",
  // `course` aparece logo abaixo do nome (docs/landing-copy.md v2.0, "Equipe");
  // fica com a marcação de pendência até o grupo mandar.
  team: [
    { name: "Kauã Bruno", initials: "KB", course: "[A PREENCHER: curso]" },
    { name: "Gustavo Fernandes", initials: "GF", course: "[A PREENCHER: curso]" },
    { name: "Antonio Meira", initials: "AM", course: "[A PREENCHER: curso]" },
    { name: "Thiago Guedes", initials: "TG", course: "[A PREENCHER: curso]" },
  ],
  // Versão do aviso de privacidade em vigor. Muda sempre que o texto do
  // aviso mudar, para registrar qual versão a pessoa aceitou (LGPD, art. 8º).
  privacyPolicyVersion: "2026-10-03",
} as const;

export type TeamMember = (typeof siteConfig.team)[number];
