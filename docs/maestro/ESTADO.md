# Onde paramos — 03/10/2026 (novo rumo: hardware + IA)

Registro do Claudinho para quem retomar o trabalho no PC novo. O repositório é privado: `github.com/Thiago432544/strukti-site`.

## Novo rumo (03/10/2026)

A Strukti passou a focar em produtos de hardware + IA (replay para quadras; estacionamento inteligente em espera); aplicativos continuam em segundo plano. O site vira a vitrine da marca-mãe, com a identidade "Estúdio" (ADR-009, `MASTER.md` v3).

- Spec: `docs/superpowers/specs/2026-10-03-identidade-estudio-design.md`.
- Plano: `docs/superpowers/plans/2026-10-03-identidade-estudio.md` (10 tarefas; a Tarefa 2, texto v2.0, é portão do Thiago).
- Nesta máquina o time roda como subagentes do Claude Code (o Maestri está com outro projeto).

## O que está no `main` (depois desta rodada)

- **Home v3 da marca-mãe** (ADR-009, spec `docs/superpowers/specs/2026-10-03-identidade-estudio-design.md` §4), nesta ordem:
  - hero "estudio": o botão de replay em 3D gira com a rolagem (sequência de quadros AVIF; com reduced motion, "economizar dados" ou sem JavaScript, fica o pôster);
  - produtos de hardware: replay para quadras ("Piloto gratuito") e estacionamento inteligente ("Em desenvolvimento"), com WhatsApp de mensagem pronta;
  - aplicativos sob medida: Rota de Vendas e Fleet Analytics BI em vídeo, com selo de status e a chamada do diagnóstico gratuito;
  - chamada "Tem um problema que pede hardware?";
  - como trabalhamos (etapas), equipe (nome e curso), dúvidas e rodapé;
  - contato: formulário único com o campo de interesse (assunto) e consentimento (LGPD);
  - aviso de privacidade (versão 2026-10-03).
- **Design system v3 "Estúdio":** `design-system/strukti-solucoes/MASTER.md`. As decisões estão nos ADRs 001 a 009 de `docs/DECISOES.md`.
- **TB1, top bar fixa de borda a borda.**
- **TB2, barra larga a partir de 75em**, para o espaçamento de texto do WCAG 1.4.12. Abaixo disso valem o Menu e o botão flutuante do WhatsApp.
- **P3, prontidão para publicar:**
  - o botão flutuante relê os marcadores a cada rota;
  - `SITE_URL` alimenta o `metadataBase`, o sitemap e o robots;
  - manifest e página 404 ("Página não encontrada" e "Voltar para o início", textos aprovados pelo Claudinho em 03/10);
  - **CSP estática** e cabeçalhos de segurança no `next.config` (ADR-008):
    - sem nonce; `'unsafe-eval'` só em desenvolvimento;
    - as páginas continuam estáticas, servidas pela CDN;
    - o `check:browser` falha se houver violação de CSP.
- O texto aprovado está em `docs/landing-copy.md`, versão 2.0 (aprovada pelo Thiago em 03/10/2026).

## Próximos passos

1. **Remontar o time** no PC novo (veja `README.md` nesta pasta). Com mais RAM, dá para rever a fila pesada e manter mais agentes ao mesmo tempo.
2. **Backlog técnico:**
   - **Q2:** `npm audit` aponta 7 vulnerabilidades, só no ferramental de build e lint (eslint-config-next, postcss, micromatch). Atualizar quando as versões corrigidas passarem a quarentena.
   - **H2:** ao recriar os papéis no Maestri do PC novo, use os textos de `papeis/`. Eles já têm a cláusula de hierarquia e sub-agentes e a regra da fila.
   - **Feitos em 03/10, no PC novo** (time como subagentes do Claude Code, porque o Maestri dessa máquina está com outro projeto):
     - **Q1:** o foco do `Diagnostico` é movido por `useEffect` depois da volta do `fetch`; o teste agora espera o foco no elemento exato (`expectFocusOn`) em vez de conferir logo após o texto aparecer;
     - **Q3:** 1024 em `FAB_CHECK_WIDTHS`; o FAB não cruza nenhum controle nessa largura;
     - **Q4:** `SITE_URL` (e `VERCEL_*`) vazio ou só com espaços conta como ausente; README com o fallback real; o `check:browser` começa por um controle positivo que provoca uma violação de CSP e interrompe a checagem se o detector não a acusar (provado neutralizando o detector: exit 1).
   - **Armadilha do PC novo:** a pasta é `C:\Dev` (D maiúsculo). Worktree com `node_modules` em junction para `C:\dev\...` faz o `next dev` empacotar o Next duas vezes e a página não hidrata, e o `check:browser` pode passar sem ter testado nada. Use sempre `C:\Dev` em junctions e no diretório de trabalho.
3. **Depois da home v3:**
   - **limpeza dos heros "video" e "classic"**, com ADR própria em `docs/DECISOES.md` (spec §5.2): sair `HeroVideo*`, `Hero`, `HeroContent`, `HeroBackground`, os visuais, `Header`, `landingContent.hero` e o CSS deles;
   - **CSS sem uso das seções que saíram** (Problemas, O que já construímos e Diagnóstico): por exemplo `.diag__highlight`, `.diag__steps-title`, `.highlights` e `.portfolio__video-title` no `globals.css` (conferir cada classe com `grep` antes de apagar: `.diag` e `.portfolio__meta` continuam em uso);
   - **pendências da v2.0** (`docs/landing-copy.md`, "Pendências"): provedores no aviso de privacidade, endereço do site e curso de cada pessoa da equipe bloqueiam a publicação; fotos da equipe, o grupo decide; o endereço do site do replay não bloqueia (o link fica escondido);
   - **V2:** mais vídeos de lançamento (`/brag`) de outros projetos na grade de aplicativos.
4. **L5, publicação** (só com o ok do cliente e as contas dele):
   - deploy na Vercel;
   - banco PostgreSQL para o formulário (`DATABASE_URL` só em `.env.local` e nas variáveis da Vercel);
   - endereço final em `SITE_URL` (o Q4 já está resolvido);
   - banco criado antes do campo de interesse: rodar a migração do README antes do deploy (sem a coluna `interest`, todo envio dá 500);
   - medir o desempenho (Lighthouse) na própria Vercel.
   - O CSP com nonce só volta à mesa se entrar script de terceiro (ADR-008).
5. **Prioridades seguintes do `CLAUDE.md`:** LGPD do app, base reaproveitável e revisão geral do app.

## Regras que não mudam

- Nunca inventar cases, depoimentos, números ou logos. A prova é o Rota de Vendas, com dados fictícios, e o Fleet Analytics BI, com dados reais autorizados pelo cliente.
- Push, deploy e conta em serviço externo só com o ok do cliente.
- Dependências com versões exatas e quarentena de 7 dias (`npm install --min-release-age=7` e `npm run check:quarantine`).
