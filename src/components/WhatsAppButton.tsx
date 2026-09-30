import { siteConfig } from "@/config/site";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

type WhatsAppButtonProps = {
  message: string;
  children: React.ReactNode;
  variant?: "solid" | "outline";
  className?: string;
};

export function WhatsAppButton({
  message,
  children,
  variant = "solid",
  className,
}: WhatsAppButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.85rem 1.5rem",
    borderRadius: "999px",
    fontWeight: 600,
    fontSize: "1rem",
    textDecoration: "none",
    minHeight: "48px",
    border: "2px solid var(--color-whatsapp)",
  };

  const variantStyle: React.CSSProperties =
    variant === "solid"
      ? { backgroundColor: "var(--color-whatsapp)", color: "#fff" }
      : { backgroundColor: "transparent", color: "var(--color-whatsapp)" };

  return (
    <a
      href={siteConfig.whatsapp.linkWithMessage(message)}
      target="_blank"
      rel="noopener noreferrer"
      style={{ ...baseStyle, ...variantStyle }}
      className={className}
    >
      <WhatsAppIcon />
      {children}
    </a>
  );
}
