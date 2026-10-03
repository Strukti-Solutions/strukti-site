import type { NextConfig } from "next";

// CSP estática (ADR-008, revisão R1 da Crivo): a página não renderiza
// conteúdo de usuário nem carrega script de terceiro (sem
// dangerouslySetInnerHTML, sem next/script, sem domínio externo), então o
// nonce por requisição só trocava segurança equivalente por páginas
// dinâmicas (sem cache de CDN, função a cada visita) e por uma peça frágil
// (o await headers() "inútil" do layout, que já quebrou uma vez em
// produção sem erro de build — ad367c4/503dd2a). 'unsafe-eval' só em
// desenvolvimento: o devtool do webpack do Next (eval-source-map) roda
// cada módulo por eval() nesse modo.
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
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

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: cspDirectives },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
