import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Palco do produto (MASTER §8.13): fundo escuro, luz de estúdio e o objeto. */
export function Palco({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("palco", className)}>
      <div className="palco__luz" aria-hidden="true" />
      <div className="palco__conteudo">{children}</div>
    </div>
  );
}
