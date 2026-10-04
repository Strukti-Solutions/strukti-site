"use client";

import type { ReactNode } from "react";
import { selectInterest, type Interest } from "@/lib/interest";

/** Link para o formulário com o interesse já marcado (sem JavaScript, só rola até lá). */
export function InterestLink({ interest, className, children }: { interest: Interest; className?: string; children: ReactNode }) {
  return (
    <a href="#contato" className={className} onClick={() => selectInterest(interest)}>
      {children}
    </a>
  );
}
