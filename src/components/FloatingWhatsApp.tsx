import { siteConfig } from "@/config/site";
import { landingContent } from "@/content/landing";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

export function FloatingWhatsApp() {
  const { desktopLabel, accessibleName } = landingContent.floatingWhatsapp;

  return (
    <a
      href={siteConfig.whatsapp.linkWithMessage(landingContent.whatsappMessages.general)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={accessibleName}
      style={{
        position: "fixed",
        right: "1.25rem",
        bottom: "1.25rem",
        zIndex: 60,
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.9rem",
        borderRadius: "999px",
        backgroundColor: "var(--color-whatsapp)",
        color: "#fff",
        textDecoration: "none",
        boxShadow: "0 4px 14px rgba(11, 46, 56, 0.35)",
        minWidth: "48px",
        minHeight: "48px",
        justifyContent: "center",
      }}
    >
      <WhatsAppIcon size={22} />
      <span className="floating-whatsapp-label">{desktopLabel}</span>
    </a>
  );
}
