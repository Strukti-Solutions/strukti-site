"use client";

/*
 * PRÉVIA (13/10/2026): as 3 opções do hero de marca (landing-copy v2.2 §2).
 * O servidor e o 1º render do cliente mostram sempre a opção B (a padrão), e
 * só depois de montar a chave ?hero=a ou ?hero=c troca o texto: a página
 * continua estática (ADR-008) e a hidratação não diverge (ADR-004). As
 * opções A e C servem só para comparar; no produto vai só a escolhida.
 */
import { useEffect, useState } from "react";
import { landingContent } from "@/content/landing";

export type HeroOpcao = "a" | "b" | "c";

export function useHeroOpcao(): HeroOpcao {
  const [opcao, setOpcao] = useState<HeroOpcao>("b");
  useEffect(() => {
    const valor = new URLSearchParams(window.location.search).get("hero");
    if (valor === "a" || valor === "c") setOpcao(valor);
  }, []);
  return opcao;
}

/** Sobretítulo, título (H1) e frase do hero, na opção da URL. */
export function HeroTextos() {
  const { eyebrow, headline, body } = landingContent.heroOpcoes[useHeroOpcao()];
  return (
    <>
      <p className="hero-estudio__eyebrow">{eyebrow}</p>
      <h1 id="hero-title" className="hero-estudio__title">
        {headline}
      </h1>
      <p className="lead">{body}</p>
    </>
  );
}

/** Introdução da Equipe: com a opção C do hero, volta à da v2.0 (sem repetir o título do hero). */
export function EquipeIntro() {
  const opcao = useHeroOpcao();
  const { intro, introComHeroC } = landingContent.equipe;
  return <p className="lead">{opcao === "c" ? introComHeroC : intro}</p>;
}
