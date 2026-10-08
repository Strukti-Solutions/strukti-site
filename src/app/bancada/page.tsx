import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { lerConfigBancada } from "@/lib/bancada/config";
import { COOKIE_SESSAO, sessaoValidaPorValor } from "@/lib/bancada/auth";
import { PainelBancada } from "./PainelBancada";
import estilos from "./bancada.module.css";

/**
 * Aba PROVISÓRIA dos testes de bancada do replay (docs/bancada/README.md).
 * Fora do menu e do sitemap, sem indexação; sem as variáveis de ambiente,
 * responde 404. Para remover: apagar src/app/bancada, src/app/api/bancada,
 * src/lib/bancada e o bloco "/bancada" do next.config.ts e do robots.ts.
 */
export const metadata: Metadata = {
  title: "Bancada do replay (provisória)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  senha: "Senha incorreta.",
  muitas: "Muitas tentativas seguidas. Espere um minuto e tente de novo.",
};

export default async function BancadaPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const config = lerConfigBancada();
  if (!config) notFound();

  const sessao = (await cookies()).get(COOKIE_SESSAO)?.value;
  const logado = sessaoValidaPorValor(sessao, config);
  const { erro } = await searchParams;

  return (
    <main id="conteudo-principal" className={`section surface-paper ${estilos.bancada}`}>
      <div className="container">
        <Link href="/" className={estilos.voltar}>
          ← Voltar ao site
        </Link>
        <p className={estilos.aviso}>Página provisória de testes · não é pública</p>
        <h1 className="section-title">Bancada do replay</h1>
        {logado ? (
          <PainelBancada />
        ) : (
          <form method="post" action="/api/bancada/entrar" className={`form-card ${estilos.entrar}`}>
            <div className="field">
              <label htmlFor="senha" className="field__label">
                Senha da equipe
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                autoComplete="current-password"
                required
                className="field__input"
                aria-invalid={erro === "senha" ? true : undefined}
                aria-describedby={erro ? "erro-senha" : undefined}
              />
              {erro && ERROS[erro] && (
                <p id="erro-senha" className="field__error" role="alert">
                  {ERROS[erro]}
                </p>
              )}
            </div>
            <button type="submit" className="btn btn--primary">
              Entrar
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
