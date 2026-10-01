"use client";

import { useEffect, useId, useRef, useState, type FocusEvent } from "react";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { landingContent } from "@/content/landing";
import { WhatsAppButton } from "@/components/WhatsAppButton";

/**
 * Barra do topo do hero "video" (MASTER §8.3.1): uma aba escura presa no
 * topo da tela, com o canto de baixo cortado no ângulo do hexágono do logo.
 * A partir de 1024 px mostra marca, links e WhatsApp numa linha; abaixo
 * disso, marca e botão "Menu", que abre um painel com os links e o WhatsApp.
 *
 * A árvore é uma só em qualquer largura: o que muda é o CSS (seção "Barra do
 * topo" de globals.css). O botão vem antes do painel no DOM, para o Tab
 * seguir do botão para os links quando o painel abre.
 */
export function TopBar() {
  const { nav, whatsappButton, menuButton } = landingContent.header;
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

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
    const wide = typeof window.matchMedia === "function" ? window.matchMedia("(min-width: 1024px)") : null;
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
      onBlur={closeWhenFocusLeaves}
    >
      <div className="topbar__tab">
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
                <a href={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <WhatsAppButton message={landingContent.whatsappMessages.general} compact className="topbar__whatsapp">
            {whatsappButton}
          </WhatsAppButton>
        </nav>
      </div>
    </header>
  );
}
