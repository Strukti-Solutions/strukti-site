import type { ComponentType } from "react";
import { siteConfig, type HeroVariant } from "@/config/site";
import { Header } from "@/components/Header";
import { TopBar } from "@/components/TopBar";
import { Hero } from "@/components/sections/Hero";
import { HeroVideo } from "@/components/sections/HeroVideo";
import { HeroSequence } from "@/components/sections/HeroSequence";
import { HeroExpansao } from "@/components/sections/HeroExpansao";
import { Catalogo } from "@/components/sections/Catalogo";
import { ChamadaHardware } from "@/components/sections/ChamadaHardware";
import { ComoResolvemos } from "@/components/sections/ComoResolvemos";
import { Equipe } from "@/components/sections/Equipe";
import { Contato } from "@/components/sections/Contato";
import { Faq } from "@/components/sections/Faq";
import { Rodape } from "@/components/sections/Rodape";
import { linkBancadaSeAtiva } from "@/lib/bancada/link";
import { FioPrototipo } from "@/components/spike/FioPrototipo";

/**
 * O hero de cada variante. `Record<HeroVariant, …>`: uma variante nova sem
 * hero aqui é erro de tipo, não uma página sem hero.
 */
const HERO_SECTIONS: Record<HeroVariant, ComponentType> = {
  expansao: HeroExpansao,
  estudio: HeroSequence,
  video: HeroVideo,
  classic: Hero,
};

export default function Home() {
  // A barra do topo e o hero mudam juntos (ver siteConfig.heroVariant).
  const variant = siteConfig.heroVariant;
  const HeroSection = HERO_SECTIONS[variant];

  return (
    <>
      {variant === "classic" ? <Header /> : <TopBar linkBancada={linkBancadaSeAtiva()} />}
      {/* data-hero-variant: o check:browser lê daqui qual hero conferir. */}
      <main id="conteudo-principal" data-hero-variant={variant}>
        <HeroSection />
        <Catalogo />
        <ChamadaHardware />
        <ComoResolvemos />
        <Equipe />
        <Faq />
        <Contato />
      </main>
      <Rodape />
      {/* SPIKE [S1-A]: só com ?fio=costura ou ?fio=montagem. */}
      <FioPrototipo />
    </>
  );
}
