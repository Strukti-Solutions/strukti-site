# Onde paramos — 03/10/2026

Registro do Claudinho para quem retomar o trabalho no PC novo.

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
  - manifest e página 404;
  - CSP e cabeçalhos de segurança (ADR-008).
- O texto aprovado pelo cliente está em `docs/landing-copy.md`, versão 1.7.

## Próximos passos

1. **Remontar o time** no PC novo (veja `README.md` nesta pasta). Com mais RAM, dá para rever a fila pesada e manter mais agentes ao mesmo tempo.
2. **Backlog técnico:**
   - **Q1:** estabilizar `Diagnostico.test.tsx` (foco no sucesso). Ele falhou 1 vez com a máquina sem folga de CPU e RAM.
   - **Q2:** `npm audit` aponta 7 vulnerabilidades, só no ferramental de build e lint (eslint-config-next, postcss, micromatch). Atualizar quando as versões corrigidas passarem a quarentena.
   - **H2:** conferir se os papéis gravados no Maestri já têm a cláusula de hierarquia e sub-agentes e a regra da fila. Os textos em `papeis/` já têm.
3. **V2:** mais vídeos de lançamento (`/brag`) de outros projetos no portfólio. É o foco futuro do site.
4. **L5, publicação** (só com o ok do cliente e as contas dele):
   - deploy na Vercel;
   - banco PostgreSQL para o formulário (`DATABASE_URL` só em `.env.local` e nas variáveis da Vercel);
   - endereço final em `SITE_URL`.
   - Antes de publicar, reavaliar o CSP com nonce (páginas dinâmicas) contra o CSP estático, medindo na própria Vercel.
5. **Prioridades seguintes do `CLAUDE.md`:** LGPD do app, base reaproveitável e revisão geral do app.

## Regras que não mudam

- Nunca inventar cases, depoimentos, números ou logos. A prova é o Rota de Vendas, com dados fictícios, e o Fleet Analytics BI, com dados reais autorizados pelo cliente.
- Push, deploy e conta em serviço externo só com o ok do cliente.
- Dependências com versões exatas e quarentena de 7 dias (`npm install --min-release-age=7` e `npm run check:quarantine`).
