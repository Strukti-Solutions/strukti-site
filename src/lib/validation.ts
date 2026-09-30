import { z } from "zod";
import { landingContent } from "@/content/landing";

export const PROBLEM_MAX_LENGTH = 1000;

const { fields, consentError } = landingContent.diagnostico.form;

const whatsappPattern = /^[\d()+\-\s]{8,20}$/;

export const diagnosticoFormSchema = z.object({
  // Limites técnicos (120/150) não vêm do texto aprovado: o input já tem
  // maxLength, então essa mensagem só apareceria num acesso direto à API.
  name: z.string().trim().min(1, fields.name.errorEmpty).max(120, "Nome muito longo."),
  company: z.string().trim().min(1, fields.company.errorEmpty).max(150, "Nome da empresa muito longo."),
  whatsapp: z
    .string()
    .trim()
    .min(1, fields.whatsapp.errorEmpty)
    .refine((value) => whatsappPattern.test(value), {
      message: fields.whatsapp.errorInvalid,
    }),
  problem: z
    .string()
    .trim()
    .min(1, fields.problem.errorEmpty)
    .max(PROBLEM_MAX_LENGTH, fields.problem.errorTooLong.replace("{max}", String(PROBLEM_MAX_LENGTH))),
  consent: z.literal(true, {
    error: consentError,
  }),
  // Honeypot: campo invisível para o usuário real, com um nome que não
  // corresponde a nenhum autocomplete conhecido do navegador. Aceita
  // qualquer valor aqui; é a rota de API que decide o que fazer quando ele
  // vem preenchido (ver route.ts).
  codigoParceiro: z.string().max(200).optional().default(""),
});

export type DiagnosticoFormInput = z.infer<typeof diagnosticoFormSchema>;
