import { siteConfig } from "@/config/site";
import { Header } from "@/components/Header";
import { TopBar } from "@/components/TopBar";
import { Hero } from "@/components/sections/Hero";
import { HeroVideo } from "@/components/sections/HeroVideo";
import { HeroSequence } from "@/components/sections/HeroSequence";
import { Problemas } from "@/components/sections/Problemas";
import { ComoResolvemos } from "@/components/sections/ComoResolvemos";
import { OQueJaFizemos } from "@/components/sections/OQueJaFizemos";
import { Contato } from "@/components/sections/Contato";
import { Equipe } from "@/components/sections/Equipe";
import { Faq } from "@/components/sections/Faq";
import { Rodape } from "@/components/sections/Rodape";

export default function Home() {
  // A barra do topo e o hero mudam juntos (ver siteConfig.heroVariant).
  const variant = siteConfig.heroVariant;

  return (
    <>
      {variant === "classic" ? <Header /> : <TopBar />}
      <main id="conteudo-principal">
        {variant === "estudio" ? <HeroSequence /> : variant === "video" ? <HeroVideo /> : <Hero />}
        <Problemas />
        <ComoResolvemos />
        <OQueJaFizemos />
        <Contato />
        <Equipe />
        <Faq />
      </main>
      <Rodape />
    </>
  );
}
