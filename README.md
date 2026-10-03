# Site da Strukti Soluções

Landing page da Strukti Soluções, organizada pelos problemas do nicho (distribuidoras e
indústrias pequenas), com formulário de diagnóstico gratuito.

## Stack

- Next.js (App Router) + React + TypeScript estrito
- PostgreSQL (via `pg`), para gravar os leads do formulário
- Zod para validação (compartilhada entre cliente e servidor)
- Vitest + Testing Library + axe-core para testes
- Fonte Geologica (variável, com o eixo `SHRP`) via `next/font/google`: baixada
  em tempo de build e servida pelo próprio site (self-hosted). Não há requisição
  a servidor externo em tempo de execução — decisão confirmada com o Claudinho.
- Design system: `design-system/strukti-solucoes/MASTER.md` (fonte da verdade
  visual, ADR-006); tokens e classes em `src/app/globals.css`; marca em SVG em
  `public/brand/`.

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
SITE_URL=https://dominio-de-producao
```

Sem `DATABASE_URL`, o site sobe e funciona normalmente, mas a rota
`POST /api/diagnostico` responde `503` com uma mensagem clara em vez de quebrar.

`SITE_URL` ainda não tem valor final (domínio de produção é pendência de
publicação — ver `docs/landing-copy.md`, "Pendências"). É usado em
`metadataBase` (link de compartilhamento, canonical), `sitemap.xml` e
`robots.txt`. **Antes do lançamento, defina `SITE_URL` nas variáveis de
ambiente da Vercel** (produção e preview); sem ele, o site cai sozinho no
`VERCEL_URL` de cada deploy e, fora da Vercel, em `http://localhost:3000` —
nunca quebra o build, mas o link de compartilhamento fica com o domínio
errado até alguém definir `SITE_URL`.

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
| `npm run check:browser` | Com o site no ar (`npm run dev`), abre a página no Edge/Chrome headless a 360–1440px, com e sem reduced motion, rola até o fim e falha se houver rolagem horizontal ou erro no console (ex.: hidratação). A 360 e 390px, também falha se o botão flutuante do WhatsApp (`a.fab-whatsapp`) cruzar a caixa de um controle focável em algum ponto da rolagem. Depois, exercita as interações: abre o menu e sai com Tab (o foco não pode ficar coberto), toca os vídeos do portfólio (só um por vez) e percorre a página inteira com Tab a 360, 390 e 1024px, falhando se um controle focado parar sob a barra fixa do topo. Mostra qual elemento passou da borda ou foi coberto. Navegador detectado sozinho, ou `BROWSER_PATH` |

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

Há duas versões do topo da página (barra + hero), escolhidas numa linha de
`src/config/site.ts`:

```ts
heroVariant: "video", // ou "classic"
```

- `"video"` (padrão) — `HeroVideo.tsx` + `TopBar.tsx`: vídeo de fundo, a
  palavra "Strukti" gigante e a barra fixa no topo, de borda a borda, com
  menu recolhível abaixo de 1024px (`MASTER.md` §8.3.1 e §9.6, ADR-007 e a
  nota TB1).
- `"classic"` — `Hero.tsx` + `Header.tsx`: o hero anterior, com o fundo
  trocável descrito abaixo.

**Trocar o vídeo do hero "video":** os arquivos ficam em
`public/video/hero/` (servidos pelo site, nunca de CDN) e são apontados em
`siteConfig.heroVideo`: um recorte deitado e um em pé, cada um com o MP4 e
o pôster em AVIF e JPG (o pôster é o 1º quadro do loop). Vídeo novo só com
licença de uso comercial conferida, registrada em `THIRD_PARTY_NOTICES.md`.
Como o atual foi tratado (loop, tom, recortes): `docs/hero-video-opcoes/README.md`.
Com `heroVideo: null` o hero fica só com a base, o grão e o véu.

O hero "classic" (`src/components/sections/Hero.tsx`) é uma pilha de
camadas (design system, `MASTER.md` §9). Só a camada do visual é trocável:

- **`HeroContent`** — o texto aprovado e os botões. Sempre o mesmo, não
  importa o visual de fundo.
- **`HeroBackground`** — a base na cor do "espaço" (`navy-950`), a peça de
  fundo escolhida em `siteConfig.heroVisual` (`src/config/site.ts`) e, por
  cima dela, o véu do design system, que garante o contraste do texto com
  qualquer visual. A composição é lado a lado a partir de 1024px e em faixa
  (texto em cima, visual embaixo) abaixo disso — tudo em `globals.css`,
  seção "Hero".

Para **trocar entre os visuais do classic que já existem**, mude uma linha
em `src/config/site.ts`:

```ts
heroVisual: "blackhole", // ou "static"
```

- `"blackhole"` — `HeroVisualBlackhole.tsx`: o buraco negro (WebGL), com o
  disco nas cores da marca. `HeroVisualStatic` fica por baixo, escondido; se o
  navegador não tiver WebGL ou perder o contexto, o componente marca
  `data-webgl` e o CSS mostra o visual estático — sem nenhum código extra.
- `"static"` — `HeroVisualStatic.tsx`: o fundo do tema sem WebGL — o símbolo
  da Strukti em vista explodida (`public/brand/strukti-encaixe.svg`) com uma
  luz azul atrás.

Para **acrescentar um visual novo**, sem mexer em `HeroContent` nem no resto
da página:

1. Crie um componente em `src/components/sections/` que implemente
   `HeroVisualProps` (`src/components/sections/hero-visual.ts`) — ele recebe
   `narrow` (true abaixo de 1024px, na composição em faixa) e deve preencher
   sozinho a área do hero (`absolute inset-0` ou equivalente), respeitando o
   ponto focal e a área livre do texto (`MASTER.md` §9.1–9.2).
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
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`). `X-Powered-By`
  desligado.
- `Content-Security-Policy` fica em `src/middleware.ts`, com um nonce novo a
  cada requisição (`script-src 'nonce-…' 'strict-dynamic'`, sem
  `unsafe-inline` em script); um valor estático em `next.config.ts` não
  consegue gerar nonce por requisição. `style-src` mantém `unsafe-inline`
  porque `style={{...}}` do React vira atributo `style=""` literal no HTML
  do servidor (CSP não tem nonce para atributo). Ao mexer em domínios
  externos (fonte, vídeo, script de terceiro), ajuste a CSP ali e rode
  `npm run check:browser` de novo — ela já cobre o vídeo do hero e do
  portfólio.
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

## Backups

Antes de uma mudança grande (ex.: trocar o hero), cria-se um ponto de restauração
fora do git normal: uma tag anotada no repositório e um bundle completo fora da
pasta do projeto.

Backup de 2026-10-01 (antes do hero novo — DS Encaixe + buraco negro):

- Tag: `backup/2026-10-01-ds1-encaixe` (aponta para `f0eeaef`, ponta do `main`
  na época).
- Bundle e capturas: fora do repositório, na máquina que fez o backup (pasta
  `_backup/negocio/` ao lado da pasta do projeto — o caminho exato depende de
  onde está `C:/dev` nessa máquina). O bundle tem o histórico completo, todas
  as refs; as capturas são a cópia de `docs/capturas-ds1/`.

### Como voltar a um estado salvo

A tag é só um ponto de consulta: **nunca** `git reset --hard` nem reescreva o
`main` a partir dela — o fluxo do grupo é só merge, histórico nunca se
reescreve. Para olhar o estado da tag sem mudar o branch atual:

```bash
git switch --detach backup/2026-10-01-ds1-encaixe
```

Para trazer esse conteúdo de volta, crie um branch curto, restaure os
arquivos a partir da tag e passe pela revisão normal (commit → revisão →
merge no `main`, como qualquer outra mudança):

```bash
git switch -c volta-ao-backup
git restore --source=backup/2026-10-01-ds1-encaixe --staged --worktree :/
git commit -m "revert: volta ao estado do backup/2026-10-01-ds1-encaixe"
```

Pelo bundle, só se o repositório local for perdido (clona a partir do arquivo
do bundle, no caminho onde ele estiver guardado):

```bash
git clone <caminho-do-bundle>/negocio_20261001_ds1.bundle negocio-restaurado
```

## Pendências que bloqueiam a publicação (L5)

Estas pendências vêm de `docs/landing-copy.md` e também aparecem, marcadas como
`[A PREENCHER]`, no próprio conteúdo do site (`src/content/landing.ts`,
`landingContent.pendencias`):

1. **Aviso de privacidade** — nomes dos provedores de hospedagem e de banco de
   dados, e se guardam dados fora do Brasil.
2. **Endereço do site** — `metadataBase`, `sitemap.xml` e `robots.txt` já
   funcionam sozinhos via `SITE_URL`/`VERCEL_URL` (ver "Configuração"); falta
   só o texto que um humano lê: o `og:url` de `landingContent.seo` e a
   mensagem de compartilhamento da equipe (`docs/landing-copy.md`). Definir
   `SITE_URL` na Vercel antes do lançamento continua pendente.

Não publicar (fazer deploy real) enquanto essas pendências não forem resolvidas.
Rode `npm run check:placeholders` antes do deploy para confirmar.
