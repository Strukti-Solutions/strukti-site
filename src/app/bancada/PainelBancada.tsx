"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import estilos from "./bancada.module.css";

interface ClipeLista {
  chave: string;
  quadra: string;
  camera: string;
  botao: string;
  origem: string;
  apertadoEm: string;
  chegouEm: string;
  atrasoSegundos: number;
  tamanho: number;
  url: string;
}

const ATUALIZAR_A_CADA_MS = 10_000;
const ORIGEM: Record<string, string> = { app: "App da câmera", automacao: "Automação", manual: "Manual" };

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const hora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** PUT com progresso (fetch não informa progresso de upload). */
function putComProgresso(url: string, arquivo: File, onProgresso: (fracao: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", "video/mp4");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgresso(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`R2 respondeu ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Falha de rede no upload (confira o CORS do bucket)."));
    xhr.send(arquivo);
  });
}

export function PainelBancada() {
  const [clipes, setClipes] = useState<ClipeLista[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [envio, setEnvio] = useState<{ nome: string; fracao: number; inicio: number } | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const [origem, setOrigem] = useState("");

  useEffect(() => setOrigem(window.location.origin), []);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/bancada/clipes", { cache: "no-store" });
      if (res.status === 401) return window.location.reload();
      const json = (await res.json().catch(() => ({}))) as { clipes?: ClipeLista[]; erro?: string };
      if (!res.ok) {
        setClipes((atual) => atual ?? []);
        return setErro(json.erro ?? `Erro ${res.status} ao listar os clipes.`);
      }
      setErro(null);
      setClipes(json.clipes ?? []);
    } catch {
      setClipes((atual) => atual ?? []);
      setErro("Sem conexão com o site para listar os clipes.");
    }
  }, []);

  useEffect(() => {
    void carregar();
    const id = window.setInterval(() => document.visibilityState === "visible" && void carregar(), ATUALIZAR_A_CADA_MS);
    return () => window.clearInterval(id);
  }, [carregar]);

  async function enviar(arquivo: File) {
    const dados = new FormData(form.current ?? undefined);
    setResultado(null);
    setErro(null);
    const inicio = performance.now();
    setEnvio({ nome: arquivo.name, fracao: 0, inicio });
    try {
      const pedido = await fetch("/api/bancada/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quadra: dados.get("quadra"),
          camera: dados.get("camera"),
          botao: dados.get("botao"),
          origem: "manual",
          apertadoEm: new Date().toISOString(),
        }),
      });
      const { chave, urlUpload, erro: erroPedido } = (await pedido.json()) as { chave?: string; urlUpload?: string; erro?: string };
      if (!pedido.ok || !chave || !urlUpload) throw new Error(erroPedido ?? `Erro ${pedido.status} ao pedir a URL.`);

      await putComProgresso(urlUpload, arquivo, (fracao) => setEnvio({ nome: arquivo.name, fracao, inicio }));

      const conf = await fetch("/api/bancada/confirmar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chave }),
      });
      if (!conf.ok) throw new Error(((await conf.json()) as { erro?: string }).erro ?? "Confirmação falhou.");

      const segundos = (performance.now() - inicio) / 1000;
      setResultado(`${arquivo.name}: ${mb(arquivo.size)} em ${segundos.toFixed(1)} s (${(arquivo.size / 1024 / 1024 / segundos).toFixed(2)} MB/s).`);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha no envio.");
    } finally {
      setEnvio(null);
    }
  }

  async function apagar(chave: string) {
    if (!window.confirm("Apagar este clipe do R2?")) return;
    const res = await fetch(`/api/bancada/clipes?chave=${encodeURIComponent(chave)}`, { method: "DELETE" });
    if (!res.ok) return setErro(`Erro ${res.status} ao apagar.`);
    await carregar();
  }

  return (
    <div className={estilos.painel}>
      <section aria-labelledby="enviar-titulo" className={estilos.bloco}>
        <h2 id="enviar-titulo" className="block-title">
          Enviar um vídeo
        </h2>
        <form ref={form} className={estilos.campos} onSubmit={(e) => e.preventDefault()}>
          {(["quadra", "camera", "botao"] as const).map((nome) => (
            <div key={nome} className="field">
              <label htmlFor={`campo-${nome}`} className="field__label">
                {nome === "camera" ? "Câmera" : nome === "botao" ? "Botão" : "Quadra"} (opcional)
              </label>
              <input id={`campo-${nome}`} name={nome} className="field__input" placeholder="teste" />
            </div>
          ))}
        </form>
        <label
          className={`${estilos.soltar} ${arrastando ? estilos.soltarAtivo : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            const arquivo = e.dataTransfer.files[0];
            if (arquivo) void enviar(arquivo);
          }}
        >
          <input
            type="file"
            accept="video/mp4,video/quicktime"
            className={estilos.escondido}
            disabled={envio !== null}
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              e.target.value = "";
              if (arquivo) void enviar(arquivo);
            }}
          />
          {envio ? `Enviando ${envio.nome}… ${Math.round(envio.fracao * 100)}%` : "Arraste um .mp4 aqui ou clique para escolher"}
        </label>
        {envio && <progress className={estilos.progresso} value={envio.fracao} max={1} />}
        <p aria-live="polite" className={estilos.status}>
          {resultado}
        </p>
        {erro && (
          <p role="alert" className="field__error">
            {erro}
          </p>
        )}
      </section>

      <section aria-labelledby="como-titulo" className={estilos.bloco}>
        <h2 id="como-titulo" className="block-title">
          Como o app da câmera ou a automação envia
        </h2>
        <p className="caption">Em uma chamada só (até 4,5 MB quando o site estiver na Vercel):</p>
        <pre className={estilos.codigo}>
          {`POST ${origem}/api/bancada/receber?token=SEU_TOKEN&quadra=q1&camera=c1&botao=b1\ncorpo: o vídeo (video/mp4) ou multipart com o campo "arquivo"`}
        </pre>
        <p className="caption">Em duas etapas (arquivos grandes): upload-url → PUT no R2 → confirmar. Exemplos em docs/bancada/README.md.</p>
      </section>

      <section aria-labelledby="clipes-titulo" className={estilos.bloco}>
        <div className={estilos.cabecalho}>
          <h2 id="clipes-titulo" className="block-title">
            Clipes recebidos {clipes ? `(${clipes.length})` : ""}
          </h2>
          <div className={estilos.acoes}>
            <button type="button" className="btn btn--outline btn--compact" onClick={() => void carregar()}>
              Atualizar
            </button>
            <form method="post" action="/api/bancada/sair">
              <button type="submit" className="btn btn--outline btn--compact">
                Sair
              </button>
            </form>
          </div>
        </div>
        {clipes === null ? (
          <p className="caption">Carregando…</p>
        ) : clipes.length === 0 ? (
          <p className="caption">Nenhum clipe ainda. A lista se atualiza sozinha a cada 10 segundos.</p>
        ) : (
          <ul className={estilos.lista}>
            {clipes.map((c) => (
              <li key={c.chave} className={estilos.clipe}>
                <video controls preload="none" src={c.url} className={estilos.video} aria-label={`Clipe de ${hora(c.apertadoEm)}`} />
                <dl className={estilos.dados}>
                  <div><dt>Aperto</dt><dd>{hora(c.apertadoEm)}</dd></div>
                  <div><dt>Chegou</dt><dd>{hora(c.chegouEm)} ({c.atrasoSegundos} s depois)</dd></div>
                  <div><dt>Quadra · câmera · botão</dt><dd>{c.quadra} · {c.camera} · {c.botao}</dd></div>
                  <div><dt>Origem</dt><dd>{ORIGEM[c.origem] ?? c.origem}</dd></div>
                  <div><dt>Tamanho</dt><dd>{mb(c.tamanho)}</dd></div>
                </dl>
                <div className={estilos.acoes}>
                  <a href={c.url} className="btn btn--outline btn--compact" target="_blank" rel="noreferrer">
                    Abrir / baixar
                  </a>
                  <button type="button" className="btn btn--outline btn--compact" onClick={() => void apagar(c.chave)}>
                    Apagar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
