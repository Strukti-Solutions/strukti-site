import { NextResponse } from "next/server";
import { COOKIE_SESSAO } from "@/lib/bancada/auth";

export async function POST(request: Request) {
  const resposta = NextResponse.redirect(new URL("/bancada", request.url), 303);
  resposta.cookies.delete(COOKIE_SESSAO);
  return resposta;
}
