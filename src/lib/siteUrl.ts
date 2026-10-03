/**
 * URL pública do site. O domínio de produção ainda não foi definido
 * (docs/landing-copy.md, "Pendências [A PREENCHER]") — por isso nunca é
 * hardcoded aqui. Antes do lançamento, defina `SITE_URL` no ambiente da
 * Vercel (ver README). Sem isso, cai no `VERCEL_URL` automático de cada
 * deploy (preview ou produção) e, fora da Vercel, em localhost.
 */
export function getSiteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
