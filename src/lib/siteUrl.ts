/**
 * URL pública do site. O domínio de produção ainda não foi definido
 * (docs/landing-copy.md, "Pendências [A PREENCHER]") — por isso nunca é
 * hardcoded aqui. Antes do lançamento, defina `SITE_URL` no ambiente da
 * Vercel (ver README). Sem isso: em produção, cai no domínio fixo do
 * projeto (`VERCEL_PROJECT_PRODUCTION_URL` — o `VERCEL_URL` é a URL única
 * *daquele deploy*, não o domínio); em preview, no `VERCEL_URL` do próprio
 * deploy; fora da Vercel, em localhost.
 *
 * `new URL(...).origin` normaliza (remove barra final, exige protocolo) —
 * sem isso, um `SITE_URL` com barra no fim duplicava barras no sitemap/
 * robots, e um valor sem protocolo quebrava o `new URL()` do layout.
 */
export function getSiteUrl(): string {
  const raw =
    process.env.SITE_URL ??
    (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    "http://localhost:3000";
  return new URL(raw).origin;
}
