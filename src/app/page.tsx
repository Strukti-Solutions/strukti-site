import { Header } from "@/components/Header";
import { Hero } from "@/components/sections/Hero";
import { Problemas } from "@/components/sections/Problemas";
import { ComoResolvemos } from "@/components/sections/ComoResolvemos";
import { OQueJaFizemos } from "@/components/sections/OQueJaFizemos";
import { Diagnostico } from "@/components/sections/Diagnostico";
import { Equipe } from "@/components/sections/Equipe";
import { Faq } from "@/components/sections/Faq";
import { Rodape } from "@/components/sections/Rodape";

export default function Home() {
  return (
    <>
      <Header />
      <main id="conteudo-principal">
        <Hero />
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
