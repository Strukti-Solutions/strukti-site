"use client";

/**
 * Origem: 21st.dev, componente "Container Scroll Animation" (autor
 * Aceternity / manuarora700), https://21st.dev/@manuarora700/components/container-scroll-animation
 *
 * RISCO DE LICENÇA EM ABERTO (checar com o Claudinho/cliente antes de
 * publicar): o código veio da API do 21st.dev, sob a cota diária do plano
 * gratuito (sem sinalização de bloqueio/pagamento). Mas a mesma peça, na
 * página oficial https://ui.aceternity.com/components/container-scroll-animation,
 * aparece listada entre os componentes pagos ("All-Access", pagamento
 * único) — não na seção "Free" do site da Aceternity. Nenhuma das duas
 * páginas publica o texto de uma licença (MIT ou outra). Ou seja: não dá
 * para afirmar que o uso comercial deste código está liberado só por ele
 * ter sido obtido pela 21st.dev. Se o grupo (ou o cliente) já tiver acesso
 * "All-Access" da Aceternity, ou se a Aceternity confirmar o uso por
 * e-mail, registrar aqui; caso contrário, considerar refazer este efeito
 * do zero (a técnica — scroll-linked rotateX/scale/translateY — não é
 * protegida, só esta implementação específica).
 *
 * Adaptado para este projeto:
 * - framer-motion → motion/react (ADR-002);
 * - tipos estritos (sem `any`);
 * - uma árvore só (sem ramo condicional por prefers-reduced-motion): a
 *   redução de movimento é só CSS, via `motion-reduce:` do Tailwind, para
 *   que o HTML do servidor e o do cliente sejam idênticos (ramo condicional
 *   por `useReducedMotion()` — que vem `null` no servidor e só resolve no
 *   1º render do cliente — causava erro de hidratação: o React descartava o
 *   HTML do servidor e renderizava tudo de novo, com salto de layout);
 * - cores do tema (var(--color-petrol-*) / var(--color-surface-alt)) no
 *   lugar dos valores fixos (#222222, #6C6C6C, gray) do componente original;
 * - cartão com proporção 16:9 abaixo de `md` (a altura fixa do original
 *   cortava o vídeo no celular); acima de `md`, mantém a altura fixa original;
 * - sem a imagem de exemplo da aceternity.com — este componente só define o
 *   efeito, o conteúdo é passado por quem o usa.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useScroll, useTransform, type MotionStyle, type MotionValue } from "motion/react";

const CARD_SHADOW =
  "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003";

interface ContainerScrollProps {
  titleComponent: ReactNode;
  children: ReactNode;
}

export function ContainerScroll({ titleComponent, children }: ContainerScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const scaleRange: [number, number] = isMobile ? [0.7, 0.9] : [1.05, 1];

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleRange);
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-[60rem] items-center justify-center p-2 motion-reduce:h-auto md:h-[80rem] md:p-20 md:motion-reduce:h-auto"
    >
      <div className="relative w-full py-10 md:py-40" style={{ perspective: "1000px" }}>
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
}

interface HeaderProps {
  translate: MotionValue<number>;
  titleComponent: ReactNode;
}

function Header({ translate, titleComponent }: HeaderProps) {
  const style: MotionStyle = { translateY: translate };
  return (
    <motion.div style={style} className="mx-auto max-w-5xl text-center motion-reduce:transform-none!">
      {titleComponent}
    </motion.div>
  );
}

interface CardProps {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: ReactNode;
}

function Card({ rotate, scale, children }: CardProps) {
  const style: MotionStyle = {
    rotateX: rotate,
    scale,
    boxShadow: CARD_SHADOW,
  };

  return (
    <motion.div
      style={style}
      className="mx-auto -mt-12 aspect-video h-auto w-full max-w-5xl rounded-[30px] border-4 border-[var(--color-petrol-600)] bg-[var(--color-petrol-900)] p-2 shadow-2xl motion-reduce:transform-none! md:aspect-auto md:h-[40rem] md:p-6"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-[var(--color-surface-alt)] md:p-4">
        {children}
      </div>
    </motion.div>
  );
}
