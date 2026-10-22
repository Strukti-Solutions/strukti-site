# Site da Strukti Soluções

Site da Strukti Soluções, vitrine da marca-mãe: produtos de hardware (replay para quadras,
estacionamento inteligente) e aplicativos sob medida, com um formulário único de contato, em
que a pessoa escolhe o assunto (replay, estacionamento, aplicativo ou outro).

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

A aba provisória `/bancada` (testes de envio de clipes do replay ao
Cloudflare R2) só liga com as variáveis `R2_*` e `BANCADA_*`; sem elas,
responde 404. Ver [docs/bancada/README.md](docs/bancada/README.md).

`SITE_URL` ainda não tem valor final (domínio de produção é pendência de
publicação — ver `docs/landing-copy.md`, "Pendências"). É usado em
`metadataBase` (link de compartilhamento, canonical), `sitemap.xml` e
`robots.txt`. **Antes do lançamento, defina `SITE_URL` nas variáveis de
ambiente da Vercel** (produção e preview). Sem ele — vazio ou só com espaços
conta como ausente —, `getSiteUrl()` (`src/lib/siteUrl.ts`) usa:

- produção na Vercel: o domínio fixo do projeto
  (`VERCEL_PROJECT_PRODUCTION_URL`);
- preview na Vercel: o `VERCEL_URL` do próprio deploy;
- fora da Vercel: `http://localhost:3000`.

Nada disso quebra o build, mas o link de compartilhamento fica com o domínio
errado até alguém definir `SITE_URL`. Já um `SITE_URL` sem protocolo
(`https://`) quebra o build de propósito, para o erro não passar calado.

A tabela esperada no Postgres:

```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  interest TEXT NOT NULL CHECK (interest IN ('replay', 'estacionamento', 'aplicativo', 'outro')),
  problem TEXT NOT NULL,
  consent_at TIMESTAMPTZ NOT NULL,
  privacy_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Banco criado antes do campo "interesse" (ADR-009)? Migre nesta ordem:

1. **Antes do deploy**, crie a coluna com valor padrão `'aplicativo'`. Os leads
   antigos ficam com esse valor porque vieram do formulário de diagnóstico
   gratuito de aplicativos, o único que existia.

   ```sql
   ALTER TABLE leads ADD COLUMN interest TEXT NOT NULL DEFAULT 'aplicativo';
   ALTER TABLE leads ADD CONSTRAINT leads_interest_check
     CHECK (interest IN ('replay', 'estacionamento', 'aplicativo', 'outro'));
   ```

2. Faça o deploy do site novo.
3. **Só depois do deploy**, se quiser, tire o padrão (o código novo sempre
   manda o `interest`):

   ```sql
   ALTER TABLE leads ALTER COLUMN interest DROP DEFAULT;
   ```

Por que nessa ordem: sem a coluna, o código novo dá `500` em todo envio; com a
coluna sem padrão antes do deploy, quem dá `500` é o código antigo, que não
manda o `interest`.

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
| `npm run check:browser` | Com o site no ar (`npm run dev`), abre a página no Edge/Chrome headless a 360–1440px, com e sem reduced motion, rola até o fim (e falha se não chegar lá ou não ficar lá: um hero preso deixaria a página no topo) e falha se houver rolagem horizontal, erro no console (ex.: hidratação) ou violação de CSP. Antes, um controle positivo provoca uma violação de CSP de propósito (imagem de uma origem externa `.invalid`) e interrompe a checagem se o detector não a acusar. A 360, 390, 1024, 1100 e 1199px, também falha se o botão flutuante do WhatsApp (`a.fab-whatsapp`) cruzar a caixa de um controle focável em algum ponto da rolagem. Lê a variante do hero no HTML (`<main data-hero-variant>`, de `siteConfig.heroVariant`): com "estudio", a 1440×900 (lado a lado) e a 360×740 (celular, quadro em cima), confere que a rolagem troca o quadro do canvas (0 no topo, outro no meio da seção), que, com reduced motion, o hero fica no pôster, sem quadro desenhado e sem altura extra (a mesma altura da página sem JavaScript, com folga de 10% da tela), e que, com a animação, ao rolar até `#produtos` o fundo preso do hero já soltou: falha se ele ainda cobrir o topo da seção (pelo retângulo dele e pelo `elementFromPoint` em 6 pontos). Falha também se a seção `.hero-estudio` não existir; com outra variante, avisa "passo pulado". Na prévia aprovada em 13/10/2026, com a sequência de quadros desligada (`data-sequencia="desligada"` no hero; o símbolo é desenhado pelo fio), o passo do giro também avisa "passo pulado" e o resto da checagem segue. Com "expansao", a 1440×900, 360×740 e 740×360 (`.hero-expansao`, pelos atributos `data-pin`, `data-expanded`, `data-progress` e `data-content` e pela geometria de verdade): sem JavaScript, a composição parada e legível, com os dois botões clicáveis; com a roda do mouse (eventos do CDP), o progresso só sobe, o palco fica preso cobrindo a tela, o quadro cresce de fato e segue as fórmulas do original em cada amostra (largura min(300 + 1250p, 95vw), altura min(400 + 400p, 85vh, a tela menos duas barras), 650 e 200 abaixo de 768 px, e a 1ª linha do título a −p × 150vw, 180vw abaixo de 768 px), o título se abre, o fundo some, o conteúdo aparece e a altura do hero não muda, depois a roda rola até `#produtos` (topo livre) e, no topo, a roda para cima recolhe; com o teclado (Page Down, Espaço, seta, End, Home), o mesmo; as âncoras (o link `#produtos` da barra fixa, clicado sem rolar antes, e `/#contato` aberto direto) terminam no alvo e continuam lá 1,5 s depois; um clique no quadro preso não cai na mídia nem expande, e o Tab até o controle do vídeo não rola nem expande; com cores forçadas (a 1440), o ícone do controle tem contraste ≥ 3:1 nos dois estados; com reduced motion, nunca prende e a página rola. À parte, com o espaçamento de texto da WCAG 1.4.12 a 320×568 (barra de rolagem clássica) e 320×640 (celular) e no zoom de 400% (320×256 a 4×, sem o espaçamento), a linha de apoio e a dica não passam por baixo do controle do vídeo nem saem da largura, e a linha de apoio termina dentro da tela presa, e, com toque de verdade a 390×844 (toque emulado), um dedo arrastado 100 px expande metade e segura e uma pinça amplia a página sem mexer no hero. Depois, exercita as interações: abre o menu e sai com Tab (o foco não pode ficar coberto nem invisível), toca os vídeos do painel do catálogo (só um por vez na página, o do hero incluído) e percorre a página inteira com Tab a 360, 390, 1024 e 1200px, falhando se um controle focado parar sob a barra fixa do topo, coberto ou invisível (opacidade efetiva abaixo de 0,5, depois das transições). Por fim, aplica o espaçamento de texto da WCAG 1.4.12 de 360 a 1440px e falha se algo da barra (ou do painel do Menu) sair da tela ou do container, ou se a barra cobrir a moldura do hero (ou o quadro e o título do "expansao"). **Etapa do catálogo** (`#produtos`), a 1440×900 e a 360×740, com uma linha de log por item: sem JavaScript (10 cartões, fileira que rola de lado, `<details>` que abre); abrir e fechar com o mouse (a URL vai a `#slug` e volta); **altura constante** (o topo da seção seguinte fica no mesmo lugar, na tela e no documento, fechado, aberto, trocando, com o filtro e fechado de novo); teclado (← → no lateral, na pílula, no vídeo e no título, Enter, Esc devolvendo o foco); miniaturas e filtro; link direto `/#rota-de-vendas` e o voltar do navegador; movimento reduzido instantâneo; o loop do cartão parando em até 5,5 s; um vídeo por vez; menu "Produtos ▾" da barra; toque a 360 px (deslizar na horizontal troca, na vertical rola a página); cores forçadas; o espaçamento de texto da WCAG 1.4.12 a 320 px; e o texto do cartão do centro nos 10 produtos a 360×740, 390×844 e 1440×900 (no tamanho padrão cabe sem rolar, com a etiqueta e o selo sobre o véu opaco; com o 1.4.12 e com a fonte raiz a 200%, a etiqueta, o nome e o "Ver detalhes" alcançáveis pela rolagem de dentro do cartão). Mostra qual elemento passou da borda ou foi coberto. Navegador detectado sozinho, ou `BROWSER_PATH`. `CHECK_BROWSER_ETAPAS` (`larguras`, `hero`, `expansao`, `catalogo`, `interacao`, separadas por vírgula) roda só as etapas pedidas; sem ela, roda tudo (cerca de 12 min, a do catálogo em ~2,5 min) |

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
    sections/               um componente por seção da home, na ordem da página:
      HeroExpansao.tsx        hero "expansao", o padrão (ui/scroll-expansion-hero.tsx + o vídeo de HeroVideoMedia.tsx)
      HeroSequence.tsx        hero "estudio", o hero de marca da v2.2 (+ HeroSequenceScroller.tsx)
      Catalogo.tsx            a seção #produtos: título, introdução e o catálogo (components/catalogo/)
      ChamadaHardware.tsx     "Tem um problema que pede hardware?"
      ComoResolvemos.tsx      "Como trabalhamos" (etapas)
      Equipe.tsx              nomes e cursos
      Contato.tsx             formulário único, com o assunto (interesse)
      Faq.tsx, Rodape.tsx     dúvidas (antes do Contato) e rodapé
    catalogo/               o catálogo de produtos (coverflow, painel e fita):
                              CatalogoInterativo.tsx (raiz cliente), Coverflow.tsx, CartaoProduto.tsx,
                              PainelProduto.tsx, FitaMiniaturas.tsx, FiltroTipo.tsx, FundoAmbiente.tsx,
                              CartaoLoop.tsx; estado.ts (redutor puro), useCatalogo.ts (histórico e âncoras),
                              movimento.ts (durações)
    MenuProdutos.tsx        o menu "Produtos ▾" da barra do topo (dentro de TopBar.tsx)
    spike/                  protótipos da prévia v2.2: FioPrototipo.tsx (o fio condutor) e
                            HeroOpcao.tsx (as 3 opções do hero de marca, ?hero=a|c)
    ui/                     peças do design system v3 (Palco, SeloStatus, FichaTecnica),
                            blackhole-hero-section (o buraco negro do hero "classic") e
                            scroll-expansion-hero (o quadro que cresce do hero "expansao")
    InterestLink.tsx        link para #contato que já marca o assunto do formulário
    FloatingWhatsApp.tsx    botão flutuante do WhatsApp (todas as telas)
  config/site.ts            dados de contato, equipe, versão do aviso de privacidade e do hero
  content/landing.ts        todo o texto da página, incluindo o aviso de privacidade
  content/catalogo.ts       os 10 itens do catálogo (CATALOGO) e a microcopy dele (catalogoUi)
  lib/
    heroSequence.ts         matemática do hero "estudio" (progresso → quadro, conjunto, URLs)
    interest.ts             assuntos do formulário e o evento que marca o assunto
    validation.ts           schema Zod compartilhado (cliente + servidor)
    rateLimit.ts             limite de taxa simples em memória
    repository/              interface + implementação Postgres para gravar leads
```

O texto em `src/content/landing.ts` é o texto aprovado pelo Thiago em
`docs/landing-copy.md` (v2.2, aprovada para homologação em 13/10/2026; o
texto novo do hero "expansao" é proposta, aguardando aprovação). Qualquer mudança de texto deve primeiro ser
aprovada nesse documento e só depois replicada aqui.

### Como trocar o visual do hero

Há quatro versões do topo da página (barra + hero), escolhidas numa linha de
`src/config/site.ts`:

```ts
heroVariant: "expansao", // ou "estudio", "video" ou "classic"
```

O `page.tsx` liga cada valor ao seu hero num `Record<HeroVariant, …>`: uma
variante nova sem hero ali é erro de tipo.

- `"expansao"` (padrão) — `HeroExpansao.tsx` + `TopBar.tsx`: o quadro com o
  vídeo "Fim de expediente" cresce com a roda ou o toque até quase a tela
  inteira, o fundo se apaga, o título se abre para os lados e, com a
  expansão completa, aparecem o texto do hero de marca da v2.2 e os botões
  (`MASTER.md` §9.8, ADR-010).
- `"estudio"` — `HeroSequence.tsx` + `TopBar.tsx`: na v2.2, o hero de
  marca (as 3 opções de texto, com a sequência de quadros do 3D desligada
  e o símbolo desenhado pelo fio, `src/components/spike/FioPrototipo.tsx`).
  O giro do 3D guiado pela rolagem segue no código (`SEQUENCIA_DESLIGADA`
  em `HeroSequenceScroller.tsx`).
- `"video"` — `HeroVideo.tsx` + `TopBar.tsx`: vídeo de fundo, a
  palavra "Strukti" gigante e a barra fixa no topo, de borda a borda, com
  menu recolhível abaixo de 75em, 1200px com a fonte padrão (`MASTER.md`
  §8.3.1 e §9.6, ADR-007 e as notas TB1 e TB2).
- `"classic"` — `Hero.tsx` + `Header.tsx`: o hero anterior, com o fundo
  trocável descrito abaixo.

Nos heros "expansao" e "estudio", as 3 opções do texto do hero de marca da v2.2 ficam
acessíveis por `?hero=a` e `?hero=c` (sem a chave, a B), para comparar: no
"expansao", elas trocam a linha de apoio, o H2 e a frase do conteúdo. Os 3
passos do replay ("Como funciona") saíram do site na v2.2.

**O hero "expansao"** (`MASTER.md` §9.8, ADR-010) é o `ScrollExpandMedia`
do 21st.dev (licença MIT, `src/components/ui/scroll-expansion-hero.tsx`,
aviso em `THIRD_PARTY_NOTICES.md`), adaptado sem framer-motion: o progresso
vai para a propriedade CSS `--hx-p`, e o tamanho do quadro, o deslize do
título e o apagar do fundo são `calc()` no `globals.css` (bloco "Hero
expansao"). Enquanto o quadro cresce, a roda e o toque fazem a expansão
andar em vez de rolar a página (exceção controlada, a pedido do dono); uma
rolagem que o hero não causou (âncora, barra de rolagem, foco) completa a
expansão, e um link direto para uma âncora (ex.: `/#contato`) já abre
expandido. Sem JavaScript ou com reduced motion, fica a composição parada
(quadro pequeno com o pôster, título e linha de apoio), com a abertura e os
botões logo abaixo, e a página rola normalmente. O texto fica em
`landingContent.heroExpansao` (o título e a dica são proposta, aguardando
aprovação; a linha de apoio, o H2, a frase e os botões são os do hero de
marca da v2.2).

**Trocar a mídia do hero "expansao":** os arquivos ficam em
`public/hero/expansao/` com nomes e tamanhos fixos, apontados em
`siteConfig.heroExpansao`: `fundo.avif`/`fundo.jpg` (1920 × 1080),
`fundo-retrato.avif`/`fundo-retrato.jpg` (1080 × 1920, telas em pé),
`midia.webm` (VP9) e `midia.mp4` (H.264), 1280 × 720, loop mudo de 10 s sem
emenda, e `midia-poster.avif`/`midia-poster.jpg` (1280 × 720, o 1º quadro do
vídeo; é o LCP da página e vai com prioridade alta). Basta sobrescrever com os mesmos nomes (a mídia atual é a
final, "Fim de expediente"). O corte das imagens fica em
`.hero-expansao` no `globals.css` (`--hx-fundo-pos`, `--hx-fundo-pos-retrato`
e `--hx-midia-pos`). A mídia precisa ser escura atrás do título e das
legendas (limites de luminância no `MASTER.md` §3.4). Para gerar a mídia de novo
(a cena, os passes, o loop e as codificações), veja
`scripts/hero-expansao/README.md`.

**O hero "estudio"** (`MASTER.md` §9.7) desenha num `<canvas>` uma sequência
de quadros AVIF pré-renderizada em `public/hero/sequencia/` (90 quadros de
1600 × 1000 no computador; 45 de 800 × 900 até 767px), escolhida pela
rolagem dentro da seção (`HeroSequenceScroller.tsx`, com a matemática em
`src/lib/heroSequence.ts`). O pôster (quadro 0, AVIF com JPG de reserva) vem
no HTML; com reduced motion, "economizar dados", sem JavaScript ou se os
quadros falharem, o hero fica parado no pôster e a seção perde a altura
extra. Os quadros saem do Blender e do encode descritos em
`scripts/hero-3d/README.md`; os tamanhos ficam em `siteConfig.heroSequence`.

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

### Como trocar um item do catálogo

A seção Produtos (`#produtos`) é um catálogo de 10 itens em coverflow: fechado, os cartões; aberto, um painel com abas (Visão geral, Como funciona, Telas) e a fita de miniaturas. Os 3 primeiros são produtos reais (Replay, Rota de Vendas, Fleet Analytics BI); os outros 7 são **fictícios**, para mostrar a escala, e estão no site por decisão do dono (ADR-011).

1. Abra `src/content/catalogo.ts` e procure `ficticio: true`. Cada item tem `slug`, `tipo`, `nome`, `frase`, `fase` (o selo), `arte`, `painel` (vídeo, "Para quem é", benefícios, 3 passos e 3 telas), `siteUrl` e `interesse` (o assunto do formulário no "Quero saber mais"). Ao trocar um fictício por um produto de verdade, tire o `ficticio: true`, ajuste a `fase` e escreva o texto (o texto novo passa antes pela aprovação em `docs/landing-copy.md`; limites de tamanho na spec, §5.3). Nada de cliente, instalação ou resultado que não exista.
2. Troque a arte em `public/catalogo/<slug>/` **com os mesmos nomes** de arquivo: `cartao.avif`/`.jpg` (800×1200), `cartao-480.avif`/`.jpg` (480×720), `tela-1.svg` a `tela-3.svg` e, só nos reais, `cartao-loop.webm`/`.mp4` (600×900, 5 s). O `public/catalogo/LEIA-PROVISORIO.txt` diz que os arquivos de hoje são provisórios.
3. Rode `npx vitest run src/content/catalogo.assets.test.ts`: ele confere as medidas e o orçamento de bytes de cada arquivo (spec §6.1).
4. Com a arte final, repita a medida de contraste do texto do cartão do centro: `node scripts/catalogo-arte/medir-contraste.mjs` (MASTER §3.4).
5. Para um item novo (não só trocar), os testes de `src/content/catalogo.test.ts` conferem a ordem, os tipos, os fictícios, os limites de texto e os interesses dos 10 itens atuais: atualize-os junto. Depois rode o `npm run check:browser` (a etapa do catálogo mede cada item).

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
- `Content-Security-Policy` estática em `next.config.ts` (ADR-008):
  `default-src 'self'`, `script-src 'self' 'unsafe-inline'` (mais
  `'unsafe-eval'` só em desenvolvimento — o devtool do webpack do Next
  roda cada módulo por `eval()` nesse modo), `style-src 'self'
  'unsafe-inline'` (o `style={{...}}` do React vira atributo `style=""`
  literal no HTML do servidor; CSP não tem nonce para atributo), `img-src`/
  `font-src`/`media-src`/`connect-src 'self'`, `object-src 'none'`,
  `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`,
  `upgrade-insecure-requests`. Sem nonce por requisição porque a página não
  renderiza conteúdo de usuário nem carrega script de terceiro — se isso
  mudar um dia, reavalie (ver ADR-008). Ao mexer em domínios externos
  (fonte, vídeo, script de terceiro), ajuste a CSP ali e rode
  `npm run check:browser` de novo — ela cobre os quadros do hero, os vídeos
  dos aplicativos **e falha em qualquer violação de CSP** (fonte/imagem/mídia/
  script bloqueado), não só erro de console.
- A rota `POST /api/diagnostico` exige `Content-Type: application/json`, confere
  que a origem bate com o host (quando o cabeçalho `Origin` vem preenchido),
  valida no servidor com Zod, tem honeypot e limite de taxa.

## LGPD

O formulário de contato coleta nome, empresa, WhatsApp, o assunto (interesse)
e a mensagem. A gravação exige consentimento explícito (checkbox não pré-marcado),
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
   funcionam sozinhos via `SITE_URL` ou, sem ele, pelas variáveis da Vercel
   (ver "Configuração");
   `landingContent.seo.ogUrl` não alimenta tag nenhuma, é só o lembrete do
   `check:placeholders`. Falta só o texto que um humano lê: a mensagem de
   compartilhamento da equipe (`docs/landing-copy.md`). Definir `SITE_URL`
   na Vercel antes do lançamento continua pendente.
3. **Curso de cada pessoa da equipe** — `siteConfig.team[].course`
   (`src/config/site.ts`), hoje 4 vezes `[A PREENCHER: curso]`.

O grupo decide se bloqueia: **fotos da equipe**. A página funciona com as
iniciais no hexágono.

Não bloqueia: **endereço do site próprio do replay**
(`landingContent.produtos.replay.siteUrl`). Enquanto for `null`, o link "Ver o
site do replay" fica escondido.

Não publicar (fazer deploy real) enquanto essas pendências não forem resolvidas.
Rode `npm run check:placeholders` antes do deploy para confirmar.
