# Site da Strukti Soluções

Landing page da Strukti Soluções, organizada pelos problemas do nicho (distribuidoras e
indústrias pequenas), com formulário de diagnóstico gratuito.

## Stack

- Next.js (App Router) + React + TypeScript estrito
- PostgreSQL (via `pg`), para gravar os leads do formulário
- Zod para validação (compartilhada entre cliente e servidor)
- Vitest + Testing Library + axe-core para testes

## Como rodar

```bash
npm install
npm run dev
```

Abre em `http://localhost:3000`.

> A máquina de desenvolvimento deste time costuma ter pouca RAM livre. Confira a RAM
> disponível antes de rodar `npm install` ou `npm run build`, e evite rodar mais de um
> processo pesado (dev server, build, testes) ao mesmo tempo. Sempre encerre o
> `npm run dev` ao terminar — não deixe processo órfão.

## Configuração

Crie um arquivo `.env.local` (nunca commitado) com:

```
DATABASE_URL=postgres://usuario:senha@host:porta/banco
```

Sem `DATABASE_URL`, o site sobe e funciona normalmente, mas a rota
`POST /api/diagnostico` responde `503` com uma mensagem clara em vez de quebrar.

A tabela esperada no Postgres:

```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  problem TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Scripts

| Comando            | O que faz                                   |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Sobe o servidor de desenvolvimento           |
| `npm run build`     | Build de produção                            |
| `npm run start`     | Roda o build de produção                     |
| `npm run lint`      | ESLint                                       |
| `npm run typecheck` | `tsc --noEmit`                               |
| `npm run test`      | Testes (Vitest), incluindo validação, a rota de API e acessibilidade (axe) |

## Estrutura

```
src/
  app/                     rotas (App Router)
    api/diagnostico/       rota de API do formulário
    privacidade/           aviso de privacidade (LGPD)
  components/
    sections/               um componente por seção da landing page
  config/site.ts            dados de contato e equipe
  content/landing.ts        todo o texto da página (⚠ atualmente provisório)
  lib/
    validation.ts           schema Zod compartilhado (cliente + servidor)
    rateLimit.ts             limite de taxa simples em memória
    repository/              interface + implementação Postgres para gravar leads
```

O texto em `src/content/landing.ts` está marcado como **provisório**: assim que o
texto de `docs/landing-copy.md` for aprovado pelo cliente, ele deve substituir esse
arquivo, mantendo a mesma estrutura.

## Acessibilidade

- Testado com `axe-core` (ver `src/app/page.axe.test.tsx`).
- Layout mobile-first, testado a partir de 360px de largura.
- Foco visível em todos os elementos interativos, navegação por teclado, labels em
  todos os campos do formulário.

## LGPD

O formulário de diagnóstico coleta nome, empresa, WhatsApp e a descrição do
problema. A gravação exige consentimento explícito (checkbox não pré-marcado) e o
aviso de privacidade está em `/privacidade`. A rota de API nunca loga os dados
pessoais enviados.
