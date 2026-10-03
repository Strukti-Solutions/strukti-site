"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { landingContent } from "@/content/landing";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { motion } from "motion/react";
import { useTapHover } from "@/lib/motion";

/** Controles que o botão flutuante nunca pode cobrir. */
const FOCUSABLE =
  'a[href], button, input:not([type="hidden"]), select, textarea, summary, video[controls], [tabindex]:not([tabindex="-1"])';

function overlaps(a: DOMRect, b: DOMRect) {
  return (
    a.width > 0 &&
    a.height > 0 &&
    b.width > 0 &&
    b.height > 0 &&
    a.left < b.right &&
    b.left < a.right &&
    a.top < b.bottom &&
    b.top < a.bottom
  );
}

/**
 * Botão flutuante do WhatsApp (MASTER §8.12). Some — `inert` + visibility
 * hidden, fora do Tab e do leitor de tela — enquanto:
 * - algum elemento marcado com `data-hides-fab` está na tela (hoje: o hero,
 *   que já tem dois botões de WhatsApp, o vídeo do portfólio, o cartão do
 *   formulário e o rodapé, que também têm link de WhatsApp); ou
 * - a caixa dele cruza a de qualquer controle focável (nunca cobre um
 *   botão, campo, link ou controle de vídeo).
 *
 * Some na hora e só volta com fade (globals.css): nunca fica "sumindo" por
 * cima do que acabou de chegar embaixo dele.
 *
 * Começa oculto no servidor e no 1º render do cliente (o hero está na tela
 * ao carregar), então não há divergência de hidratação nem pisca. Sem
 * JavaScript, fica oculto. No hero "classic", o botão do cabeçalho continua
 * lá; no hero "video", abaixo de 75em (1200 px) o menu da barra não abre sem
 * JavaScript, e o WhatsApp fica no botão principal do hero.
 */
export function FloatingWhatsApp() {
  const { desktopLabel, accessibleName } = landingContent.floatingWhatsapp;
  const tapHover = useTapHover();
  const fabRef = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fab = fabRef.current;
    if (!fab) return;

    const markersOnScreen = new Set<Element>();
    let frame = 0;
    let trailing = 0;

    const coversControl = () => {
      const box = fab.getBoundingClientRect();
      return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).some(
        (el) => el !== fab && !fab.contains(el) && overlaps(box, el.getBoundingClientRect()),
      );
    };

    // Esconder é sempre seguro, então acontece na hora. Mostrar só depois de
    // conferir com o quadro assentado: o motion aplica o tilt do cartão do
    // vídeo dentro do próprio quadro, por isso a conferência espera dois rAF
    // e se repete quando a rolagem para.
    const settledCheck = () => {
      frame = 0;
      setVisible(markersOnScreen.size === 0 && !coversControl());
    };
    const schedule = () => {
      if (markersOnScreen.size > 0 || coversControl()) setVisible(false);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(settledCheck);
      });
      window.clearTimeout(trailing);
      trailing = window.setTimeout(settledCheck, 150);
    };

    const markers = document.querySelectorAll("[data-hides-fab]");
    const observer =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (entry.isIntersecting) markersOnScreen.add(entry.target);
                else markersOnScreen.delete(entry.target);
              }
              schedule();
            },
            // Um marcador conta como "na tela" 200 px antes de entrar por
            // baixo: o FAB já está oculto quando ele chega à faixa do botão.
            { rootMargin: "0px 0px 200px 0px" },
          )
        : null;
    markers.forEach((marker) => observer?.observe(marker));
    // Sem marcador na página (ex.: /privacidade), o IO não dispara: confere já.
    if (markers.length === 0 || !observer) schedule();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("focusin", schedule);

    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(trailing);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("focusin", schedule);
    };
  }, []);

  return (
    <motion.a
      ref={fabRef}
      href={siteConfig.whatsapp.linkWithMessage(landingContent.whatsappMessages.general)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={accessibleName}
      className="fab-whatsapp"
      data-visible={visible ? "true" : "false"}
      inert={!visible}
      {...tapHover}
    >
      <WhatsAppIcon size={24} />
      <span className="floating-whatsapp-label">{desktopLabel}</span>
    </motion.a>
  );
}
