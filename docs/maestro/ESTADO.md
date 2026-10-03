# Onde paramos — 03/10/2026

Registro do Claudinho para quem retomar o trabalho no PC novo. O repositório é privado: `github.com/Thiago432544/strukti-site`.

## O que está no `main` (depois desta rodada)

- **Site completo:**
  - hero com vídeo;
  - problemas do nicho;
  - como resolvemos;
  - portfólio com 2 projetos em vídeo (Rota de Vendas e Fleet Analytics BI);
  - diagnóstico gratuito e formulário com consentimento (LGPD);
  - equipe;
  - aviso de privacidade.
- **Design system "Encaixe":** `design-system/strukti-solucoes/MASTER.md`. As decisões estão nos ADRs 001 a 008 de `docs/DECISOES.md`.
- **TB1, top bar fixa de borda a borda.**
- **TB2, barra larga a partir de 75em**, para o espaçamento de texto do WCAG 1.4.12. Abaixo disso valem o Menu e o botão flutuante do WhatsApp.
- **P3, prontidão para publicar:**
  - o botão flutuante relê os marcadores a cada rota;
  - o pôster do vídeo de destaque só carrega perto da seção;
  - `SITE_URL` alimenta o `metadataBase`, o sitemap e o robots;
  - manifest e página 404 ("Página não encontrada" e "Voltar para o início", textos aprovados pelo Claudinho em 03/10);
  - **CSP estática** e cabeçalhos de segurança no `next.config` (ADR-008):
    - sem nonce; `'unsafe-eval'` só em desenvolvimento;
    - as páginas continuam estáticas, servidas pela CDN;
    - o `check:browser` falha se houver violação de CSP.
- O texto aprovado está em `docs/landing-copy.md`, versão 1.8: a v1.7 do cliente mais os textos da 404.

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
3. **V2:** mais vídeos de lançamento (`/brag`) de outros projetos no portfólio. É o foco futuro do site.
4. **L5, publicação** (só com o ok do cliente e as contas dele):
   - deploy na Vercel;
   - banco PostgreSQL para o formulário (`DATABASE_URL` só em `.env.local` e nas variáveis da Vercel);
   - endereço final em `SITE_URL` (o Q4 já está resolvido);
   - medir o desempenho (Lighthouse) na própria Vercel.
   - O CSP com nonce só volta à mesa se entrar script de terceiro (ADR-008).
5. **Prioridades seguintes do `CLAUDE.md`:** LGPD do app, base reaproveitável e revisão geral do app.

## Regras que não mudam

- Nunca inventar cases, depoimentos, números ou logos. A prova é o Rota de Vendas, com dados fictícios, e o Fleet Analytics BI, com dados reais autorizados pelo cliente.
- Push, deploy e conta em serviço externo só com o ok do cliente.
- Dependências com versões exatas e quarentena de 7 dias (`npm install --min-release-age=7` e `npm run check:quarantine`).
