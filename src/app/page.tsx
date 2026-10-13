import { siteConfig } from "@/config/site";
import { Header } from "@/components/Header";
import { TopBar } from "@/components/TopBar";
import { Hero } from "@/components/sections/Hero";
import { HeroVideo } from "@/components/sections/HeroVideo";
import { HeroSequence } from "@/components/sections/HeroSequence";
import { Produtos } from "@/components/sections/Produtos";
import { ChamadaHardware } from "@/components/sections/ChamadaHardware";
import { ComoResolvemos } from "@/components/sections/ComoResolvemos";
import { Equipe } from "@/components/sections/Equipe";
import { Contato } from "@/components/sections/Contato";
import { Faq } from "@/components/sections/Faq";
import { Rodape } from "@/components/sections/Rodape";
import { linkBancadaSeAtiva } from "@/lib/bancada/link";
import { FioPrototipo } from "@/components/spike/FioPrototipo";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // PRÉVIA v2.2: ?hero=a|b|c (sem a chave, a B).
  const sp = await searchParams;
  const heroOpcao = sp.hero === "a" || sp.hero === "c" ? sp.hero : "b";
  // A barra do topo e o hero mudam juntos (ver siteConfig.heroVariant).
  const variant = siteConfig.heroVariant;

  return (
    <>
      {variant === "classic" ? <Header /> : <TopBar linkBancada={linkBancadaSeAtiva()} />}
      {/* data-hero-variant: o check:browser lê daqui qual hero conferir. */}
      <main id="conteudo-principal" data-hero-variant={variant}>
        {variant === "estudio" ? <HeroSequence opcao={heroOpcao} /> : variant === "video" ? <HeroVideo /> : <Hero />}
        <Produtos />
        <ChamadaHardware />
        <ComoResolvemos />
        <Equipe heroOpcao={heroOpcao} />
        <Faq />
        <Contato />
      </main>
      <Rodape />
      {/* SPIKE [S1-A]: só com ?fio=costura ou ?fio=montagem. */}
      <FioPrototipo />
    </>
  );
}
