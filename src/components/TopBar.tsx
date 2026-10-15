"use client";

import { useEffect, useId, useRef, useState, type FocusEvent } from "react";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import type { LinkBancada } from "@/lib/bancada/link";

/**
 * A partir daqui a barra mostra os links e o WhatsApp numa linha (TB2). Em
 * `em`, para acompanhar a fonte do navegador: 75em = 1200 px com a fonte
 * padrão, a largura em que o grupo ainda cabe no container com o espaçamento
 * de texto do usuário (WCAG 1.4.12). O globals.css (seção "Barra do topo" e
 * a regra do FAB) usa o mesmo valor; o TopBar.test.tsx confere.
 */
export const TOPBAR_WIDE_QUERY = "(min-width: 75em)";

/**
 * Barra do topo do hero "video" (MASTER §8.3.1): uma faixa escura fixa, de
 * borda a borda da janela, com a junta de 3 px embaixo. O conteúdo fica no
 * container do site, alinhado com as seções. A partir de 75em (1200 px) mostra
 * marca, links e WhatsApp numa linha; abaixo disso, marca e botão "Menu", que
 * abre um painel com os links e o WhatsApp, preso embaixo da barra.
 *
 * A árvore é uma só em qualquer largura: o que muda é o CSS (seção "Barra do
 * topo" de globals.css). O botão vem antes do painel no DOM, para o Tab
 * seguir do botão para os links quando o painel abre.
 */
export function TopBar({ linkBancada }: { linkBancada?: LinkBancada } = {}) {
  const { nav, whatsappButton, menuButton } = landingContent.header;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // A barra recolhe numa cápsula ao rolar, e o link do menu da seção visível
  // ganha aria-current (docs/superpowers/specs/2026-10-15-hero-triangulo-3d-design.md,
  // N1/N2). O estado parte sempre de "não rolou" (servidor e 1º render do
  // cliente iguais): não é preferência de movimento, é posição de rolagem,
  // que começa em 0 nos dois.
  useEffect(() => {
    const targets = nav.map((item) => item.href.slice(1));

    const computeActive = () => {
      const offset = 96;
      const scrollPos = window.scrollY + offset;
      let current: string | null = null;
      for (const id of targets) {
        const element = document.getElementById(id);
        if (element && element.offsetTop <= scrollPos) current = id;
      }
      return current;
    };

    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const current = computeActive();
      setActiveHref(current ? `#${current}` : null);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [nav]);

  // Fecha com Esc (devolvendo o foco ao botão), com clique fora e quando a
  // tela passa para a largura em que os links ficam sempre à mostra.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const wide = typeof window.matchMedia === "function" ? window.matchMedia(TOPBAR_WIDE_QUERY) : null;
    const onWide = () => {
      if (wide?.matches) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    wide?.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      wide?.removeEventListener("change", onWide);
    };
  }, [open]);

  // Fecha quando o foco sai da barra (Tab depois do último item, Shift+Tab
  // antes da marca): o painel é fixo e cobriria o controle focado (WCAG
  // 2.4.11; achado da Crivo, revisão HR1). Sem destino (relatedTarget null),
  // é clique fora ou troca de janela: o pointerdown acima cuida do clique.
  const closeWhenFocusLeaves = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && !event.currentTarget.contains(next)) setOpen(false);
  };

  return (
    <header
      ref={headerRef}
      className="topbar"
      data-open={open ? "true" : "false"}
      data-scrolled={scrolled ? "true" : "false"}
      onBlur={closeWhenFocusLeaves}
    >
      <div className="container topbar__bar">
        <a href="#inicio" className="topbar__brand">
          <Image
            src="/brand/strukti-assinatura-horizontal-fundo-escuro.svg"
            alt={siteConfig.brand}
            width={134}
            height={32}
            unoptimized
            priority
          />
        </a>

        <button
          ref={toggleRef}
          type="button"
          className="topbar__toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="topbar__toggle-icon" aria-hidden="true" />
          {menuButton}
        </button>

        <nav id={panelId} aria-label="Principal" className="topbar__nav">
          <ul className="topbar__links">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={activeHref === item.href ? "true" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          {/* Provisório: aba de testes do replay (docs/bancada/README.md). */}
          {linkBancada && (
            <a href={linkBancada.href} className="btn btn--compact topbar__bancada" onClick={() => setOpen(false)}>
              {linkBancada.label}
            </a>
          )}
          <WhatsAppButton message={landingContent.whatsappMessages.general} compact className="topbar__whatsapp">
            {whatsappButton}
          </WhatsAppButton>
        </nav>
      </div>
    </header>
  );
}
