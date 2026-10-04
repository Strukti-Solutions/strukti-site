import { NextRequest, NextResponse } from "next/server";
import { contatoFormSchema } from "@/lib/validation";
import { isRateLimited } from "@/lib/rateLimit";
import { createLeadRepository, RepositoryConfigError } from "@/lib/repository/leadRepository";
import { siteConfig } from "@/config/site";

function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  // Sem cabeçalho Origin: alguns clientes legítimos (ferramentas locais,
  // navegadores antigos) não o enviam em requisições same-origin. Só
  // bloqueamos quando o cabeçalho vem preenchido e não bate com o host.
  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);

  if (isRateLimited(identifier)) {
    return NextResponse.json(
      { error: "Foram muitas tentativas seguidas. Espere alguns minutos e tente de novo, ou fale com a gente pelo WhatsApp." },
      { status: 429 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "Tipo de conteúdo não suportado." }, { status: 415 });
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const parsed = contatoFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  // Honeypot: se preenchido, finge sucesso para não dar dica de teste ao bot.
  if (parsed.data.codigoParceiro) {
    return NextResponse.json({ ok: true });
  }

  try {
    const repository = createLeadRepository();
    await repository.save({
      name: parsed.data.name,
      company: parsed.data.company,
      whatsapp: parsed.data.whatsapp,
      interest: parsed.data.interest,
      problem: parsed.data.problem,
      consentAt: new Date(),
      privacyPolicyVersion: siteConfig.privacyPolicyVersion,
    });
  } catch (error) {
    if (error instanceof RepositoryConfigError) {
      console.error("Contato: repositório de leads não configurado (DATABASE_URL ausente).");
      return NextResponse.json(
        { error: "Formulário indisponível no momento. Tente novamente mais tarde." },
        { status: 503 },
      );
    }

    console.error("Contato: falha ao gravar lead.");
    return NextResponse.json(
      {
        error:
          "Não foi possível enviar agora. Tente de novo em alguns minutos ou fale com a gente pelo WhatsApp.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
