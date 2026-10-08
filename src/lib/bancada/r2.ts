import { AwsClient } from "aws4fetch";
import type { BancadaConfig } from "./config";
import { PREFIXO } from "./chave";

/**
 * Cliente mínimo do R2 (API compatível com S3), assinado com aws4fetch.
 * Só o que a bancada usa: URL assinada de PUT e GET, PUT direto, HEAD,
 * DELETE e listagem do prefixo `bancada/`.
 */
export interface ObjetoR2 {
  chave: string;
  tamanho: number;
  modificadoEm: Date;
}

export class ErroR2 extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export const VALIDADE_UPLOAD_S = 15 * 60;
export const VALIDADE_LEITURA_S = 60 * 60;

export function criarR2(config: BancadaConfig["r2"], fetcher: typeof fetch = fetch) {
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
    region: "auto",
  });
  const base = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}`;
  const urlDe = (chave: string) => `${base}/${chave.split("/").map(encodeURIComponent).join("/")}`;

  async function assinarUrl(chave: string, method: "GET" | "PUT", validade: number): Promise<string> {
    const url = new URL(urlDe(chave));
    url.searchParams.set("X-Amz-Expires", String(validade));
    const assinada = await client.sign(url.toString(), { method, aws: { signQuery: true } });
    return assinada.url;
  }

  // Assina e chama com URL + init, não com o Request assinado: o corpo de um
  // Request vira stream, o fetch envia sem Content-Length e o R2 recusa o PUT
  // (411). Com o ArrayBuffer no init, o tamanho vai no cabeçalho. O corpo não
  // entra na assinatura (aws4fetch usa UNSIGNED-PAYLOAD no S3).
  // Falha de rede (DNS, TLS, R2 fora do ar) também vira ErroR2, para a rota
  // responder 502 com mensagem em vez de 500.
  async function chamar(url: string, init: RequestInit): Promise<Response> {
    const assinada = await client.sign(url, { method: init.method, headers: init.headers });
    try {
      return await fetcher(assinada.url, {
        method: assinada.method,
        headers: assinada.headers,
        body: init.body,
        cache: "no-store",
      });
    } catch (error) {
      throw new ErroR2(`sem conexão com o R2 (${error instanceof Error ? error.message : "erro de rede"})`, 0);
    }
  }

  const enviar = (chave: string, init: RequestInit) => chamar(urlDe(chave), init);

  return {
    urlUpload: (chave: string) => assinarUrl(chave, "PUT", VALIDADE_UPLOAD_S),
    urlLeitura: (chave: string) => assinarUrl(chave, "GET", VALIDADE_LEITURA_S),

    async gravar(chave: string, corpo: ArrayBuffer, tipo = "video/mp4"): Promise<void> {
      const res = await enviar(chave, {
        method: "PUT",
        body: corpo,
        // Content-Length sai do próprio ArrayBuffer (o R2 exige o tamanho no PUT).
        headers: { "content-type": tipo },
      });
      if (!res.ok) throw new ErroR2(`PUT no R2 falhou (${res.status})`, res.status);
    },

    /** Tamanho do objeto, ou null se não existe. */
    async tamanho(chave: string): Promise<number | null> {
      const res = await enviar(chave, { method: "HEAD" });
      if (res.status === 404) return null;
      if (!res.ok) throw new ErroR2(`HEAD no R2 falhou (${res.status})`, res.status);
      return Number(res.headers.get("content-length") ?? 0);
    },

    async apagar(chave: string): Promise<void> {
      const res = await enviar(chave, { method: "DELETE" });
      if (!res.ok && res.status !== 404) throw new ErroR2(`DELETE no R2 falhou (${res.status})`, res.status);
    },

    async listar(limite = 1000): Promise<ObjetoR2[]> {
      const objetos: ObjetoR2[] = [];
      let continuacao: string | undefined;
      do {
        const url = new URL(base);
        url.searchParams.set("list-type", "2");
        url.searchParams.set("prefix", PREFIXO);
        if (continuacao) url.searchParams.set("continuation-token", continuacao);
        const res = await chamar(url.toString(), { method: "GET" });
        if (!res.ok) throw new ErroR2(`Listagem no R2 falhou (${res.status})`, res.status);
        const pagina = lerListagem(await res.text());
        objetos.push(...pagina.objetos);
        continuacao = pagina.continuacao;
      } while (continuacao && objetos.length < limite);
      return objetos.slice(0, limite);
    },
  };
}

export type R2 = ReturnType<typeof criarR2>;

const desescapar = (texto: string) =>
  texto
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

const campo = (bloco: string, nome: string) => {
  const m = new RegExp(`<${nome}>([\\s\\S]*?)</${nome}>`).exec(bloco);
  return m ? desescapar(m[1]!) : undefined;
};

/** Lê o XML do ListObjectsV2 (sem dependência de parser). */
export function lerListagem(xml: string): { objetos: ObjetoR2[]; continuacao?: string } {
  const objetos: ObjetoR2[] = [];
  for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
    const bloco = m[1]!;
    const chave = campo(bloco, "Key");
    const modificado = campo(bloco, "LastModified");
    if (!chave || !modificado) continue;
    objetos.push({ chave, tamanho: Number(campo(bloco, "Size") ?? 0), modificadoEm: new Date(modificado) });
  }
  const truncado = campo(xml, "IsTruncated") === "true";
  return { objetos, continuacao: truncado ? campo(xml, "NextContinuationToken") : undefined };
}
