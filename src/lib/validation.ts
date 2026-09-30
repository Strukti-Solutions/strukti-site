import { z } from "zod";

export const PROBLEM_MAX_LENGTH = 1000;

const whatsappPattern = /^[\d()+\-\s]{8,20}$/;

export const diagnosticoFormSchema = z.object({
  name: z.string().trim().min(1, "Escreva o seu nome.").max(120, "Nome muito longo."),
  company: z
    .string()
    .trim()
    .min(1, "Escreva o nome da empresa.")
    .max(150, "Nome da empresa muito longo."),
  whatsapp: z
    .string()
    .trim()
    .min(1, "Informe o seu WhatsApp.")
    .refine((value) => whatsappPattern.test(value), {
      message: "Confira o número: ele precisa ter o DDD e o telefone completo.",
    }),
  problem: z
    .string()
    .trim()
    .min(1, "Conte em poucas palavras qual é o problema.")
    .max(PROBLEM_MAX_LENGTH, `Use no máximo ${PROBLEM_MAX_LENGTH} caracteres.`),
  consent: z.literal(true, {
    error: "Para enviar, marque que você concorda com o uso dos dados.",
  }),
  // Honeypot: campo invisível para o usuário real, com um nome que não
  // corresponde a nenhum autocomplete conhecido do navegador. Aceita
  // qualquer valor aqui; é a rota de API que decide o que fazer quando ele
  // vem preenchido (ver route.ts).
  codigoParceiro: z.string().max(200).optional().default(""),
});

export type DiagnosticoFormInput = z.infer<typeof diagnosticoFormSchema>;
