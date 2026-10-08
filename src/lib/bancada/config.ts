/**
 * Bancada do replay (provisória): aba `/bancada` para os testes de envio
 * de clipes ao Cloudflare R2. Ver docs/bancada/README.md.
 *
 * Só liga com TODAS as variáveis presentes; sem alguma delas, a rota inteira
 * responde 404 (página e API). Senha e token curtos também desligam, para
 * não publicar a bancada protegida por algo adivinhável.
 */
export interface BancadaConfig {
  r2: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
  };
  /** Token do aplicativo da câmera / automação (`Authorization: Bearer` ou `?token=`). */
  token: string;
  /** Senha da equipe para a página. */
  senha: string;
}

export const TAMANHO_MINIMO_SEGREDO = 16;

export function lerConfigBancada(env: Record<string, string | undefined> = process.env): BancadaConfig | null {
  const accountId = env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = env.R2_BUCKET?.trim();
  const token = env.BANCADA_TOKEN?.trim();
  const senha = env.BANCADA_SENHA?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !token || !senha) return null;
  if (token.length < TAMANHO_MINIMO_SEGREDO || senha.length < TAMANHO_MINIMO_SEGREDO) {
    console.error(`Bancada desligada: BANCADA_TOKEN e BANCADA_SENHA precisam de ${TAMANHO_MINIMO_SEGREDO}+ caracteres.`);
    return null;
  }

  return { r2: { accountId, accessKeyId, secretAccessKey, bucket }, token, senha };
}
