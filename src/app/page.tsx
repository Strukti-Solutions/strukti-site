import { siteConfig } from "@/config/site";
import { Header } from "@/components/Header";
import { TopBar } from "@/components/TopBar";
import { Hero } from "@/components/sections/Hero";
import { HeroVideo } from "@/components/sections/HeroVideo";
import { Problemas } from "@/components/sections/Problemas";
import { ComoResolvemos } from "@/components/sections/ComoResolvemos";
import { OQueJaFizemos } from "@/components/sections/OQueJaFizemos";
import { Diagnostico } from "@/components/sections/Diagnostico";
import { Equipe } from "@/components/sections/Equipe";
import { Faq } from "@/components/sections/Faq";
import { Rodape } from "@/components/sections/Rodape";

export default function Home() {
  // A barra do topo e o hero mudam juntos (ver siteConfig.heroVariant).
  const videoHero = siteConfig.heroVariant === "video";

  return (
    <>
      {videoHero ? <TopBar /> : <Header />}
      <main id="conteudo-principal">
        {videoHero ? <HeroVideo /> : <Hero />}
        <Problemas />
        <ComoResolvemos />
        <OQueJaFizemos />
        <Diagnostico />
        <Equipe />
        <Faq />
      </main>
      <Rodape />
    </>
  );
}
