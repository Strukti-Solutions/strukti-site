import { NextResponse } from "next/server";
import { autorizado, contexto, dadosDoClipe, erroDoR2, naoAutorizado, naoEncontrado } from "@/lib/bancada/api";
import { MAX_BYTES, montarChave, novoId, pareceVideo } from "@/lib/bancada/chave";

/**
 * Envio em uma chamada só (aplicativo da câmera, automação simples):
 *
 *   POST /api/bancada/receber?token=…&quadra=…&camera=…&botao=…&apertadoEm=…
 *   corpo: o vídeo bruto (video/mp4) ou multipart com o campo "arquivo"
 *
 * O servidor recebe o arquivo inteiro e grava no R2. Na Vercel o corpo das
 * funções vai até 4,5 MB; para clipes maiores, usar o envio em duas etapas
 * (upload-url → PUT no R2 → confirmar).
 */
export async function POST(request: Request) {
  const ctx = contexto();
  if (!ctx) return naoEncontrado();
  if (!autorizado(request, ctx, "envio")) return naoAutorizado();

  const declarado = Number(request.headers.get("content-length") ?? 0);
  if (declarado > MAX_BYTES) {
    return NextResponse.json({ erro: `Arquivo maior que ${MAX_BYTES / 1024 / 1024} MB.` }, { status: 413 });
  }

  const query = new URL(request.url).searchParams;
  const tipo = request.headers.get("content-type") ?? "";
  let corpo: ArrayBuffer;
  let campos: (nome: string) => string | null = (nome) => query.get(nome);

  try {
    if (tipo.toLowerCase().startsWith("multipart/form-data")) {
      const form = await request.formData();
      const arquivo = form.get("arquivo") ?? [...form.values()].find((v) => v instanceof File);
      if (!(arquivo instanceof File)) {
        return NextResponse.json({ erro: 'Envie o vídeo no campo "arquivo".' }, { status: 400 });
      }
      corpo = await arquivo.arrayBuffer();
      campos = (nome) => query.get(nome) ?? (typeof form.get(nome) === "string" ? (form.get(nome) as string) : null);
    } else {
      corpo = await request.arrayBuffer();
    }
  } catch {
    return NextResponse.json({ erro: "Não foi possível ler o corpo da requisição." }, { status: 400 });
  }

  if (corpo.byteLength === 0) return NextResponse.json({ erro: "Arquivo vazio." }, { status: 400 });
  if (corpo.byteLength > MAX_BYTES) {
    return NextResponse.json({ erro: `Arquivo maior que ${MAX_BYTES / 1024 / 1024} MB.` }, { status: 413 });
  }
  if (!pareceVideo(new Uint8Array(corpo, 0, Math.min(corpo.byteLength, 12)))) {
    return NextResponse.json({ erro: "O arquivo não parece um vídeo MP4/MOV." }, { status: 415 });
  }

  const dados = dadosDoClipe(campos, "app");
  const chave = montarChave(dados, novoId());
  try {
    await ctx.r2.gravar(chave, corpo);
  } catch (error) {
    return erroDoR2(error);
  }

  return NextResponse.json(
    { ok: true, chave, tamanho: corpo.byteLength, apertadoEm: dados.apertadoEm.toISOString() },
    { status: 201 },
  );
}
