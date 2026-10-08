import { NextResponse } from "next/server";
import { autorizado, contexto, dadosDoClipe, erroDoR2, naoAutorizado, naoEncontrado } from "@/lib/bancada/api";
import { montarChave, novoId } from "@/lib/bancada/chave";
import { VALIDADE_UPLOAD_S } from "@/lib/bancada/r2";

/**
 * Envio em duas etapas, passo 1: devolve uma URL assinada para o cliente
 * subir o vídeo direto no R2 (sem passar pelo servidor, sem limite de
 * tamanho do corpo). Passo 2: PUT do arquivo nessa URL. Passo 3:
 * POST /api/bancada/confirmar com a `chave`.
 *
 * Os dados do clipe vêm no JSON do corpo ou na query (quadra, camera,
 * botao, apertadoEm, origem).
 */
export async function POST(request: Request) {
  const ctx = contexto();
  if (!ctx) return naoEncontrado();
  if (!autorizado(request, ctx, "envio")) return naoAutorizado();

  const query = new URL(request.url).searchParams;
  let json: Record<string, unknown> = {};
  if ((request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    try {
      const lido: unknown = await request.json();
      if (lido && typeof lido === "object") json = lido as Record<string, unknown>;
    } catch {
      return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
    }
  }
  const ler = (nome: string) => {
    const v = json[nome];
    return typeof v === "string" || typeof v === "number" ? String(v) : query.get(nome);
  };

  const dados = dadosDoClipe(ler, "automacao");
  const chave = montarChave(dados, novoId());
  try {
    return NextResponse.json({
      chave,
      urlUpload: await ctx.r2.urlUpload(chave),
      metodo: "PUT",
      cabecalhos: { "content-type": "video/mp4" },
      validadeSegundos: VALIDADE_UPLOAD_S,
      confirmar: "/api/bancada/confirmar",
    });
  } catch (error) {
    return erroDoR2(error);
  }
}
