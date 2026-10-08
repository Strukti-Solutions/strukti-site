/**
 * Nome do objeto no R2. Os dados do clipe vão no próprio nome, assim a
 * listagem já traz tudo e não há banco nem metadados a assinar no upload:
 *
 *   bancada/2026-10-08/quadra-1/cam-2/botao-1/20261008T203712Z--app--k3x9q2.mp4
 *
 * Cada parte passa por `slug()`: só [a-z0-9-], o que também impede
 * `..`, barras e caracteres que precisariam de escape na URL.
 */
export const PREFIXO = "bancada/";

export const ORIGENS = ["app", "automacao", "manual"] as const;
export type Origem = (typeof ORIGENS)[number];

export interface DadosClipe {
  quadra: string;
  camera: string;
  botao: string;
  apertadoEm: Date;
  origem: Origem;
}

export interface Clipe extends DadosClipe {
  chave: string;
  tamanho: number;
  chegouEm: Date;
}

const PADRAO = "teste";
const MAX_PARTE = 40;

export function slug(valor: string | null | undefined): string {
  const limpo = (valor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_PARTE)
    .replace(/-+$/g, "");
  return limpo || PADRAO;
}

/** 2026-10-08T20:37:12.345Z → 20261008T203712Z */
function carimbo(data: Date): string {
  return data.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function lerCarimbo(texto: string): Date | null {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(texto);
  if (!m) return null;
  const data = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`);
  return Number.isNaN(data.getTime()) ? null : data;
}

export function montarChave(dados: DadosClipe, id: string): string {
  const dia = dados.apertadoEm.toISOString().slice(0, 10);
  return `${PREFIXO}${dia}/${slug(dados.quadra)}/${slug(dados.camera)}/${slug(dados.botao)}/${carimbo(dados.apertadoEm)}--${dados.origem}--${slug(id)}.mp4`;
}

const FORMATO =
  /^bancada\/\d{4}-\d{2}-\d{2}\/([a-z0-9-]+)\/([a-z0-9-]+)\/([a-z0-9-]+)\/(\d{8}T\d{6}Z)--(app|automacao|manual)--([a-z0-9-]+)\.mp4$/;

/** Só aceita chaves no formato que `montarChave` produz (nada fora de `bancada/`). */
export function chaveValida(chave: string): boolean {
  return FORMATO.test(chave);
}

export function lerChave(chave: string): DadosClipe | null {
  const m = FORMATO.exec(chave);
  if (!m) return null;
  const apertadoEm = lerCarimbo(m[4]!);
  if (!apertadoEm) return null;
  return { quadra: m[1]!, camera: m[2]!, botao: m[3]!, apertadoEm, origem: m[5] as Origem };
}

/** Horário do aperto vindo do app: ISO 8601 ou epoch (s ou ms). Inválido ou ausente → agora. */
export function lerHorario(valor: string | null | undefined, agora: Date = new Date()): Date {
  if (!valor) return agora;
  const texto = valor.trim();
  if (/^\d{10}$/.test(texto)) return new Date(Number(texto) * 1000);
  if (/^\d{13}$/.test(texto)) return new Date(Number(texto));
  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? agora : data;
}

export function lerOrigem(valor: string | null | undefined, padrao: Origem): Origem {
  return (ORIGENS as readonly string[]).includes(valor ?? "") ? (valor as Origem) : padrao;
}

export function novoId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

/** Limite do envio em uma chamada só (o servidor segura o arquivo inteiro na memória). */
export const MAX_BYTES = 300 * 1024 * 1024;

/** MP4 e MOV começam com uma caixa "ftyp" a partir do byte 4. */
export function pareceVideo(bytes: Uint8Array): boolean {
  return bytes.length >= 12 && String.fromCharCode(...bytes.subarray(4, 8)) === "ftyp";
}
