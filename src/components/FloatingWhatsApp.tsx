"use client";

import { siteConfig } from "@/config/site";
import { landingContent } from "@/content/landing";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { motion } from "motion/react";
import { useTapHover } from "@/lib/motion";

export function FloatingWhatsApp() {
  const { desktopLabel, accessibleName } = landingContent.floatingWhatsapp;
  const tapHover = useTapHover();

  return (
    <motion.a
      href={siteConfig.whatsapp.linkWithMessage(landingContent.whatsappMessages.general)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={accessibleName}
      className="fab-whatsapp"
      {...tapHover}
    >
      <WhatsAppIcon size={24} />
      <span className="floating-whatsapp-label">{desktopLabel}</span>
    </motion.a>
  );
}
