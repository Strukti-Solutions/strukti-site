import { NextResponse } from "next/server";
import { lerConfigBancada, type BancadaConfig } from "./config";
import { criarR2, ErroR2, type R2 } from "./r2";
import { sessaoValida, tokenValido } from "./auth";
import { lerHorario, lerOrigem, type DadosClipe, type Origem } from "./chave";

/** Respostas e checagens comuns às rotas `/api/bancada/*`. */
export const naoEncontrado = () => NextResponse.json({ erro: "Não encontrado." }, { status: 404 });
export const naoAutorizado = () =>
  NextResponse.json(
    { erro: "Não autorizado. Envie o token em Authorization: Bearer <token> ou em ?token=." },
    { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="bancada"' } },
  );

export interface Contexto {
  config: BancadaConfig;
  r2: R2;
}

/** null quando a bancada está desligada (falta variável de ambiente). */
export function contexto(): Contexto | null {
  const config = lerConfigBancada();
  return config ? { config, r2: criarR2(config.r2) } : null;
}

export type Acesso = "envio" | "equipe";

/**
 * "envio": token do app/automação OU sessão da equipe (upload manual na página).
 * "equipe": só a sessão (listar e apagar).
 */
export function autorizado(request: Request, ctx: Contexto, acesso: Acesso): boolean {
  if (sessaoValida(request, ctx.config)) return true;
  return acesso === "envio" && tokenValido(request, ctx.config);
}

/** Lê quadra/câmera/botão/horário/origem de um objeto qualquer (query, form ou JSON). */
export function dadosDoClipe(ler: (nome: string) => string | null | undefined, origemPadrao: Origem): DadosClipe {
  return {
    quadra: ler("quadra") ?? "",
    camera: ler("camera") ?? "",
    botao: ler("botao") ?? "",
    apertadoEm: lerHorario(ler("apertadoEm") ?? ler("horario")),
    origem: lerOrigem(ler("origem"), origemPadrao),
  };
}

export function erroDoR2(error: unknown) {
  if (error instanceof ErroR2) {
    console.error(`Bancada: ${error.message}`);
    return NextResponse.json({ erro: "O armazenamento (R2) recusou a operação. Confira as chaves e o bucket." }, { status: 502 });
  }
  throw error;
}
