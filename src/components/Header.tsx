import { siteConfig } from "@/config/site";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export function Header() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          paddingBlock: "0.85rem",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--color-petrol-900)" }}>
          {siteConfig.brand}
        </span>
        <WhatsAppButton message="Olá! Vim pelo site da Strukti Soluções e gostaria de conversar.">
          WhatsApp
        </WhatsAppButton>
      </div>
    </header>
  );
}
