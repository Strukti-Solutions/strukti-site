/**
 * URL pública do site. O domínio de produção ainda não foi definido
 * (docs/landing-copy.md, seção "Pendências") — por isso nunca é
 * hardcoded aqui. Antes do lançamento, defina `SITE_URL` no ambiente da
 * Vercel (ver README). Sem isso: em produção, cai no domínio fixo do
 * projeto (`VERCEL_PROJECT_PRODUCTION_URL` — o `VERCEL_URL` é a URL única
 * *daquele deploy*, não o domínio); em preview, no `VERCEL_URL` do próprio
 * deploy; fora da Vercel, em localhost.
 *
 * Variável vazia ou só com espaços conta como ausente (`||`, não `??`): um
 * `SITE_URL=""` na Vercel ou no `.env.local` passava pelo `??` e quebrava o
 * build no `new URL("")`.
 *
 * `new URL(...).origin` normaliza (remove barra final, exige protocolo) —
 * sem isso, um `SITE_URL` com barra no fim duplicava barras no sitemap/
 * robots, e um valor sem protocolo quebrava o `new URL()` do layout.
 */
export function getSiteUrl(): string {
  const env = (key: string) => process.env[key]?.trim() || undefined;
  const productionHost = env("VERCEL_ENV") === "production" ? env("VERCEL_PROJECT_PRODUCTION_URL") : undefined;
  const deployHost = env("VERCEL_URL");
  const raw =
    env("SITE_URL") ||
    (productionHost && `https://${productionHost}`) ||
    (deployHost && `https://${deployHost}`) ||
    "http://localhost:3000";
  return new URL(raw).origin;
}
