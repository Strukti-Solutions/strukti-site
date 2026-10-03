import { NextResponse, type NextRequest } from "next/server";

/**
 * Content-Security-Policy com nonce por requisição (guia oficial do
 * Next.js para CSP em App Router). O nonce vai no script-src e também num
 * cabeçalho de requisição (`x-nonce`); o Next detecta o nonce no
 * Content-Security-Policy da resposta e aplica sozinho aos scripts que ele
 * injeta (bundle e dados de streaming), sem precisar tocar em cada página.
 *
 * - `script-src 'nonce-…' 'strict-dynamic'`: só roda o que tem o nonce (ou
 *   foi carregado por quem tem); sem 'unsafe-inline'.
 * - `style-src 'unsafe-inline'`: `style={{...}}` do React vira atributo
 *   `style=""` literal no HTML do servidor (ex.: privacidade/page.tsx,
 *   ComoResolvemos.tsx) — CSP trata isso como estilo inline, sem suporte a
 *   nonce por atributo. Sem isso, esses estilos seriam ignorados.
 * - `media-src`/`font-src 'self'`: vídeo do hero e do portfólio e a fonte
 *   Geologica são servidos pelo próprio site (public/, next/font
 *   self-hosted) — nunca CDN externa.
 * - `img-src 'self' data:`: o `data:` é só pro ruído de fundo em SVG inline
 *   do CSS (globals.css, textura de grão), não pra imagem de página.
 */
function buildCsp(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "media-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

// Fora de /api, dos assets do Next e do favicon; exclui também requisições
// de prefetch (nonce diferente a cada uma quebraria o cache de prefetch do
// App Router) — igual ao exemplo oficial do Next.js para CSP.
export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
