import { NextRequest, NextResponse } from "next/server";
import { diagnosticoFormSchema } from "@/lib/validation";
import { isRateLimited } from "@/lib/rateLimit";
import { createLeadRepository, RepositoryConfigError } from "@/lib/repository/leadRepository";

function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);

  if (isRateLimited(identifier)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um minuto e tente novamente." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const parsed = diagnosticoFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  // Honeypot: se preenchido, finge sucesso para não dar dica de teste ao bot.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  try {
    const repository = createLeadRepository();
    await repository.save({
      name: parsed.data.name,
      company: parsed.data.company,
      whatsapp: parsed.data.whatsapp,
      problem: parsed.data.problem,
    });
  } catch (error) {
    if (error instanceof RepositoryConfigError) {
      console.error("Diagnóstico: repositório de leads não configurado (DATABASE_URL ausente).");
      return NextResponse.json(
        { error: "Formulário indisponível no momento. Tente novamente mais tarde." },
        { status: 503 },
      );
    }

    console.error("Diagnóstico: falha ao gravar lead.");
    return NextResponse.json(
      { error: "Não foi possível enviar agora. Tente novamente em instantes." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
