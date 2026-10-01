"use client";

import { siteConfig } from "@/config/site";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { motion } from "motion/react";
import { useTapHover } from "@/lib/motion";
import { cn } from "@/lib/utils";

type WhatsAppButtonProps = {
  message: string;
  children: React.ReactNode;
  /** Versão de 44 px para o cabeçalho (MASTER §8.3). */
  compact?: boolean;
  className?: string;
};

/** Botão que abre o WhatsApp: sempre o de maior destaque (MASTER §8.1). */
export function WhatsAppButton({ message, children, compact = false, className }: WhatsAppButtonProps) {
  const tapHover = useTapHover();

  return (
    <motion.a
      href={siteConfig.whatsapp.linkWithMessage(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("btn btn--whatsapp", compact && "btn--compact", className)}
      {...tapHover}
    >
      <WhatsAppIcon size={compact ? 18 : 20} />
      {children}
    </motion.a>
  );
}
