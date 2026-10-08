import { createHmac, timingSafeEqual } from "node:crypto";
import type { BancadaConfig } from "./config";

/**
 * Duas portas de entrada:
 * - aplicativo da câmera / automação: `BANCADA_TOKEN` no cabeçalho
 *   `Authorization: Bearer …` ou na URL (`?token=…`), porque muitos apps
 *   não deixam configurar cabeçalho. Na URL o token pode parar em log:
 *   trocar o token ao fim dos testes.
 * - pessoas, na página: `BANCADA_SENHA` vira um cookie httpOnly com o HMAC
 *   da senha (nunca a senha em si). Trocar a senha derruba as sessões.
 */
export const COOKIE_SESSAO = "bancada_sessao";
export const DURACAO_SESSAO_S = 12 * 60 * 60;

export function iguais(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function tokenDaRequisicao(request: Request): string | null {
  const header = request.headers.get("authorization");
  const bearer = header?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (bearer) return bearer;
  return new URL(request.url).searchParams.get("token");
}

export function tokenValido(request: Request, config: BancadaConfig): boolean {
  const token = tokenDaRequisicao(request);
  return token !== null && iguais(token, config.token);
}

export function valorSessao(config: BancadaConfig): string {
  return createHmac("sha256", config.senha).update("bancada-sessao-v1").digest("base64url");
}

function lerCookie(request: Request, nome: string): string | null {
  const cookies = request.headers.get("cookie") ?? "";
  for (const parte of cookies.split(";")) {
    const [k, ...v] = parte.trim().split("=");
    if (k === nome) return v.join("=");
  }
  return null;
}

export function sessaoValida(request: Request, config: BancadaConfig): boolean {
  const valor = lerCookie(request, COOKIE_SESSAO);
  return valor !== null && iguais(valor, valorSessao(config));
}

/** Para a página (Server Component), que lê o cookie pelo `cookies()` do Next. */
export function sessaoValidaPorValor(valor: string | undefined, config: BancadaConfig): boolean {
  return valor !== undefined && iguais(valor, valorSessao(config));
}
