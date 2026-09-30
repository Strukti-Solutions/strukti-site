import { siteConfig } from "@/config/site";

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

function WhatsAppIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.38A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.18c-1.6 0-3.13-.43-4.46-1.24l-.32-.19-3.12.82.83-3.04-.2-.31a8.15 8.15 0 0 1-1.27-4.4c0-4.5 3.66-8.16 8.16-8.16 4.5 0 8.16 3.66 8.16 8.16 0 4.5-3.66 8.16-8.16 8.16Zm4.48-6.1c-.25-.12-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.12-.16.25-.63.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42-.14 0-.31-.02-.47-.02-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.16 1.73 2.64 4.19 3.7.59.25 1.05.4 1.4.52.59.19 1.12.16 1.55.1.47-.07 1.45-.59 1.65-1.17.2-.57.2-1.06.14-1.17-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}
