import { z } from "zod";

export const diagnosticoFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(120, "Nome muito longo."),
  company: z
    .string()
    .trim()
    .min(2, "Informe o nome da empresa.")
    .max(150, "Nome da empresa muito longo."),
  whatsapp: z
    .string()
    .trim()
    .min(8, "Informe um WhatsApp válido.")
    .max(20, "Número muito longo.")
    .regex(/^[\d()+\-\s]+$/, "Use apenas números e símbolos de telefone."),
  problem: z
    .string()
    .trim()
    .min(10, "Descreva brevemente o problema (mínimo 10 caracteres).")
    .max(1000, "Descrição muito longa."),
  consent: z.literal(true, {
    error: "É necessário concordar com o aviso de privacidade.",
  }),
  // honeypot: campo invisível para o usuário real. Aceita qualquer valor aqui;
  // é a rota de API que decide o que fazer quando ele vem preenchido (ver route.ts).
  website: z.string().max(200).optional().default(""),
});

export type DiagnosticoFormInput = z.infer<typeof diagnosticoFormSchema>;
