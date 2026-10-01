# Site da Strukti Soluções

Landing page da Strukti Soluções, organizada pelos problemas do nicho (distribuidoras e
indústrias pequenas), com formulário de diagnóstico gratuito.

## Stack

- Next.js (App Router) + React + TypeScript estrito
- PostgreSQL (via `pg`), para gravar os leads do formulário
- Zod para validação (compartilhada entre cliente e servidor)
- Vitest + Testing Library + axe-core para testes
- Fonte Inter via `next/font/google`: baixada em tempo de build e servida pelo
  próprio site (self-hosted). Não há requisição a servidor externo em tempo de
  execução — decisão confirmada com o Claudinho.

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

Defina `NEXT_TELEMETRY_DISABLED=1` no ambiente (local e de deploy) para desligar a
telemetria do Next.js.

### Dependências: quarentena de 7 dias

Todas as versões no `package.json` são exatas. Nada publicado nos últimos 7 dias
entra no projeto, direto ou transitivo (ADR-003):

- O `.npmrc` do projeto tem `min-release-age=7`, então todo `npm install` já
  ignora versões recentes — o mesmo que rodar:

  ```bash
  npm install --min-release-age=7
  ```

- Quando um range (`^`, `~`) de dependência ainda resolver uma transitiva
  recente, fixe a versão em `overrides` no `package.json`.
- `npm run check:quarantine` confere o `package-lock.json` inteiro e falha se
  algum pacote tiver menos de 7 dias.
- O CLI do shadcn não fica no `package.json`: rode sob demanda, com a versão
  fixada (`npx shadcn@4.21.0 ...`).

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
  consent_at TIMESTAMPTZ NOT NULL,
  privacy_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

`consent_at` e `privacy_version` registram quando a pessoa consentiu e qual versão
do aviso de privacidade estava em vigor (LGPD, art. 8º — o controlador precisa
conseguir comprovar o consentimento). A versão vigente fica em
`src/config/site.ts` (`privacyPolicyVersion`).

## Scripts

| Comando            | O que faz                                   |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Sobe o servidor de desenvolvimento           |
| `npm run build`     | Build de produção                            |
| `npm run start`     | Roda o build de produção                     |
| `npm run lint`      | ESLint                                       |
| `npm run typecheck` | `tsc --noEmit`                               |
| `npm run test`      | Testes (Vitest): validação, rota de API, formulário, acessibilidade (axe) e hidratação da página inteira com e sem prefers-reduced-motion |
| `npm run check:placeholders` | Falha se sobrar `[A PREENCHER` em `src/` — rodar antes do deploy (L5) |
| `npm run check:quarantine` | Falha se algum pacote do `package-lock.json` (direto ou transitivo) tiver menos de 7 dias de publicado — ver docs/DECISOES.md (ADR-003) |
| `npm run check:browser` | Com o site no ar (`npm run dev`), abre a página no Edge/Chrome headless a 360–1440px, com e sem reduced motion, rola até o fim e falha se houver rolagem horizontal ou erro no console (ex.: hidratação). Mostra qual elemento passou da borda. Navegador detectado sozinho, ou `BROWSER_PATH` |

### Definição de pronto

Toda tarefa só está pronta com, nesta ordem:

1. `npm run typecheck`, `npm run lint` e `npm run test` passando. O `test`
   inclui `src/app/page.hydration.test.tsx`: a página inteira hidrata sem
   `onRecoverableError` e sem nenhum `console.error`, com prefers-reduced-motion
   ligado e desligado (ADR-004).
2. `npm run check:quarantine` passando.
3. `npm run build` passando — com o servidor de desenvolvimento **parado** (o
   build reescreve o `.next`).
4. `npm run check:browser` passando, com o site no ar de novo (`npm run dev`).

## Estrutura

```
src/
  app/                     rotas (App Router)
    api/diagnostico/       rota de API do formulário
    privacidade/           aviso de privacidade (LGPD)
    opengraph-image.tsx    imagem de compartilhamento gerada por código (next/og)
  components/
    sections/               um componente por seção da landing page
    FloatingWhatsApp.tsx    botão flutuante do WhatsApp (todas as telas)
  config/site.ts            dados de contato, equipe e versão do aviso de privacidade
  content/landing.ts        todo o texto da página, incluindo o aviso de privacidade
  lib/
    validation.ts           schema Zod compartilhado (cliente + servidor)
    rateLimit.ts             limite de taxa simples em memória
    repository/              interface + implementação Postgres para gravar leads
```

O texto em `src/content/landing.ts` é o texto aprovado pelo cliente em
`docs/landing-copy.md` (v1.1). Qualquer mudança de texto deve primeiro ser
aprovada nesse documento e só depois replicada aqui.

### Como trocar o visual do hero

O hero (`src/components/sections/Hero.tsx`) é dividido em duas camadas
independentes:

- **`HeroContent`** — o texto aprovado e os botões. Sempre o mesmo, não
  importa o visual de fundo.
- **`HeroBackground`** — escolhe e renderiza a peça de fundo, com base em
  `siteConfig.heroVisual` (`src/config/site.ts`).

Para **trocar entre os visuais que já existem**, mude uma linha em
`src/config/site.ts`:

```ts
heroVisual: "blackhole", // ou "static"
```

- `"blackhole"` — `HeroVisualBlackhole.tsx`: o buraco negro (WebGL), com
  `HeroVisualStatic` atrás como fundo de verdade — é o que aparece se o
  navegador não tiver WebGL ou perder o contexto, sem precisar de nenhum
  código extra.
- `"static"` — `HeroVisualStatic.tsx`: só o fundo do tema (gradiente nos tons
  da marca), sem WebGL.

Para **acrescentar um visual novo**, sem mexer em `HeroContent` nem no resto
da página:

1. Crie um componente em `src/components/sections/` que implemente
   `HeroVisualProps` (`src/components/sections/hero-visual.ts`) — ele recebe
   `narrow` (true abaixo de 768px) e deve preencher sozinho a área do hero
   (`absolute inset-0 h-full w-full` ou equivalente).
2. Acrescente uma entrada no mapa `HERO_VISUALS` de
   `src/components/sections/HeroBackground.tsx` e no tipo `HeroVisual` de
   `src/config/site.ts`.

### Limite de taxa

`src/lib/rateLimit.ts` guarda as tentativas em memória, por instância do
servidor. Em produção serverless com várias instâncias, o limite vale por
instância, não no total — é uma proteção básica contra abuso simples, não uma
defesa distribuída contra spam coordenado.

## Acessibilidade

- Testado com `axe-core` (ver `src/app/page.axe.test.tsx`).
- Layout mobile-first, testado a partir de 360px de largura.
- Foco visível em todos os elementos interativos, navegação por teclado, labels em
  todos os campos do formulário, erros ligados aos campos por `aria-describedby`
  e foco levado ao primeiro campo inválido ao tentar enviar.
- `scroll-padding-top` compensa o cabeçalho fixo ao navegar pelas âncoras do menu.

## Segurança

- Cabeçalhos de segurança em `next.config.ts` (`X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`).
  `X-Powered-By` desligado.
- A rota `POST /api/diagnostico` exige `Content-Type: application/json`, confere
  que a origem bate com o host (quando o cabeçalho `Origin` vem preenchido),
  valida no servidor com Zod, tem honeypot e limite de taxa.

## LGPD

O formulário de diagnóstico coleta nome, empresa, WhatsApp e a descrição do
problema. A gravação exige consentimento explícito (checkbox não pré-marcado),
registra `consent_at` e `privacy_version`, e o aviso de privacidade completo está
em `/privacidade`. A rota de API nunca loga os dados pessoais enviados; para
conter spam, registra por pouco tempo o IP de quem envia (declarado no aviso).

O aviso promete apagar os dados até 12 meses depois do último contato
(`landingContent.privacidade`). **Ainda não há rotina automática para isso** —
por ora, a exclusão é manual:

```sql
DELETE FROM leads WHERE created_at < NOW() - INTERVAL '12 months';
```

Quem roda essa consulta e com que frequência ainda não foi decidido com o
Claudinho; decidir isso antes da publicação (L5) ou assim que houver o
primeiro lead.

## Pendências que bloqueiam a publicação (L5)

Estas pendências vêm de `docs/landing-copy.md` e também aparecem, marcadas como
`[A PREENCHER]`, no próprio conteúdo do site (`src/content/landing.ts`,
`landingContent.pendencias`):

1. **Aviso de privacidade** — nomes dos provedores de hospedagem e de banco de
   dados, e se guardam dados fora do Brasil.
2. **Endereço do site** — usado no `og:url`, na mensagem de compartilhamento da
   equipe e, depois, em `metadataBase`.

Não publicar (fazer deploy real) enquanto essas pendências não forem resolvidas.
Rode `npm run check:placeholders` antes do deploy para confirmar.
