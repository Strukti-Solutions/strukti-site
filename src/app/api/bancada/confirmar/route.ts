import { NextResponse } from "next/server";
import { autorizado, contexto, erroDoR2, naoAutorizado, naoEncontrado } from "@/lib/bancada/api";
import { chaveValida } from "@/lib/bancada/chave";

/**
 * Envio em duas etapas, passo 3: confere no R2 que o arquivo chegou.
 * Só depois de um 200 aqui o cliente pode apagar a cópia local.
 */
export async function POST(request: Request) {
  const ctx = contexto();
  if (!ctx) return naoEncontrado();
  if (!autorizado(request, ctx, "envio")) return naoAutorizado();

  let chave: unknown;
  try {
    chave = ((await request.json()) as { chave?: unknown })?.chave;
  } catch {
    chave = new URL(request.url).searchParams.get("chave");
  }
  if (typeof chave !== "string" || !chaveValida(chave)) {
    return NextResponse.json({ erro: "Chave inválida." }, { status: 400 });
  }

  try {
    const tamanho = await ctx.r2.tamanho(chave);
    if (tamanho === null) {
      return NextResponse.json({ ok: false, erro: "O arquivo ainda não chegou no R2." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, chave, tamanho });
  } catch (error) {
    return erroDoR2(error);
  }
}
