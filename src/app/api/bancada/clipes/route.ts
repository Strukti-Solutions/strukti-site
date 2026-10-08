import { NextResponse } from "next/server";
import { autorizado, contexto, erroDoR2, naoAutorizado, naoEncontrado } from "@/lib/bancada/api";
import { chaveValida, lerChave } from "@/lib/bancada/chave";

/** Lista (com URL de leitura assinada) e apaga clipes. Só a equipe, pela sessão da página. */
export async function GET(request: Request) {
  const ctx = contexto();
  if (!ctx) return naoEncontrado();
  if (!autorizado(request, ctx, "equipe")) return naoAutorizado();

  try {
    const objetos = await ctx.r2.listar();
    const clipes = await Promise.all(
      objetos.flatMap((obj) => {
        const dados = lerChave(obj.chave);
        if (!dados) return [];
        return [
          ctx.r2.urlLeitura(obj.chave).then((url) => ({
            chave: obj.chave,
            ...dados,
            apertadoEm: dados.apertadoEm.toISOString(),
            chegouEm: obj.modificadoEm.toISOString(),
            atrasoSegundos: Math.round((obj.modificadoEm.getTime() - dados.apertadoEm.getTime()) / 1000),
            tamanho: obj.tamanho,
            url,
          })),
        ];
      }),
    );
    clipes.sort((a, b) => b.chegouEm.localeCompare(a.chegouEm));
    return NextResponse.json({ clipes }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return erroDoR2(error);
  }
}

export async function DELETE(request: Request) {
  const ctx = contexto();
  if (!ctx) return naoEncontrado();
  if (!autorizado(request, ctx, "equipe")) return naoAutorizado();

  const chave = new URL(request.url).searchParams.get("chave");
  if (!chave || !chaveValida(chave)) return NextResponse.json({ erro: "Chave inválida." }, { status: 400 });
  try {
    await ctx.r2.apagar(chave);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return erroDoR2(error);
  }
}
