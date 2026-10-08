import { NextResponse } from "next/server";
import { contexto, naoEncontrado } from "@/lib/bancada/api";
import { COOKIE_SESSAO, DURACAO_SESSAO_S, iguais, valorSessao } from "@/lib/bancada/auth";
import { isRateLimited } from "@/lib/rateLimit";

/** Formulário de senha da página `/bancada`: cria o cookie de sessão. */
export async function POST(request: Request) {
  const ctx = contexto();
  if (!ctx) return naoEncontrado();

  const destino = new URL("/bancada", request.url);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (isRateLimited(`bancada:${ip}`)) {
    destino.searchParams.set("erro", "muitas");
    return NextResponse.redirect(destino, 303);
  }

  let senha = "";
  try {
    const form = await request.formData();
    senha = String(form.get("senha") ?? "");
  } catch {
    // corpo inválido: cai no "senha incorreta"
  }

  if (!iguais(senha, ctx.config.senha)) {
    destino.searchParams.set("erro", "senha");
    return NextResponse.redirect(destino, 303);
  }

  const resposta = NextResponse.redirect(destino, 303);
  resposta.cookies.set(COOKIE_SESSAO, valorSessao(ctx.config), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DURACAO_SESSAO_S,
  });
  return resposta;
}
