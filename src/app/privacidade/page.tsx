import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Aviso de privacidade — ${siteConfig.brand}`,
};

export default function PrivacidadePage() {
  return (
    <main id="conteudo-principal" className="section">
      <div className="container" style={{ maxWidth: "760px" }}>
        <h1 className="section-title">Aviso de privacidade</h1>

        <p>
          Este aviso explica como a {siteConfig.brand} trata os dados pessoais enviados pelo
          formulário de diagnóstico gratuito deste site.
        </p>

        <h2>Quais dados coletamos</h2>
        <p>
          No formulário de diagnóstico, coletamos apenas nome, empresa, número de WhatsApp e a
          descrição do problema relatado. Não coletamos nenhum outro dado pessoal através deste
          site.
        </p>

        <h2>Para que usamos</h2>
        <p>
          Usamos esses dados exclusivamente para entrar em contato sobre o diagnóstico gratuito
          solicitado, por WhatsApp ou e-mail. Não usamos os dados para nenhuma outra finalidade e
          não os compartilhamos com terceiros.
        </p>

        <h2>Base legal</h2>
        <p>
          O tratamento é feito com base no seu consentimento, dado explicitamente ao marcar a
          caixa de concordância no formulário antes do envio.
        </p>

        <h2>Por quanto tempo guardamos</h2>
        <p>
          Guardamos os dados enquanto durar a conversa comercial decorrente do contato, ou até que
          você solicite a exclusão.
        </p>

        <h2>Seus direitos</h2>
        <p>
          A qualquer momento, você pode pedir acesso, correção ou exclusão dos seus dados,
          enviando um e-mail para{" "}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
        </p>
      </div>
    </main>
  );
}
