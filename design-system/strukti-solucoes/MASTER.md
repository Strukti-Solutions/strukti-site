# Design System — Strukti Soluções · v3 ("Estúdio")

> **Natureza deste arquivo:** fonte da verdade visual do site (tarefa DS1,
> ADR-006). Cor, tipografia, espaçamento, raios, elevação, motion e
> aparência dos componentes nascem aqui; `src/app/globals.css` (tokens) e
> `src/fonts/index.ts` (fonte) **implementam** este arquivo. Se o código
> divergir, é defeito do código: corrija o código, ou mude primeiro este
> arquivo (com ADR, se a decisão for relevante). Dono: Nanquim (Designer).
> Substitui a v2 ("Encaixe") no conceito, na luz e nos componentes novos (ADR-009); tudo da v2 que este arquivo não muda continua valendo.

---

## 1. Conceito

**Estúdio.** A Strukti mostra os produtos como peças de vitrine, sob luz controlada: o objeto (ou a tela do aplicativo) é o herói, num palco escuro. É a promessa da marca-mãe de hardware + IA: engenharia que se pode ver de perto.

**Escuro para mostrar, claro para ler.** O escuro é a base da página: topo, produtos, aplicativos e rodapé. O claro fica só onde se lê e se age: a chamada para outros problemas, como trabalhamos, equipe, contato, dúvidas e o aviso de privacidade.

**Uma ousadia só.** O momento memorável é o hero em uso (`siteConfig.heroVariant`): o "expansao" (§9.8, o padrão desde 15/10/2026), um quadro calmo que cresce com a rolagem até quase a tela inteira enquanto o título se abre, ou o "estudio" (§9.7), o produto girando sob a luz conforme a rolagem. Nunca os dois na mesma página. Todo o resto é quieto, preciso e tipográfico.

### Quatro assinaturas da marca (as únicas "decorações" permitidas)

1. **A junta**: fresta fina e constante (3 px) entre blocos do mesmo
   grupo. Comunica "estas peças formam um conjunto".
2. **O hexágono**: a geometria do símbolo. Aparece na marca, nas iniciais
   da equipe e no visual estático do topo. Não vira padrão de fundo nem
   ícone genérico.
3. **O ponto do i**: o círculo azul do logo (`--color-electric-500`), usado
   como o pingo do "i" da palavra "Strukti" gigante do hero "video" (§9.6),
   e só ali. (Na v2 também marcava a lista de destaques do portfólio, que
   saiu na v3.)
4. **A luz de estúdio**: luz principal azul elétrico (`--color-electric-500`) atrás do produto e contorno ciano (`--color-cyan-400`). Só existe dentro de um palco (§8.13), nunca como fundo solto.

---

## 2. Fundo (decisão)

| Superfície | Token | Hex | Onde |
|---|---|---|---|
| Espaço | `--color-navy-950` | `#08121D` | Barra do topo, hero, Produtos (`#produtos`, em palcos), rodapé |
| Noite | `--color-navy-900` | `#0E1C2B` | Aplicativos (`#aplicativos`, em palcos); moldura do hero "video", dentro da margem de espaço, abaixo da barra |
| Papel | `--color-navy-50` | `#F1F5F8` | Chamada geral (`#sob-medida`), Como trabalhamos, Equipe, Contato (`#contato`), Dúvidas |
| Branco | `--color-white` | `#FFFFFF` | Peças elevadas sobre o papel: blocos, formulário, acordeão |

**Por quê:**
- **Coerente com o topo e com o logo.** O espaço é o marinho do logo
  (`#15273B`) aprofundado, não um preto neutro. Qualquer visual do hero (o
  quadro do 3D, o buraco negro, o estático ou o que vier) termina nessa cor,
  e a barra do topo usa a mesma: o topo é uma peça só.
- **Legível para quem compra.** O público (quem cuida de uma arena ou de uma
  empresa) lê textos longos, como o formulário, como trabalhamos e as
  dúvidas, muitas vezes no celular e na rua. Texto escuro sobre papel claro
  cansa menos e passa folgado do AA (13,8:1).
- **O escuro é para mostrar.** Hero, Produtos e Aplicativos ficam no escuro
  porque produto e vídeo se veem melhor nele, sob a luz de estúdio (§1), e o
  rodapé fecha a página com a mesma cor que a abriu.
- **Papel frio, não creme nem branco puro.** O cinza-azulado puxado do
  marinho mantém a família de cor e deixa o branco livre para as peças
  elevadas, sem precisar de sombra.

**Mapa da página:**

```
Barra do topo ........ espaço
Hero ................. espaço    quadro que cresce com a rolagem (§9.8; ou o
                                 produto em tela inteira do "estudio", §9.7)
Produtos ............. espaço    palcos de hardware (#produtos)
Aplicativos .......... noite     palcos com a tela do app (#aplicativos)
Chamada geral ........ papel     outros problemas (#sob-medida)
Como trabalhamos ..... papel     régua
Equipe ............... papel     régua
Contato .............. papel     régua; formulário em branco (#contato)
Dúvidas .............. papel     régua
Rodapé ............... espaço
```

Entre duas seções seguidas no papel: espaço generoso e uma **régua** de
1 px (`--border`) na largura do container (classe `.section--seam`; a régua
fica a ¾ do respiro da seção acima do conteúdo). Toda seção em papel que vem
depois de outra em papel leva a régua; a Chamada geral não, porque vem depois
da noite. No escuro não há régua: o hero termina no espaço e Produtos
continua nele. Nunca alternar papel e branco seção a seção (é o padrão
`section--alt` de template).

**O fundo fora do hero não depende do visual do hero.** O contrato da §9.1
garante que o hero sempre termina na cor do espaço, seja qual for o visual.

---

## 3. Cor

### 3.1 Escalas (todas derivadas do logo)

| Marinho (`navy`) | Hex | | Elétrico (`electric`) | Hex | | Ciano (`cyan`) | Hex |
|---|---|---|---|---|---|---|---|
| 950 (espaço) | `#08121D` | | 300 | `#7CC0FA` | | 200 | `#A6F1F3` |
| 900 (noite) | `#0E1C2B` | | 400 | `#3AA0F5` | | 300 | `#5FE3E8` |
| **800 (logo)** | `#15273B` | | **500 (ponto do i)** | `#0185E7` | | **400 (logo)** | `#00D1D8` |
| 700 | `#1E3550` | | **600 (logo)** | `#0178EC` | | **500 (logo)** | `#00C7D6` |
| 600 | `#2A4766` | | **700 (logo)** | `#0166D2` | | 600 | `#00A3B4` |
| 500 | `#3D5E80` | | 800 | `#0353AD` | | 700 | `#00808F` |
| 400 | `#5F7E9E` | | 900 | `#063F82` | | | |
| 300 | `#8EA6BE` | | | | | | |
| 200 | `#BFCEDC` | | | | | | |
| 100 | `#DFE7EF` | | | | | | |
| 50 (papel) | `#F1F5F8` | | | | | | |

Em negrito, as cores amostradas do logo oficial. Funcionais: WhatsApp
`#25D366` (hover `#1FBF5B`), erro `#C0262D`, sucesso `#11793F`, branco
`#FFFFFF`.

### 3.2 Uma cor, um trabalho

- **Marinho**: texto, superfícies escuras, estrutura.
- **Elétrico 700**: ação da marca. Botão primário (a chamada de cada seção
  e o envio do formulário, §8.1), links e foco no claro. O elétrico 500 aparece no ponto do i e na luz de estúdio
  dentro do palco (§8.13).
- **Ciano**: **só no escuro**. Luz do disco do buraco negro, foco e links
  sobre superfícies escuras. Nunca como texto no claro.
- **Verde WhatsApp**: **só** no que abre o WhatsApp. É reconhecimento
  imediato, por isso não é "harmonizado" com a paleta.
- Proibido: gradiente como decoração de seção, texto em gradiente, cor de
  destaque numa palavra do título.

### 3.3 Tokens semânticos (por superfície)

Componentes usam **só** tokens semânticos; cada superfície redefine os
valores (classes `.surface-space`, `.surface-night`, `.surface-paper`).

| Token | Papel (`.surface-paper`) | Espaço / Noite (`.surface-space`, `.surface-night`) |
|---|---|---|
| `--surface` | `#F1F5F8` | `#08121D` / `#0E1C2B` |
| `--surface-raised` | `#FFFFFF` | navy-800 `#15273B` |
| `--text` | navy-800 `#15273B` | branco `#FFFFFF` |
| `--text-muted` | navy-600 `#2A4766` | navy-200 `#BFCEDC` |
| `--text-subtle` (legendas) | navy-500 `#3D5E80` | navy-300 `#8EA6BE` |
| `--link` / hover | electric-700 / electric-800 | cyan-300 / branco |
| `--focus` | electric-700 `#0166D2` | cyan-400 `#00D1D8` |
| `--border` (decorativa) | navy-100 `#DFE7EF` | navy-700 `#1E3550` |
| `--border-input` (funcional, 3:1) | navy-400 `#5F7E9E` | (o formulário só existe no claro) |
| `--joint` (cor da junta) | navy-100 `#DFE7EF` | navy-950 `#08121D` |

### 3.4 Contraste conferido (WCAG 2.2 AA)

Texto normal ≥ 4,5:1; texto grande e elementos de interface ≥ 3:1. Razões
calculadas pela fórmula de luminância relativa da WCAG.

| Par | Razão | Exige |
|---|---|---|
| Texto navy-800 / papel | 13,83 | 4,5 ✅ |
| Texto navy-800 / branco | 15,16 | 4,5 ✅ |
| Texto suave navy-600 / papel | 8,74 | 4,5 ✅ |
| Legenda navy-500 / papel | 6,16 | 4,5 ✅ |
| Link electric-700 / papel | 5,00 | 4,5 ✅ |
| Link electric-700 / branco | 5,48 | 4,5 ✅ |
| Branco / botão primário electric-700 | 5,48 | 4,5 ✅ |
| Branco / botão primário hover electric-800 | 7,38 | 4,5 ✅ |
| navy-950 / botão WhatsApp `#25D366` | 9,50 | 4,5 ✅ |
| navy-950 / WhatsApp hover `#1FBF5B` | 7,77 | 4,5 ✅ |
| Borda de campo navy-400 / branco | 4,23 | 3 ✅ |
| Borda de campo navy-400 / papel | 3,86 | 3 ✅ |
| Foco electric-700 / papel | 5,00 | 3 ✅ |
| Erro `#C0262D` / branco | 5,90 | 4,5 ✅ |
| Erro `#C0262D` / papel | 5,39 | 4,5 ✅ |
| Sucesso `#11793F` / branco | 5,48 | 4,5 ✅ |
| Branco / espaço | 18,84 | 4,5 ✅ |
| Branco / noite | 17,22 | 4,5 ✅ |
| Texto suave navy-200 / espaço | 11,73 | 4,5 ✅ |
| Texto suave navy-200 / noite | 10,72 | 4,5 ✅ |
| Texto suave navy-200 / navy-800 (cartão no escuro) | 9,44 | 4,5 ✅ |
| Legenda navy-300 / noite | 6,84 | 4,5 ✅ |
| Legenda navy-300 / navy-800 | 6,03 | 4,5 ✅ |
| Link cyan-300 / noite | 11,18 | 4,5 ✅ |
| Foco cyan-400 / espaço | 9,97 | 3 ✅ |
| Foco cyan-400 / navy-800 | 8,02 | 3 ✅ |
| Contorno do botão secundário navy-300 / espaço | 7,49 | 3 ✅ |
| **Pior caso do hero:** branco sobre véu de 0,86 com pixel branco atrás | 12,78 | 4,5 ✅ |
| **Pior caso do hero:** navy-200 sobre véu de 0,86 com pixel branco atrás | 7,96 | 4,5 ✅ |
| **Pior caso do hero:** navy-300 (linha de apoio) sobre véu de 0,86 com pixel branco atrás | 5,08 | 4,5 ✅ |
| **Hero "video":** texto sobre a noite sólida da moldura (o vídeo é mascarado antes da coluna de texto ≥ 1024 e fica só na faixa < 1024): branco / navy-200 / navy-300 | 17,22 / 10,72 / 6,84 | 4,5 ✅ |
| Contorno da pílula de contorno navy-300 / noite | 6,84 | 3 ✅ |
| Ícone branco do controle do vídeo sobre fundo de 0,72 com pixel branco atrás | 7,67 | 3 ✅ |
| Foco cyan-400 do controle do vídeo sobre o anel de espaço (7 px) que o separa do céu claro | 9,97 | 3 ✅ |
| Contorno do botão Menu navy-400 / espaço | 4,45 | 3 ✅ |
| Links da barra navy-200 / espaço | 11,73 | 4,5 ✅ |
| Selo "Piloto gratuito": navy-950 / cyan-400 | 9,97 | 4,5 ✅ |
| Selos "Em desenvolvimento" e "Em breve": navy-100 / espaço · noite · navy-800 | 15,09 / 13,79 / 12,14 | 4,5 ✅ |
| Selo "Em uso": branco / navy-700 | 12,50 | 4,5 ✅ |
| Selos de contorno no papel: navy-800 / papel · branco | 13,83 / 15,16 | 4,5 ✅ |
| Contorno dos selos navy-300 / espaço · noite · navy-800 | 7,49 / 6,84 / 6,03 | 3 ✅ |
| Contorno dos selos no papel navy-500 / papel · branco | 6,16 / 6,75 | 3 ✅ |
| Selo de ilustração navy-200 / palco (espaço · noite) | 11,73 / 10,72 | 4,5 ✅ |
| **Pior caso do palco:** selo de ilustração navy-200 sobre a noite com a luz elétrica inteira atrás (electric-500 a 0,45) | 5,60 | 4,5 ✅ |
| **Hero "expansao"** (exceção da §9.8: texto sobre a mídia, sem véu de 0,86): título navy-50 sobre o pixel mais claro permitido na faixa do título, depois do tom do fundo e da sombra do quadro (luminância ≤ 0,162, cerca de `#707070`; o limite exato de 4,5:1 é 0,1629) | ≥ 4,5 | 4,5 ✅ (condição da mídia) |
| **Hero "expansao":** linha de apoio e dica navy-100 sobre o pixel mais claro permitido na faixa delas (luminância ≤ 0,136, cerca de `#676767`; o limite exato é 0,1368) | ≥ 4,5 | 4,5 ✅ (condição da mídia) |
| **Hero "expansao":** conteúdo depois do palco, sobre o espaço sólido: branco / navy-200 | 18,84 / 11,73 | 4,5 ✅ |

Decorativos (sem exigência): junta navy-100 sobre branco 1,25; junta da
barra do topo navy-800 sobre espaço 1,24 (e sobre a noite, 1,13); ponto do i
electric-500 sobre branco 3,81; verde WhatsApp sobre papel 1,81 (o botão é
identificado pelo próprio texto, 9,5:1); fundo navy-700 do selo "Em uso"
sobre espaço, noite e navy-800 1,51 / 1,38 / 1,21 (o selo não é controle e é
identificado pelo próprio texto, 12,50:1).

---

## 4. Tipografia

**Geologica** (Monokrom: Sindre Bremnes e Frode Helland; licença SIL OFL,
Google Fonts), uma família só, variável: `wght` 100–900 e o eixo **`SHRP`**
(sharpness, 0–100), que corta as terminações em ângulo, o mesmo corte das
faces do hexágono. A assinatura "Strukti" do logo é uma grotesca geométrica
pesada; a Geologica conversa com ela sem imitá-la.

- Carregamento: `next/font/google` com `Geologica({ subsets: ["latin"],
  axes: ["SHRP"], display: "swap", variable: "--font-geologica" })`. O
  arquivo é baixado no build e servido pelo próprio site: **nenhuma
  requisição externa em tempo de execução**. O arquivo latino variável com
  SHRP tem ~29 KB (a Inter da v1 tinha ~48 KB).
- Fallback: `system-ui, "Segoe UI", Roboto, sans-serif` (o `next/font`
  ajusta as métricas do fallback sozinho).

**Duas afinações da mesma família:** títulos com SHRP alto (corte do
hexágono), leitura com SHRP 0 (macia).

| Papel | Tamanho (mín. → máx.) | Peso | SHRP | Entrelinha | Espacejamento |
|---|---|---|---|---|---|
| Display (H1 do hero) | `clamp(2.5rem, 1.6rem + 3.6vw, 4.5rem)` (40 → 72 px) | 760 | 100 | 1,02 | −0,025em |
| Título de seção (H2) | `clamp(2rem, 1.4rem + 2.2vw, 3rem)` (32 → 48 px) | 720 | 100 | 1,06 | −0,02em |
| Título de bloco (H3) | 1.3125rem (21 px); 1.5rem (24 px) no título do formulário | 640 | 60 | 1,25 | −0,01em |
| Abertura (texto de entrada) | 1.125rem → 1.3125rem (18 → 21 px) | 400 | 0 | 1,5 | 0 |
| Corpo | 1rem (16 px) < 768 px; 1.125rem (18 px) ≥ 768 px | 400 | 0 | 1,55 | 0 |
| Interface (botão, menu, rótulo) | 1rem (16 px) | 600 | 0 | 1 | 0 |
| Legenda, ajuda | 0.875rem (14 px), mínimo absoluto | 400 | 0 | 1,45 | 0 |
| Iniciais da equipe | 1.5rem (24 px) | 700 | 100 | 1 | 0,02em |

Escala com os degraus clássicos (14, 16, 18, 21, 24, 32, 48, 72) de *The
Elements of Typographic Style*.

**Regras:**
- Títulos com `text-wrap: balance`; parágrafos com `text-wrap: pretty`.
- Medida: corpo ≤ 66ch; abertura ≤ 56ch; H2 ≤ 18ch; H1 ≤ 14ch por linha.
- Alinhamento **à esquerda** em todo o site. Centralizado, só o conteúdo de
  um botão.
- Números: `font-variant-numeric: tabular-nums` em passos e dados ("12
  paradas, 7 cidades").
- Nunca: caixa-alta em rótulo, espacejamento aberto em sobretítulo, itálico
  ou cor para destacar uma palavra do título, fonte mono para "dar ar
  técnico".
- A abertura (`.lead`) é só para textos de entrada curtos (até ~3 linhas).
  Texto de entrada longo, como o do Contato, usa o tamanho do corpo.
- O sobretítulo do hero é texto aprovado, sem caixa-alta e sem ponto
  colorido antes. No hero "estudio", vai no tamanho do corpo, peso 600,
  cyan-300 (§9.7); nos heros "video" e "classic" ("Aplicativos sob medida
  para…"), em 16–18 px, peso 500, `--text-muted`.

---

## 5. Espaçamento, grade, raios, elevação

### 5.1 Espaçamento (base 4 px)

| Token | px | | Token | px |
|---|---|---|---|---|
| `--space-1` | 4 | | `--space-6` | 32 |
| `--space-2` | 8 | | `--space-7` | 48 |
| `--space-3` | 12 | | `--space-8` | 64 |
| `--space-4` | 16 | | `--space-9` | 96 |
| `--space-5` | 24 | | `--space-10` | 128 |

- Seção: `padding-block: clamp(64px, 9vw, 128px)`.
- Título de seção → conteúdo: `--space-7` (48). Título → texto de entrada:
  `--space-4` (16).
- A v2 **cria** esta escala (a v1 pedia para não criar): `.section` e
  `.container` passam a usá-la.

### 5.2 Grade

- Container: `max-width: 1200px`; respiro lateral de 20 px (< 768) e 40 px
  (≥ 768).
- 12 colunas com gutter de 24 px a partir de 1024. Abaixo disso, coluna
  única (blocos em 2 colunas a partir de 768, quando couber).
- Composições com intenção (e não tudo em três cartões iguais):
  - **Parede de 3 cartões** (Produtos, v2.2, prévia aprovada para
    homologação em 13/10/2026): o replay, o Rota de Vendas e o Fleet
    Analytics BI no mesmo formato (palco do vídeo em cima, selo, nome,
    frase, legenda e botão), encaixados com a junta; 3 colunas a partir de
    1024; de 768 a 1023, o replay ocupa a linha de cima (palco ao lado do
    texto) e os 2 aplicativos ficam embaixo; empilhados abaixo de 768. Cada
    cartão tem a âncora do link da barra do topo (`#replay`,
    `#rota-de-vendas`, `#fleet-analytics-bi`).
  - **Parede** (grade dos aplicativos, Equipe): blocos encaixados com a
    junta.
  - **Chamada** (Chamada geral): título, texto e botão numa coluna de até
    62ch, à esquerda.
  - **Título fixo + lista** (Como trabalhamos, Dúvidas): título e texto de
    entrada nas colunas 1–5, com `position: sticky` (topo 96 px) a partir
    de 1024; conteúdo nas colunas 7–12.
  - **Texto + formulário** (Contato): título e texto nas colunas 1–5,
    formulário nas colunas 7–12; empilha abaixo de 1024.

### 5.3 Raios (por hierarquia, não um raio para tudo)

| Token | px | Uso |
|---|---|---|
| `--radius-joint` | 2 | Cantos internos de blocos dentro de uma parede |
| `--radius-1` | 4 | Campos de formulário, etiquetas (selos de status, §8.14) |
| `--radius-2` | 6 | Botões, botão flutuante |
| `--radius-3` | 10 | Cantos externos de uma parede, palco, cartão de produto, formulário |

Sem pílula (`999px`) em lugar nenhum: os botões da v1 eram pílulas e
passam a `--radius-2`. Círculo, só o ponto do i. **Exceção única (ADR-007):**
os dois botões do hero "video" são pílulas, e o de diagnóstico leva a seta
num círculo electric-700 (§9.6).

### 5.4 Elevação

A profundidade vem da cor da superfície e da junta, **não de sombra**.

| Nível | Como | Uso |
|---|---|---|
| 0 | plano | Quase tudo |
| 1 | `--surface-raised` (branco no papel, navy-800 no escuro) | Blocos, formulário, cartões de Produtos e dos aplicativos |
| 2 | `0 12px 32px -12px rgb(8 18 29 / 0.45)` (sombra tingida de marinho) | Só o que flutua: o botão flutuante do WhatsApp |
| Luz | `0 40px 80px -40px rgb(1 102 210 / 0.45)` (`--shadow-screen`) | A tela dos aplicativos dentro do palco (§8.8, §8.13). A luz em volta dos produtos é a do palco (§8.13) |

Proibido: sombra cinza genérica (`rgba(0,0,0,.1)`) sob cada cartão;
glassmorphism (desfoque de fundo) em cartões. O cabeçalho é sólido, sem
desfoque.

### 5.5 A junta

- Uma **parede** é um contêiner `display: grid; gap: 3px; background:
  var(--joint); border-radius: var(--radius-3); overflow: hidden`, com os
  filhos em `--surface-raised`. O fundo da parede aparece nas frestas: é a
  junta.
- Junta = 3 px em qualquer largura. Não usar a junta como borda de cartão
  isolado.
- `overflow: hidden` corta o contorno de foco dos filhos: dentro de uma
  parede, o foco é desenhado **para dentro** (`outline-offset: -3px`).

---

## 6. Motion (o que já existe continua)

**Preservado, sem mudança de comportamento:**
1. **Revelação ao rolar**: `Reveal`, `RevealStaggerList` e
   `RevealStaggerItem` (`src/components/motion/Reveal.tsx`). Fade + 16 px,
   ~0,4–0,45 s, uma vez, com portão de montagem (ADR-004) decidido uma vez
   ao montar (`useCanAnimateOnce`: trocar `div` por `motion.div` no meio da
   visita remontaria o conteúdo). O resto do site usa o `useCanAnimate`,
   que acompanha o prefers-reduced-motion ao vivo.
2. **Micro-interações de botão**: `useTapHover` (`src/lib/motion.ts`).
   Hover `scale 1.03`, toque `scale 0.96`, 150 ms.
3. **Movimento do buraco negro** (hero "classic"): o gás do disco gira e a
   câmera fica parada (`orbitSpeed: 0`).
4. **Hero "video"** (§9.6): o vídeo de fundo em loop (só por JavaScript,
   nunca com reduced motion) e, no carregamento, a palavra "Strukti" sobe
   de trás de uma linha (word pull-up, 900 ms) e o ponto do i cai no lugar
   (520 ms, depois dela). Só CSS (ADR-004): começa no 1º quadro, sem
   esperar a hidratação, e some com prefers-reduced-motion.
5. **Hero "expansao"** (§9.8): o vídeo do quadro em loop (só por
   JavaScript, nunca com reduced motion) e a expansão guiada pela roda, pelo
   toque e pelo teclado, a exceção de rolagem descrita abaixo. As durações
   são as do componente de origem (fundo 100 ms, sombra do quadro 200 ms,
   conteúdo 700 ms; teclado e saltos, 300 ms com `--ease-out`), não os
   tokens: fazem parte da animação que o dono pediu para manter.

O cartão 3D na rolagem (`ScrollTiltCard`) saiu na v3, junto com o vídeo em
destaque do portfólio em que era usado.

**Tokens:**

| Token | Valor | Uso |
|---|---|---|
| `--duration-fast` | 150ms | Hover, toque, cor |
| `--duration-base` | 240ms | Abrir e fechar (acordeão, descrição do vídeo) |
| `--duration-slow` | 450ms | Revelação ao rolar |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entradas |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Mudança de estado |

**Regras de uso:**
- O visual do hero é o único movimento que acontece sozinho no
  carregamento (no hero "video", o vídeo e a subida da palavra gigante,
  que é decorativa; no "expansao", o vídeo do quadro). Nenhuma animação de
  entrada no texto do hero (o H1 não pode esperar uma animação para
  aparecer; o do "expansao" está à vista em p = 0 e só se move com a
  rolagem).
- `Reveal` vai no **grupo** (cabeçalho de seção, uma parede inteira), não
  em cada parágrafo. Paredes usam o escalonamento existente, com no máximo
  60 ms entre blocos.
- Fora do hero, nada se move sem uma ação de quem visita.
  Hover não muda o tamanho de caixa (só `transform`, cor e sublinhado).
- `prefers-reduced-motion`: as regras da ADR-004 valem para tudo (CSS
  `motion-reduce:` ou portão de montagem; nunca ramificar a árvore React).
  No hero, o visual congela num quadro (buraco negro com `paused`) ou fica
  o estático.

Animação guiada pela rolagem só existe no hero em uso (`siteConfig.heroVariant`): o giro do "estudio" (§9.7), com a rolagem nativa e o fundo preso por `position: sticky`, ou a expansão do "expansao" (§9.8). No resto da página continuam as entradas suaves (Reveal).

**Exceção controlada: a rolagem segurada do hero "expansao"** (ADR-010). Fora dela, vale a regra geral: a rolagem é sempre a do navegador (nada de `preventDefault` em `wheel`, `touchmove` ou teclas, `window.scrollTo` para segurar a página, `overflow: hidden` no `body` ou bibliotecas de "smooth scroll"). No "expansao", a pedido do dono, o comportamento do componente de origem fica: enquanto o quadro não chega ao tamanho final, a roda e o toque fazem a expansão andar em vez de rolar a página. Isso só vale com estas garantias, e cada uma tem teste (vitest e, num navegador de verdade, o `check:browser`):
- **Só com animação:** a página só é segurada depois de montar, com `useCanAnimate()` (sem reduced motion), em scroll 0 e sem âncora fora do hero na URL. Servidor, sem JavaScript e reduced motion mostram a composição parada (p = 0) com o conteúdo logo abaixo, e a página rola normalmente (mesma árvore, ADR-004; o CSS de `prefers-reduced-motion: reduce` também força o estado parado). O `useCanAnimate()` acompanha a preferência ao vivo (`matchMedia` e o evento "change"): quem liga o reduced motion no meio da visita tem a página solta na hora (e o vídeo pausado); a roda, o toque e as teclas também conferem a preferência na hora do evento.
- **Nunca volta ao topo sozinha:** qualquer rolagem que o hero não causou (âncora da barra, barra de rolagem, busca na página, foco, posição restaurada) completa a expansão no lugar de desfazer a rolagem. Uma âncora fora do hero, ao montar ou no `hashchange`, começa expandida.
- **Âncoras estáveis:** a altura do hero não muda entre os estados (só `transform`, `translate`, opacidade e o tamanho do quadro, que é absoluto). O alvo de uma âncora fica onde o navegador o pôs. A expansão também não desloca o layout (CLS 0): o quadro cresce e se centra por `translate`, e as legendas vão junto por `translate`.
- **Teclado e foco:** enquanto segura (foco no body ou dentro do hero, fora de campos), seta ±0,1, Page Down/Up e Espaço ±0,34 (Shift + Espaço sobe), End expande e Home recolhe; expandido em scroll ≤ 5, as teclas para cima recolhem, como a roda. Com Alt, Ctrl, Meta ou Shift (seleção de texto, navegação por cursor) e com o painel do menu da barra aberto, as teclas ficam com o navegador. Foco em qualquer coisa do hero, menos o controle do vídeo e a própria mídia, completa a expansão: nada focado e à vista fica invisível. A mídia não recebe clique (`pointer-events: none`, como no original): um clique ou toque no quadro não expande.
- **Zoom e menus:** Ctrl + roda (zoom), pinça com dois dedos (a rolagem que o zoom causa, durante a pinça e até 300 ms depois, não completa a expansão), a página ampliada (`visualViewport.scale` > 1: roda e toque movem a lupa), a roda só de lado (o gesto de voltar e avançar do trackpad) e o painel aberto do menu da barra ficam com o navegador. `preventDefault` só em evento cancelável.
- **Ouvintes não passivos só onde agem:** a roda e o `touchmove` (com `preventDefault`) saem da `window` quando a página está expandida e rolada além de uma tela, e voltam antes de ela chegar ao topo; o resto da página rola sem esperar o JavaScript.
- **Scroll programático instantâneo:** o único é o do recolher (`behavior: "instant"`; o `html` tem `scroll-behavior: smooth`).

---

## 7. Marca (arquivos em `public/brand/`)

| Arquivo | Uso |
|---|---|
| `strukti-assinatura-horizontal-fundo-escuro.svg` | Cabeçalho e rodapé (superfície espaço) |
| `strukti-assinatura-horizontal-fundo-claro.svg` | Documentos, propostas, superfícies claras |
| `strukti-assinatura-vertical-fundo-claro.svg` e `-fundo-escuro.svg` | Composição original (símbolo sobre a assinatura): capa, imagem de compartilhamento |
| `strukti-simbolo-fundo-claro.svg` e `-fundo-escuro.svg` | Ícone do site (favicon), avatar, espaço pequeno |
| `strukti-encaixe.svg` | Símbolo em vista explodida (decorativo): visual estático do hero |

- Vetores medidos e traçados do logo oficial (geometria e cores amostradas
  do arquivo original). Na versão para fundo escuro, o bloco marinho do
  meio fica claro (face de cima `#DCE6F0 → #FFFFFF`, face da frente
  `#9FB4C9`), a assinatura fica branca e o ponto do i, `#1C93F2`.
- Usar como `<img>` ou `next/image`, com `alt="Strukti Soluções"`. **Não**
  colar o SVG inline mais de uma vez na mesma página: os ids dos
  gradientes colidem.
- Tamanho mínimo: assinatura horizontal com 24 px de altura; símbolo com
  16 px.
- Área de proteção: a altura do "S" da assinatura, em volta de tudo.
- Não: esticar, girar, trocar as cores dos blocos, pôr sombra ou brilho,
  usar a versão de fundo claro sobre o escuro, escrever "Soluções" ao lado
  da assinatura (o nome completo vai no `alt` e no texto do rodapé).

---

## 8. Componentes

### 8.1 Botões

Altura de 48 px (mínimo de 44 no cabeçalho do celular), `padding: 0 20px`,
`--radius-2`, Geologica 600 16 px, ícone de 20 px à esquerda, sem seta no
fim do texto.

| Variante | Fundo | Texto | Hover | Onde |
|---|---|---|---|---|
| WhatsApp | `#25D366` | navy-950 | `#1FBF5B` | Todo botão que abre o WhatsApp (sempre o de maior destaque) |
| Primário | electric-700 | branco | electric-800 | "Ver os produtos" (heros "expansao" e "estudio"), "Pedir diagnóstico gratuito" (cartões dos aplicativos em Produtos), "Contar o meu problema" (Chamada geral) e o envio do formulário |
| Contorno (escuro) | transparente, borda 1,5 px navy-300 | branco | fundo `rgb(255 255 255 / .06)` | "Ver o site do replay" (Produtos, escondido até o endereço existir), "Mostrar mais projetos" (Aplicativos, com mais de 6) e o secundário dos heros "video" e "classic" |
| Contorno (claro) | transparente, borda 1,5 px navy-800 | navy-800 | fundo navy-100 | Secundário no claro, quando houver |

Foco: `outline: 3px solid var(--focus); outline-offset: 3px`. Enviando:
texto "Enviando…" e `aria-disabled`, sem ícone girando.

**Exceção do hero "video" (ADR-007, só ali):** os dois botões viram
pílulas (`.btn--pill`). O WhatsApp continua verde, com o ícone, e é o de
maior destaque; "Pedir diagnóstico gratuito" é de contorno (escuro), com
`padding: 0 8px 0 22px` e a seta (SVG de 18 px, branca) num círculo de
32 px em electric-700 no fim (`.btn--arrow`, `.btn__arrow`); no hover a
seta anda 2 px (só sem reduced motion).

### 8.2 Links

`--link`, sublinhado de 1 px com `text-underline-offset: 3px`; no hover, 2
px e a cor de hover. Link dentro de texto é sempre sublinhado (não depende
só da cor).

### 8.3 Cabeçalho

Superfície espaço, sólido, `position: sticky`, 72 px de altura (64 px
abaixo de 768), borda inferior de 1 px navy-800. Esquerda: assinatura
horizontal para fundo escuro, com 32 px de altura (28 px entre 401 e 767
px; 24 px até 400 px), como link para o topo. Meio: menu em navy-200, 600 15 px, hover branco com sublinhado.
Direita: botão WhatsApp compacto (44 px).
- O menu só aparece a partir de **1100 px** (na v1, a 1024 px ele quebrava
  em duas linhas). Abaixo disso: marca e botão, como pede a nota do texto
  aprovado.
- Até 400 px: botão com `padding: 0 14px` e 15 px, para caber com a
  assinatura a 360 px sem rolagem horizontal.
- Este cabeçalho é o do hero "classic". Os heros "expansao", "estudio" e
  "video" usam a barra da §8.3.1.

### 8.3.1 Barra do topo — de borda a borda (heros "expansao", "estudio" e "video")

`src/components/TopBar.tsx`. Uma faixa em espaço (navy-950), sólida, **fixa
a página toda** (substitui o cabeçalho sticky), na **largura inteira da
janela**, colada no topo (TB1, pedido do cliente; até então era uma aba
centrada com os cantos cortados). Embaixo, a **junta**: 3 px em navy-800
(`--topbar-joint`), que separa a barra do que passa por baixo (papel, noite
dos aplicativos, rodapé) e, no topo da página, marca onde a barra acaba e
começa a margem de espaço da moldura do hero.

- **Ponto da barra larga: 75em** (1200 px com a fonte padrão; TB2). O
  ponto é em `em` para acompanhar a fonte do navegador. É o mesmo valor no
  CSS (seção 8b e regra do FAB) e no `TopBar.tsx` (`TOPBAR_WIDE_QUERY`), e o
  `TopBar.test.tsx` confere. Não segue o 1024 do hero: a composição do hero
  (§9.6) e a barra são decisões separadas.
- Altura: `--topbar-height` (56 px abaixo de 75em; 60 px a partir dele) + a
  junta, em tokens no `:root`, porque o hero usa a mesma conta (§9.6).
- **Opaca e sem desfoque**: o contraste não depende do que está atrás.
  Links navy-200 sobre espaço 11,73:1; foco cyan-400 9,97:1; contorno do
  Menu 4,45:1 (§3.4). A junta navy-800 sobre espaço é decorativa.
- **Grade:** o conteúdo da barra fica no `.container` do site. A marca
  alinha com os títulos das seções e com o texto do hero; o WhatsApp (ou o
  Menu) alinha com a borda direita do conteúdo, a mesma da palavra
  "Strukti" gigante. Abaixo de 768 px, o texto do hero fica 8 px para
  dentro (§9.6).
- Foco: cyan-400 (é superfície escura).
- **≥ 75em** (60 px): assinatura de 24 px (28 px ≥ 80em) à esquerda; à
  direita, um grupo só com os 5 links (navy-200, 600, 15 px, alvo de 44 px,
  hover branco com sublinhado de 2 px) e o WhatsApp compacto (44 px). Nada
  quebra linha. Os respiros crescem com a tela, de 1200 a ~1310 px: entre
  os links, `clamp(16px, 15vw - 164px, 32px)`; antes do WhatsApp, que é a
  ação e fica separado da navegação, `clamp(20px, 25vw - 280px, 48px)`.
- **Espaçamento de texto (WCAG 1.4.12, AA):** com letras +0,12em e palavras
  +0,16em, os links passam de 587 para 710 px e o botão de 199 para 234 px.
  A 1024 px o grupo saía da tela e o WhatsApp ficava cortado (achado da
  Crivo na TB1); por isso o ponto subiu de 1024 para 75em. A 1200 px, marca
  (101) + links (710) + botão (234) + respiros (36) = ~1080 px, dentro dos
  1105 px do container com a barra de rolagem. A 1280 px, com os respiros
  maiores e a marca de 28 px, são ~1165 de 1185 px. O `check:browser`
  aplica o espaçamento de 360 a 1440 px e falha se algo da barra (ou do
  painel aberto) sair da tela ou do container.
- **< 75em** (56 px): assinatura e o botão **Menu** (44 px, borda 1,5 px
  navy-400, ícone de duas barras que vira X). O botão abre um painel que
  **continua a barra para baixo**, de borda a borda, logo depois da junta:
  espaço, fecha com outra junta de 3 px, elevação nível 2, sem raio; links
  brancos de 18 px com alvo de 48 px, o texto alinhado com a marca (respiro
  do container) e as réguas navy-800 de borda a borda; o WhatsApp na
  largura do conteúdo no fim. Foco dentro do painel desenhado para dentro.
  Em tela baixa (celular deitado), o painel rola por dentro (`max-height`
  de `100dvh` menos a barra).
- Comportamento: `aria-expanded` e `aria-controls` no botão; fecha com Esc
  (o foco volta ao botão), ao sair com Tab (o foco deixando a barra: o
  painel é fixo e cobriria o controle focado, WCAG 2.4.11), ao escolher um
  link, ao tocar fora e ao passar
  para ≥ 75em. Abre com fade + 8 px (`@starting-style`) só sem reduced
  motion.
- O botão vem antes do painel no DOM: com o painel aberto, o Tab segue do
  botão para os links.
- **Nada fica escondido sob ela:** `scroll-padding-top` (cabeçalho + 16 px)
  põe as seções abaixo da barra nas âncoras do menu, e o `check:browser`
  percorre a página com Tab a 360, 390, 1024 e 1200 px e falha se um
  controle focado parar sob a barra ou coberto (WCAG 2.4.11).

### 8.4 Parede de blocos (legado: sem uso desde a v3)

A seção Problemas, que usava esta composição, saiu na home v3. A parede
(§5.5) continua na grade dos aplicativos (§8.8) e na Equipe (§8.9). Se uma
seção nova voltar a usá-la: bloco em `--surface-raised` (`.block`,
`padding: 28px 28px 32px`; 20 px no celular), H3 e texto em `--text-muted`,
sem ícone no topo e sem número quando os itens não são uma sequência.

### 8.5 Lista com régua (Como trabalhamos)

Título fixo + lista (§5.2). Os quatro itens (Diagnóstico, Protótipo,
Instalação e Suporte direto) são **etapas em ordem**, por isso a lista é
ordenada (`<ol class="ruled-list" role="list">`; o `role` devolve a
semântica de lista que o Safari tira de um `<ol>` com `list-style: none`),
mas **sem número à mostra**: a régua faz a separação. Itens separados por régua de 1 px
(`--border`), `padding-block: 28px`, H3 e texto em `--text-muted`.

### 8.6 Passos numerados (legado: sem uso desde a v3)

A parede vertical de passos numerados do Diagnóstico saiu com a seção. Os
3 passos do replay ("Como funciona") também saíram do site na v2.2 (prévia
aprovada para homologação em 13/10/2026), com qualquer hero: o detalhe vai
para a futura página do replay.

### 8.7 Formulário

- Cartão branco, `--radius-3`, borda de 1 px `--border`, `padding: 32px`
  (20 px < 768). Sem sombra.
- Rótulo visível acima do campo (600, 16 px); texto de ajuda abaixo, em
  14 px `--text-subtle`, ligado por `aria-describedby`.
- Campo: 48 px de altura (área de texto: 6 linhas), fundo branco, borda de
  1,5 px `--border-input`, `--radius-1`, texto de 16 px (evita o zoom do
  iOS). Foco: borda electric-700 e `outline` de 3 px.
- Erro: borda e mensagem em `#C0262D`, mensagem logo abaixo do campo com
  ícone SVG, resumo de erros no topo (texto aprovado). Nunca só a cor.
- Consentimento: caixa nativa de 20 px com `accent-color:
  var(--color-electric-700)`, **desmarcada**, rótulo clicável com o link
  para `/privacidade`.
- Sucesso: bloco com borda esquerda de 4 px `#11793F`, título e texto
  aprovados e o botão do WhatsApp.

### 8.8 Aplicativos (grade de vídeos)

Superfície **noite** (`#aplicativos`). Vai de 1 a N aplicativos sem mudar o
layout. Componente `ProjectGrid` (`src/components/sections/ProjectGrid.tsx`).

**Dados:** a lista `landingContent.aplicativos.projects`
(`src/content/landing.ts`), com o texto aprovado:

```ts
interface Project {
  slug: string;            // "rota-de-vendas"
  name: string;            // "Rota de Vendas"
  summary: string;         // 1 frase, para o cartão da grade
  videoTitle: string;      // fica nos dados, fora da grade
  video: {
    src: string;           // vídeo de lançamento feito com /brag
    poster: string;
    accessibleName: string;// nome acessível do <video>
    caption: string;       // legenda visível abaixo do vídeo
    description: string;   // descrição completa (abre num <details>)
  };
  highlights?: readonly { lead: string; rest: string }[]; // fica nos dados, fora da grade
  platforms: readonly string[]; // ["Android", "Windows"]
  status?: ProductStatus;  // selo do cartão (§8.14)
}
```

**Layout** (sem destaque e sem título próprio da grade):

```
H2 + texto de entrada (.section-head)
┌ GRADE: parede, junta navy-950 ──────────────────────────┐
│ [palco: pôster 16:9]  [palco: pôster 16:9]  …           │
│ selo                  selo                              │
│ nome (H3)             nome                              │
│ resumo                resumo                            │
│ [Android] [Windows]  (etiquetas)                        │
│ legenda, "Ler a descrição do vídeo"                     │
└─────────────────────────────────────────────────────────┘
botão primário "Diagnóstico gratuito" (marca o assunto "Aplicativo" no formulário)
```

- A grade vem logo abaixo do H2 da seção, e o nome de cada aplicativo é H3.
  Nada de grade vazia, "em breve" ou cartão fictício.
- A parede **nunca deixa coluna vazia**; o layout segue o tanto de cartões:
  - **1 cartão:** o **cartão largo** (`.project-card--wide`). A partir de
    1024 px, pôster nas colunas 1–7 e texto nas 8–12 (máx. 30rem), o pôster
    centrado na altura do texto; o player toca no lugar do pôster. Abaixo de
    1024, empilha como os outros cartões. Sem isso, o cartão único virava
    um pôster de 1200 px.
  - **2 cartões (hoje):** duas colunas a partir de 768 px (`.wall--2`).
  - **3 ou mais:** 1 coluna (< 768), 2 (768–1023) ou 3 (≥ 1024)
    (`.wall--3`).
- **Mais de 6:** mostra 6 e um botão de contorno "Mostrar mais projetos",
  que revela os demais sem mudar de página e leva o foco ao primeiro cartão
  revelado.
- Textos de interface aprovados em `docs/landing-copy.md` v2.0
  (`landingContent.aplicativos.grid`).
- **Cartão:** `--surface-raised` (navy-800). Em cima, o **palco** (§8.13),
  com a tela do app no lugar do objeto (`--radius-2` e a sombra Luz, §5.4):
  o pôster 16:9 (carregamento
  preguiçoso) e, sobre ele, o botão de reproduzir (56 px, `--radius-2`,
  electric-700 com triângulo branco, nome acessível "Assistir ao vídeo:
  {nome}"). Embaixo, o **selo** de status (§8.14; hoje, "Piloto gratuito"
  no Rota de Vendas e "Em uso" no Fleet Analytics BI), o nome, o resumo, as
  etiquetas de plataforma (14 px, borda de 1 px navy-600, `--radius-1`;
  nada de "A · B · C" com pontos), a legenda e a descrição do vídeo.
- **Vídeo:** o `<video>` só existe depois do clique: o pôster dá lugar a um
  `<video controls>` no mesmo lugar, dentro do palco, já tocando (há gesto
  de quem visita), e o foco vai para o vídeo. Nada toca antes do clique. Só
  um vídeo toca por vez na página. Legenda e descrição em texto sempre
  presentes (os vídeos do /brag só têm música). Vídeo novo com narração
  entra com legenda `.vtt`.

### 8.9 Equipe

Parede de 4 blocos (2 colunas < 1024, 4 ≥ 1024). Cada bloco: um hexágono
de pé (a mesma proporção do símbolo) de 72 px, em navy-800, com as
iniciais em branco (decorativas, `aria-hidden`), o nome em H3 abaixo e,
logo abaixo do nome, o curso (`siteConfig.team[].course`, em
`--text-muted`). Sem foto e sem cargo.

### 8.10 Dúvidas (acordeão)

Título fixo + lista (§5.2). Itens como uma parede vertical (junta de 3
px), cada um um `<details>` em `--surface-raised`. Pergunta em 600 18 px,
com um "+" desenhado em CSS que gira 45° ao abrir (`--duration-base`);
resposta em `--text-muted`. Foco desenhado para dentro (§5.5).

### 8.11 Rodapé

Superfície espaço. Assinatura horizontal (fundo escuro) com 28 px, linha
de apoio em navy-200, contatos com links cyan-300, "Aviso de privacidade" e
o ©. Régua navy-800 acima do ©.

### 8.12 WhatsApp flutuante

Verde `#25D366`, ícone navy-950, `--radius-2`, elevação nível 2. No
celular: 56 × 56 px, só o ícone (com o nome acessível do texto aprovado).
A partir de 640 px: ícone e "WhatsApp". Fica a 16 px das bordas.

**Quando aparece** (`src/components/FloatingWhatsApp.tsx`; revisão DS1 da
Crivo): ele some enquanto

- algum elemento com `data-hides-fab` está na tela (IntersectionObserver,
  com 200 px de margem embaixo: ele já está oculto quando o marcador chega
  à faixa do botão). Hoje: o hero (`section#inicio`, que já mostra o
  WhatsApp no próprio botão e na barra do topo — sem isso, a 360 px eram
  três chamadas na primeira tela), o cartão do formulário (`.form-card`,
  que tem o link do WhatsApp) e o rodapé (idem);
- a caixa dele cruza a de qualquer controle focável visível (`a[href]`,
  `button`, campos, `summary`, `video[controls]`, `[tabindex] ≥ 0`),
  conferido em rolagem, redimensionamento e foco. Ele nunca cobre um botão,
  campo, link ou controle de vídeo.

**Com a barra do topo (§8.3.1, heros "expansao", "estudio" e "video"), o FAB só existe abaixo de 75em
(1200 px)** (decisão do Claudinho no HR1; o ponto acompanha o da barra
larga desde a TB2): a partir daí o WhatsApp já está sempre à mostra na
barra fixa. É CSS (`.topbar ~ .fab-whatsapp { display: none }` em ≥ 75em),
então vale só nas páginas com a barra; no /privacidade, sem barra, nada
muda. Abaixo de 75em valem todas as regras acima.

Esconder é imediato; mostrar só depois de conferir com o quadro assentado
(dois `requestAnimationFrame`, para ler as caixas depois de o navegador
aplicar o layout e as transformações do quadro, como as da revelação ao
rolar, e de novo 150 ms depois de a rolagem parar).

Oculto de verdade: `data-visible="false"`, atributo `inert` (fora do Tab e
do leitor de tela) e `visibility: hidden`, não só opacidade. Começa oculto
no SSR (o hero está na tela ao carregar: sem divergência de hidratação e
sem piscar); sem JavaScript fica oculto: no hero "classic", o botão do
cabeçalho continua lá; nos heros com a barra ("expansao", "estudio" e "video"), abaixo
de 75em o menu da barra não abre sem JavaScript, e o WhatsApp fica no botão
do hero.
A transição só existe com `prefers-reduced-motion: no-preference` e só na
entrada (fade de opacidade, `--duration-base`); a saída é instantânea, para
o botão nunca ficar "sumindo" por cima do que acabou de chegar embaixo
dele. No celular, `html` tem
`scroll-padding-bottom: 88px`: a rolagem por foco para o controle acima da
faixa do botão.

### 8.13 Palco

Superfície escura (`.palco`) onde fica um produto (cards de hardware, cards de aplicativos; o hero usa o quadro em tela inteira, §9.7). Camadas: fundo `navy-950` → `navy-900` em degradê vertical; `.palco__luz` (elipse elétrica desfocada atrás do centro, contorno ciano fino embaixo, `aria-hidden`); `.palco__conteudo` (o objeto, a imagem ou a tela do app). Raio: no cartão do replay em Produtos (`.produto__palco`, 8:5, dentro do respiro do cartão), `--radius-3` (§5.3); nos cartões dos aplicativos (`.project-card__palco`), o palco é o topo do cartão, rente às bordas dele, com raio 0, e os cantos de fora vêm da parede (§5.5). Ali ele deixa uma moldura em volta da tela do app (mais folga embaixo, no chão), e a tela tem `--radius-2` e a sombra Luz (§5.4). O palco não tem texto dentro, salvo o selo de ilustração.

### 8.14 Selos de status

Todo produto mostra um selo (classe base `.selo` mais um modificador), com texto fixo: **"Piloto gratuito"** (`.selo--piloto`, fundo `cyan-400`, texto `navy-950`), **"Em desenvolvimento"** (`.selo--desenvolvimento`, contorno `navy-300`, texto `navy-100`), **"Em uso"** (`.selo--em-uso`, fundo `navy-700`, texto branco), **"Em breve"** (`.selo--em-breve`, contorno tracejado `navy-300`, texto `navy-100`; o traço é o que o distingue de "Em desenvolvimento"). No papel (`.surface-paper`), os dois selos de contorno passam a contorno `navy-500` e texto `navy-800`. Forma: etiqueta com `--radius-1` (4 px, §5.3; sem pílula), 14 px (o mínimo da §4), peso 600. O selo de ilustração do 3D (`.selo--ilustracao`, "Ilustração do conceito") é texto pequeno `navy-200` (14 px) no canto inferior do palco; no hero, no canto do quadro (§9.7). Vai em todo lugar que mostra o render 3D: o hero e o cartão do replay em Produtos (spec §10). A informação está sempre no texto; a cor só reforça.

Contraste AA conferido nos quatro (linhas na tabela da §3.4):

| Selo | Texto / fundo | Razão |
|---|---|---|
| Piloto gratuito | navy-950 / cyan-400 | 9,97 |
| Em desenvolvimento, Em breve (escuro) | navy-100 / espaço · noite · navy-800 | 15,09 / 13,79 / 12,14 |
| Em desenvolvimento, Em breve (papel) | navy-800 / papel · branco | 13,83 / 15,16 |
| Em uso | branco / navy-700 | 12,50 |
| Ilustração do conceito | navy-200 / espaço · noite; pior caso com a luz elétrica inteira atrás | 11,73 / 10,72; 5,60 |

Contornos (exigência de 3:1, embora não carreguem informação): navy-300 no escuro ≥ 6,03; navy-500 no papel ≥ 6,16. O fundo navy-700 do "Em uso" quase some contra o escuro (1,21–1,51), o que é aceito: o selo não é controle e o texto o identifica. O selo de ilustração não tem fundo: a razão vale para o palco vazio; se a imagem do produto passar por baixo dele, o contraste tem de ser conferido de novo sobre a imagem.

### 8.15 Ficha técnica

Lista de definições (`<dl class="ficha">`) com 2 a 4 itens: valor grande (Geologica 700, SHRP 100, `font-variant-numeric: tabular-nums`) em cima, rótulo curto `text-subtle` embaixo. No DOM, `<dt>` (rótulo) vem antes de `<dd>` (valor); a ordem visual inverte por CSS.

---

## 9. Hero

### 9.1 Contrato do fundo trocável (o DS não depende do buraco negro)

O hero é uma pilha de camadas. **Só a camada 1 muda** quando o visual é
trocado (`siteConfig.heroVisual`); todas as outras são do DS:

```
4. Conteúdo    HeroContent: sobretítulo, H1, texto, botões, linha de apoio
3. Véu         do DS, sempre presente; garante o contraste do texto
2. Fade-base   do DS; os últimos 16% do hero desbotam para o espaço
1. Visual      peça trocável (blackhole | static | ...), absolute inset-0
0. Base        background: var(--color-navy-950) (espaço)
```

Todo visual, atual ou futuro, deve:
- preencher a área sozinho e aceitar qualquer proporção;
- não ter texto, logo de cliente nem dado;
- ter um estado parado (reduced motion, aba oculta, fora da tela);
- respeitar o **ponto focal** e a **área livre** da §9.2 (o véu cobre o
  resto, mas o visual não deve pôr o que tem de mais brilhante atrás do
  texto).

Como o véu e o fade são do DS, o texto passa no AA e o hero termina em
espaço **qualquer que seja o visual**. Por isso o fundo do resto do site
não muda quando o topo muda.

### 9.2 Composição

| Largura | Composição | Ponto focal do visual | Véu (camada 3) |
|---|---|---|---|
| ≥ 1024 px | **Lado a lado:** texto à esquerda (máx. 40rem), visual à direita | x 76%, y 48% | `linear-gradient(90deg, espaço/0.94 0, espaço/0.88 <borda direita do texto>, transparente <borda + 280px>)` |
| < 1024 px | **Faixa:** texto em cima; visual numa faixa reservada embaixo (`padding-bottom: var(--hero-band)`, `clamp(260px, 42svh, 360px)`); o texto nunca fica sobre ela | x 50–54%, centro da faixa (y ≈ 84%) | `linear-gradient(180deg, espaço/0.94 0, espaço/0.90 calc(100% - band), transparente calc(100% - band + 144px))` |

- Na zona do texto, o véu tem opacidade **≥ 0,86** (0,88 no lado a lado,
  0,90 na faixa, até a última linha de texto; o desbotamento só começa
  depois dela): mesmo com um pixel branco atrás, o branco fica em 12,8:1, o
  navy-200 em 8,0:1 e o navy-300 da linha de apoio em 5,1:1.
- A borda direita do texto no lado a lado é
  `max(gutter, (100% − 1200px) / 2) + min(40rem, 100% − 2 × gutter)`
  (`--hero-text-edge` em `globals.css`).
- Altura: `min-height: min(calc(100svh - 72px), 820px)` no lado a lado;
  na faixa, a altura é a do conteúdo mais a faixa.
- O conteúdo segue a grade do site (o mesmo container das seções), não um
  respiro próprio.
- O ponto de corte da composição é **1024 px**, não 768: entre 768 e 1023
  o texto ocupa a largura toda e ficaria sobre o visual à direita.

### 9.3 Visual "blackhole" (atual)

Componente `BlackHoleHeroSection` (21st.dev, MIT). Parâmetros do DS:

| Prop | Valor | Motivo |
|---|---|---|
| `hotColor` | `#E9FDFF` | Borda interna quase branca, tingida de ciano |
| `midColor` | `#00D1D8` (cyan-400) | Corpo do disco = ciano do logo |
| `coolColor` | `#0166D2` (electric-700) | Borda externa = azul do logo, que se apaga no espaço |
| `starBrightness` | `0` | Sem estrelas: céu estrelado é clichê e compete com o texto |
| `glow` | `0.8` (lado a lado) / `0.7` (faixa) | Brilho contido |
| `scrim` | `"none"` | O véu é do DS (camada 3), igual para qualquer visual |
| `focus` | `[0.76, 0.48]` / faixa `[0.5, 0.84]` | §9.2 |
| `fov` | `42` / faixa `72` | Na faixa o canvas é alto e estreito: o campo de visão maior mantém o buraco do tamanho da faixa |
| `maxDpr` / `resolution` | 1,5 / 0,7 (lado a lado); 1,25 / 0,6 (faixa) | Desempenho |
| `paused` | fora da tela, aba oculta ou reduced motion | Bateria e acessibilidade |

Sem laranja e sem roxo: o disco usa só a paleta da marca. O canvas entra
em `mix-blend-mode: screen` sobre a base: o céu quase preto do shader vira
exatamente o espaço `#08121D`, e só a luz do disco soma. Sem WebGL, com a
compilação falhando ou com o contexto perdido, o componente marca
`data-webgl` no host e o CSS mostra o visual estático (§9.4) inteiro, que
vem logo depois do host no DOM (seletor de irmão `~`: funciona em qualquer
navegador, sem `:has()` e sem estado no React).

O componente só desenha com as duas condições verdadeiras: hero na tela
(IntersectionObserver) e aba visível. Quando `narrow` muda depois de montar,
a troca de `maxDpr`/`resolution` é reaplicada na hora (o celular não fica
com o DPR e a resolução de desktop). `powerPreference: "default"`: um fundo
decorativo não precisa acordar a GPU dedicada do notebook. Licença MIT com o
aviso do autor no topo do arquivo e em `THIRD_PARTY_NOTICES.md`.

### 9.4 Visual "static" (fundo do tema, sem WebGL)

**"Encaixe":** o símbolo em vista explodida (`/brand/strukti-encaixe.svg`).
Os blocos azul e ciano afastados do centro, o bloco do meio em marinho (se
apaga no escuro e dá profundidade) e o contorno do hexágono numa linha fina,
mostrando onde as peças se encaixam.

- Base espaço + uma luz: `radial-gradient(closest-side at <ponto focal>,
  rgb(1 102 210 / .30), rgb(1 102 210 / .10) 55%, transparent)`.
- Símbolo centrado no ponto focal: altura de 68% do hero (máx. 600 px) no
  lado a lado, cortado pela borda direita se faltar espaço; na faixa,
  centrado em x 54%, `height: clamp(230px, 36svh, 330px)`, encostado
  embaixo (−14 px).
- Imagem decorativa (`alt=""`), parada, funciona sem JavaScript.
- Por baixo do canvas do buraco negro fica só a base (sem a luz, que
  tingiria a sombra do buraco em `screen`, e sem o símbolo, que piscaria
  antes do primeiro quadro).

### 9.5 Conteúdo do hero

Sobretítulo (§4) → H1 display branco → abertura em navy-200 (≤ 56ch) →
botões WhatsApp e contorno (escuro) → linha de apoio em navy-300, 14 px.
Sem animação de entrada (§6).

### 9.6 Hero "video" (padrão do HR1 até a v3)

As §9.1–9.5 descrevem o hero **"classic"**, que continua no código. A
versão em uso é escolhida em `siteConfig.heroVariant` (`"expansao"`, o
padrão desde 15/10/2026, `"estudio"`, o padrão da v3, `"video"` ou
`"classic"`, em `src/config/site.ts`); a
barra do topo muda junto (§8.3 ou §8.3.1). Os heros "video" e "classic"
saem na limpeza dos heros (spec §5.2). Implementação própria (ADR-005) no estilo pedido pelo
cliente; componentes em `src/components/sections/HeroVideo*.tsx` e
`HeroWordmark.tsx`; decisões na ADR-007.

**Camadas** (dentro de uma moldura com `--radius-3` e uma margem de
espaço de 8 px, 12 px ≥ 768). A moldura começa **abaixo da barra fixa**
(§8.3.1; TB1): o `padding-top` do hero é a barra + a junta + a margem. Assim
a barra vira o lado de cima da margem de espaço, e os quatro cantos
arredondados e a margem igual dos quatro lados continuam à mostra. Com a
barra por cima da moldura, o topo dela sumia e a moldura virava um "U".

```
5. Controle do vídeo   44 px, canto de cima à direita da moldura (12 px;
                       16 px ≥ 1024) (z-index 3; no DOM vem antes do
                       conteúdo, logo depois da barra no Tab)
4. Conteúdo            palavra "Strukti" (decorativa) + texto aprovado
                       (z-index 2)
3. Véu                 do DS: o desbotamento da faixa (< 1024) e o
                       escurecimento de baixo que assenta a palavra (≥ 1024)
2. Grão                ruído SVG parado, 18%, overlay
1. Visual              <picture> (pôster) + <video>, object-fit: cover;
                       ≥ 1024, mascarado antes da coluna de texto
0. Base                noite (navy-900), dentro da margem de espaço
```

**Composição:**

| Largura | Como fica | Véu |
|---|---|---|
| < 1024 px | **Faixa em cima:** o vídeo ocupa uma faixa no alto da moldura (`--hero-band`: `clamp(300px, 52svh, 460px)`; `clamp(340px, 50svh, 520px)` ≥ 768), com o recorte em pé (720 × 1280). A palavra gigante cruza o pé da faixa; o texto vem abaixo, **sobre a noite sólida** (fora do vídeo). | Só desbota a faixa para a noite no fim (0 → 0,72 → 1) |
| ≥ 1024 px | **Diagonal:** vídeo na moldura inteira (recorte deitado, 1920 × 1080). Texto nas colunas 1–6, no alto (máx. 34rem); palavra gigante nas colunas 7–12, embaixo, alinhada à direita, por cima do pé da estrada. | **Máscara no visual** (`mask-image`): o vídeo é transparente até a borda direita do texto (`--hero-text-edge`) e surge em curva S (smoothstep) ao longo de `--hero-reveal` (`clamp(320px, 75% do resto, 620px)`). Véu: só um escurecimento de baixo (0,82 → 0 em 34%) que assenta a palavra no chão |

- Altura: `min-height: calc(100svh − barra − junta − 2 × margem)`: a
  moldura ocupa o resto da primeira tela, e o conteúdo cresce se precisar
  (telas baixas).
- Conteúdo na grade do site: dentro da moldura, o respiro lateral é o do
  container **menos a margem** (`--hero-gutter`: 40 − 12 = 28 px a partir de
  768). Assim o texto e a palavra gigante alinham com a marca da barra e com
  as seções em qualquer largura. A borda do texto da máscara
  (`--hero-text-edge`) usa o mesmo respiro. Abaixo de 768 fica o respiro
  inteiro (20 px), para o texto não encostar na moldura: ali ele fica 8 px
  para dentro da marca.
- Contraste: o texto nunca fica sobre o vídeo; fica sobre a noite sólida
  (§3.4). Por que máscara, e não véu: um véu de 0,88 deixava ver o céu claro
  e a crista do morro atrás das letras, lidos como um "retângulo" de borda
  reta (revisão HR1). A moldura em noite, um tom acima da margem e da barra
  em espaço, mantém visível o recorte da moldura;
  abaixo de 1024 o texto nem fica sobre o vídeo.

**Palavra gigante** ("Strukti", `aria-hidden`; o título é o H1):
- Geologica 640, SHRP 100, entrelinha 0,8, espacejamento −0,045em. A
  palavra mede 3,17 em; o tamanho vem da largura do conteúdo em `cqi`:
  31,4cqi (largura toda, < 1024) e 15,4cqi (colunas 7–12, ≥ 1024).
- O "i" é o i sem pingo (ı) e o pingo é o ponto do i do logo: círculo
  electric-500 de 0,19em, com o topo na altura do topo do "k" e um pouco à
  direita do eixo da haste, como no logo.
- Movimento (§6): sobe de trás de uma linha (`clip-path` só embaixo) e o
  ponto cai depois. Só CSS; sem animação com reduced motion.

**Texto e botões:** o texto aprovado do hero (o mesmo do "classic"); H1 na
escala do título de seção (32 → 48 px, 720, SHRP 100), sobretítulo
navy-200 (16 → 18 px), abertura em navy-200 no corpo, linha de apoio
navy-300 14 px. Botões em pílula (exceção da ADR-007, §8.1).

**Vídeo** ("Rota ao entardecer", Pexels; licença, origem e tratamento em
`docs/hero-video-opcoes/README.md` e `THIRD_PARTY_NOTICES.md`):
- Servido pelo site (`public/video/hero/`), nunca de CDN. Loop de 12 s,
  sem áudio, H.264 com faststart: 1920 × 1080 (~1,65 MB) e o recorte em pé
  720 × 1280 (~0,66 MB) para `(orientation: portrait)`. Tom marinho já no
  arquivo.
- Pôster: `<picture>` com AVIF e JPG, recorte em pé ou deitado, `alt=""`,
  `fetchpriority="high"`. É o 1º quadro do loop, então a troca para o vídeo
  não se nota.
- O `<video>` não tem `autoplay` e usa `preload="none"`; fica com
  `opacity: 0` até tocar de fato. O JavaScript chama `play()` só com as
  quatro condições: sem prefers-reduced-motion, sem "economizar dados",
  hero na tela e aba visível; pausa quando alguma falha. Sem som, por
  propriedade (`muted`), antes de tocar.
- Com reduced motion, sem JavaScript ou com o navegador recusando: fica o
  pôster, e o vídeo nem é baixado.
- **Controle** (WCAG 2.2.2: movimento automático de mais de 5 s precisa
  poder parar): botão de 44 px, ícone de pausa ou triângulo, fundo espaço a
  0,72, `--radius-2`. Nome acessível "Pausar o vídeo de fundo" / "Tocar o
  vídeo de fundo". "Pausar" para de vez; "Tocar" toca mesmo com reduced
  motion (foi a pessoa que pediu). Só aparece depois de montar.
- O hero tem `data-hides-fab` (§8.12).

### 9.7 Hero "estudio" (padrão da v3 até 15/10/2026)

Seção `#inicio` (`.hero-estudio`). O produto ocupa a tela inteira, e os textos passam por cima dele. O produto é uma sequência de quadros pré-renderizada (`public/hero/sequencia/`, gerada por `scripts/hero-3d/`): desktop com 90 quadros de 1600 × 1000, celular (até 767 px) com 45 quadros de 800 × 900. O conjunto é escolhido uma vez, ao montar, pela largura da tela: girar a tela não baixa tudo de novo.

**Os textos**, em ordem, todos texto aprovado:
1. a abertura: sobretítulo, H1, corpo e os dois botões ("Conhecer o replay", que leva a `#produtos`, e o WhatsApp com a mensagem geral);
2. "Como funciona" (h2), no estilo do sobretítulo: cyan-300, peso 600, sem caixa-alta (§10);
3. os 3 passos do replay (`<ol role="list">`), com o número "01" a "03" decorativo (`aria-hidden`; a lista já numera).

*Nota (v2.2, prévia aprovada para homologação em 13/10/2026):* o "estudio" virou o hero de marca: sobretítulo, H1 e frase de uma das 3 opções (`landingContent.heroOpcoes`; a B no servidor, `?hero=a` ou `?hero=c` troca depois de montar), "Ver os produtos" e o link de texto do WhatsApp. A sequência de quadros está desligada (`SEQUENCIA_DESLIGADA` em `HeroSequenceScroller.tsx`, `data-sequencia="desligada"`), e o símbolo da marca é desenhado pelo fio (`src/components/spike/FioPrototipo.tsx`, protótipo). Os passos saíram do site (§8.6). Desde 15/10/2026, o padrão é o "expansao" (§9.8).

**Enquadramento.** Em qualquer quadro do giro, a peça fica entre 9% e 92% da altura do quadro e entre 30% e 70% da largura (15% e 85% no celular). O quadro é dimensionado por ela, e a peça aparece sempre inteira e abaixo da barra:
- **Tela deitada, a partir de 768 px** (mais larga que 5:4): a peça fica à direita, com o centro a 63% da largura, entre a barra e uma faixa de 3,5 rem no pé. Os textos ficam à esquerda dela, sobre a parte escura do quadro, sem cobrir a peça. Aqui o fundo fica atrás dos textos.
- **Celular e telas em pé:** o quadro fica em cima, na largura toda, com a peça logo abaixo da barra, e o pé dele se desfaz num degradê. Os textos começam abaixo do quadro e, ao rolar, passam **por baixo** dele, como passam por baixo da barra: aqui o fundo fica na frente dos textos, com uma faixa opaca na cor do fundo do topo da tela até o pé do quadro. Os textos nunca ficam sobre a peça.
- **Tela deitada com os quadros do celular** (o celular que montou em pé e depois girou, a partir de 768 px; o efeito marca o conjunto no canvas com `data-conjunto`): o canvas mostra o quadro 8:9 inteiro no meio (`object-fit: contain`, de 22,2% a 77,8% da largura), e a peça nunca é cortada. As laterais desse quadro se desfazem por máscara no pôster de trás (nessa largura, o do computador); a peça, entre 30,5% e 69,4% da largura, fica fora do degradê.
- As bordas do quadro se desfazem no fundo da seção (navy-950) por máscara, sem costura.

**Com animação** (`data-scrub="true"`, só depois de montar):
- O fundo (`.hero-estudio__fundo`: pôster, `<canvas>` decorativo com `aria-hidden` e selo) fica preso na tela (`position: sticky; top: 0; height: 100svh`) e solta junto com o fim do hero: nunca cobre a seção seguinte.
- O giro, do quadro 0 ao último, cobre toda a faixa em que o fundo fica preso: da abertura até o último passo.
- Cada passo ocupa cerca de uma tela de leitura. Só o bloco em foco aparece (`data-active`; os outros somem com opacidade e um deslize curto). O bloco em foco é o que tem o texto mais perto do meio da área de texto (a linha de leitura), mas um passo só fica com o foco enquanto está abaixo de "Como funciona", salvo o último (item seguinte). A posição é medida sem o deslize do CSS, para o foco depender só da rolagem e não piscar entre dois blocos.
- "Como funciona" fica no alto da área de texto e só aparece enquanto o passo em foco está abaixo dele. Lado a lado, onde o título fica preso no alto da coluna, o passo cujo topo chega ao pé do título (com a margem dele) entrega o foco ao passo seguinte, e o título continua à vista; o último passo fica com o foco, e aí o título some. Os textos nunca se sobrepõem.
- O bloco com o foco do teclado nunca some, e o fundo preso não tem nada focável: o foco nunca fica preso nele. Com reduced motion não há transição.
- Um link direto para uma âncora abaixo do hero (ex.: `/#contato`) chega ao lugar certo: a seção cresce ao montar, e a página volta ao alvo da âncora logo depois da montagem.

**Sem animação** (prefers-reduced-motion, "economizar dados", sem JavaScript, falha ao carregar os quadros):
- É a mesma marcação: o fundo é só a 1ª tela, com o pôster atrás da abertura (lado a lado) ou acima dela (celular), e os passos vêm logo depois, como lista normal, sem alturas extras.
- Em scroll 0, a composição é a mesma com e sem animação (nada salta ao montar).

**Pôster e selo:**
- O pôster (quadro 0, em AVIF com JPG de reserva) vem no HTML, com `alt=""` (é decorativo, como o canvas), e é o LCP. O quadro 0 é o produto em 3/4 já iluminado, para o canvas assumir sem salto.
- O selo "Ilustração do conceito" fica sempre visível num canto do quadro, fora da peça (§8.14).

### 9.8 Hero "expansao" (padrão desde 15/10/2026)

Seção `#inicio` (`.hero-expansao`, `surface-space`), escolhida com `siteConfig.heroVariant = "expansao"`; a barra do topo é a da §8.3.1, e a seção seguinte é Produtos. Quando está em uso, é ela a ousadia da página (§1). Componente de terceiro com licença MIT, adaptado: `ScrollExpandMedia`, de Arunachalam (@arunachalam, 21st.dev), em `src/components/ui/scroll-expansion-hero.tsx` (licença, origem e a lista de mudanças no comentário do topo e em `THIRD_PARTY_NOTICES.md`); a seção é `src/components/sections/HeroExpansao.tsx`; decisões na ADR-010. Com o hero "expansao", o protótipo do fio não desenha: ele parte do símbolo do hero de marca (`.hero-estudio__quadro`), que este hero não tem; para vê-lo, `heroVariant = "estudio"`. Onde o fio começa com este hero fica para decisão do Thiago.

**Tema da mídia** ("Fim de expediente", produção própria): um ambiente que transmite paz, com detalhes sutis do que a Strukti faz. Uma mesa calma junto a uma janela alta na hora azul, a cidade desfocada lá fora, a luz do abajur, um caderno fechado, uma caneca, um celular com uma rota do Rota de Vendas e a caixa do botão do replay com o LED ciano. Sem florestas, árvores, montanhas ou paisagens naturais; sem texto, logo de cliente ou dado na imagem (§9.1).

**A animação** (a do componente de origem, mantida a pedido do dono, com os mesmos números). O progresso p vai de 0 a 1:
- **Quadro** (`.hero-expansao__midia`): centrado num palco de 100svh, de 300 × 400 px a (300 + 1250p) × (400 + 400p) px; abaixo de 768 px, (300 + 650p) × (400 + 200p). Limite de 95vw × 85vh e, na altura, também 100svh menos duas vezes a barra, para nunca passar sob ela: esse termo age nas telas com menos de ~787 px de altura até 1199 px de largura (barra de 56 + 3 px) e de ~840 px de 1200 px para cima (60 + 3 px), ou seja, também nos notebooks comuns (642 px em vez de 653 a 1366 × 768; 594 em vez de 612 a 1280 × 720; 242 em vez de 306 a 740 × 360, onde o cartão de p = 0 também encolhe). Raio de 16 px e sombra `0 0 50px rgb(0 0 0 / .3)`: são do componente, fora da escala da §5.3 e da §5.4, como exceção deste hero.
- **Fundo** (`.hero-expansao__fundo`): opacidade 1 − p, até sobrar o espaço (navy-950) da seção: o hero termina em espaço (§9.1).
- **Sombra do vídeo:** preto a 30% com opacidade 0,5 − 0,3p.
- **Título e legendas:** a 1ª linha do título e a linha de apoio deslizam −p × 150vw (−180vw abaixo de 768 px); a 2ª linha e a dica, +p × 150vw (+180vw). O corte lateral é `overflow-x: clip` na seção (sem rolagem horizontal). As legendas ficam centradas 16 px abaixo do quadro (8 px no celular deitado, com a dica colada na linha de apoio, para a dica caber na tela de 360 px de altura); elas vão para lá por `translate` (meia largura e a altura do quadro, com as mesmas fórmulas), presas ao canto do quadro que não se move no layout: os mesmos pixels de seguir o quadro, sem deslocamento de layout (CLS 0 numa expansão inteira; eram 0,034 a cada uma).
- **Conteúdo** (`.hero-expansao__conteudo`): aparece em p = 1 (fade de 700 ms) e some se p voltar abaixo de 0,75.
- **Entrada:** a roda soma deltaY × 0,0009 (linhas × 16 px, páginas × a altura da tela); o toque soma o arrasto × 0,005 para expandir e × 0,008 para recolher; o teclado, como na §6. Expandido, roda para cima ou arrasto de mais de 20 px para baixo com scroll ≤ 5 recolhe (a página volta ao topo, instantâneo, e o progresso fica em 1 até a próxima roda). Ficam com o navegador (§6): Ctrl + roda, roda só de lado, pinça e página ampliada, o menu aberto e as teclas com Alt, Ctrl, Meta ou Shift (menos Shift + Espaço, que sobe).
- O p é escrito em `--hx-p` (um `requestAnimationFrame`), e todas as fórmulas são `calc()` no CSS; os números do celular vêm de `@media (max-width: 47.99em)`. Roda e toque mexem no quadro sem transição (como no original); teclado e saltos (âncora, foco) ganham 300 ms.

**Camadas** (do palco, de baixo para cima):
```
4. Controle do vídeo   44 px, canto de baixo à direita do palco (gutter;
                       16 px do pé), à vista em qualquer progresso
3. Título              H1 em duas linhas, por cima do quadro (z-index 2)
2. Quadro              pôster + vídeo + sombra; linha de apoio e dica
                       logo abaixo dele (acompanham o tamanho)
1. Fundo               <picture> decorativo (alt=""), tom de 10% de
                       espaço e desbotamento para o espaço no pé
0. Base                espaço (navy-950)
```

**Os textos** (`landingContent.heroExpansao`; o título, a dica, a descrição da mídia e os nomes do controle são proposta, aguardando aprovação em `docs/landing-copy.md`):
1. **H1** (`#hero-title`): um único `<h1>` com as duas linhas em `<span>`, "Tecnologia que trabalha" / "em silêncio"; o nome acessível é a frase inteira. Geologica 700, SHRP 100, `clamp(1.5rem, min(1.2rem + 3.6vw, 8.6vw - 0.25rem), 3.75rem)` (o termo com 8,6vw age só abaixo de ~464 px: de 320 px para cima, "Tecnologia que trabalha" cabe numa linha só, e o título fica nas duas partes que se abrem), navy-50, `text-shadow: 0 2px 24px rgb(8 18 29 / .6)`, `text-wrap: balance`, centrado (exceção deste hero ao alinhamento à esquerda da §4: é a composição do componente). Sem `mix-blend-mode`.
2. **Linha de apoio** (o `date` do original): o sobretítulo aprovado do hero de marca da v2.2 (opção B), "Strukti Soluções, de João Pessoa" (com `?hero=c`, o da opção C), navy-100, de 16 a 22 px, peso 500, `text-wrap: balance` (até ~400 px ela quebra em duas metades, sem palavra sozinha na 2ª linha). Até 360 px, as legendas deixam livre, dos dois lados, a coluna do controle do vídeo (44 px + gutter + 4 px; em `cqw`, a largura útil do palco): as duas linhas de sempre cabem, e com o espaçamento de texto da WCAG 1.4.12 ela quebra em mais linhas em vez de passar por baixo do botão. Com o sobretítulo da B (o padrão), ela fica em duas linhas e termina dentro da tela presa a 320 × 568 e 320 × 640 com o espaçamento e no zoom de 400% (320 × 256 a 4×, com e sem o espaçamento; medido em 16/10/2026), e o `check:browser` falha se ela terminar abaixo da tela. Com `?hero=c` (sobretítulo mais longo, só para comparar as opções), ela ainda passa do pé da tela presa a 320 × 568 com o espaçamento (4 linhas, 26 px) e no zoom de 400% sem o espaçamento (3 linhas, 12 px); a dica, que é decorativa (`aria-hidden`), também passa do pé da tela nesses casos. Fica com a escolha do texto e a decisão do zoom.
3. **Dica**: "Role para expandir", navy-100, 15 px, peso 500, `aria-hidden` (é instrução para o olho). Só aparece quando a expansão anda (`data-pin` ou `data-expanded`); parada, ela mentiria.
4. **Conteúdo** (os `children` do original), depois do palco, no fluxo, sobre o espaço, alinhado à esquerda no `.container`: o título do hero de marca da v2.2 como H2 e a frase (`.lead`), os dois da opção B (`?hero=a` ou `?hero=c` troca a linha de apoio, o H2 e a frase depois de montar, como no "estudio"), e os dois botões ("Ver os produtos", primário, para `#produtos`, e o WhatsApp com a mensagem geral). Os dois botões estão no HTML do servidor.
5. **Quadro**: `role="img"` com a descrição da cena como nome acessível; o fundo é decorativo.

**Estados** (atributos da seção, lidos pelo CSS, pelos testes e pelo check:browser):

| Estado | `data-pin` | `data-expanded` | `data-progress` | `data-content` |
|---|---|---|---|---|
| Parado (servidor, sem JavaScript, reduced motion, antes de montar) | `false` | `false` | `0.00` | `visible` |
| Segurando (p < 1, ou recolhido em p = 1) | `true` | `false` | `0.00`…`1.00` | `hidden` até p = 1; `visible` até p voltar abaixo de 0,75 |
| Expandido (página livre) | `false` | `true` | `1.00` | `visible` |

O parado é a composição de p = 0 (fundo, quadro de 300 × 400 com o pôster, título e linha de apoio), sem a dica, com o conteúdo logo abaixo e a página rolando normalmente. Em scroll 0, a composição é a mesma com e sem animação (nada salta ao montar). `data-input` ("wheel", "touch", "key", "auto") diz o que mexeu por último.

**Mídia** (`public/hero/expansao/`, nomes e tamanhos fixos; a versão final, "Fim de expediente", entrou em 15/10/2026 no lugar da provisória sem mexer no código, e uma troca futura também só sobrescreve os arquivos):
- Fundo: `fundo.avif`/`fundo.jpg` (1920 × 1080) e `fundo-retrato.avif`/`fundo-retrato.jpg` (1080 × 1920, para `(orientation: portrait)`), num `<picture>` com `alt=""`, sem `fetchpriority` (cobre a tela inteira, e o navegador deixa imagens assim fora do LCP; ela não disputa banda com o pôster, que é o LCP), `object-fit: cover`. O corte é `--hx-fundo-pos` (50% 85%) e `--hx-fundo-pos-retrato` (50% 75%) em `.hero-expansao`, como a produção da mídia mediu (a 2560 × 1080, 85% ainda mostra a borda da mesa).
- Vídeo do quadro: `midia.webm` (VP9) e `midia.mp4` (H.264), 1280 × 720, loop de 10 s sem emenda, mudo; pôster `midia-poster.avif`/`.jpg`, que é o 1º quadro (a mesma imagem de origem, codificada à parte: visualmente igual). O pôster é o LCP da página (o maior elemento da 1ª tela, de 300 × 400): vai com `fetchpriority="high"` (`posterPriority` do `HeroVideoClip`). O corte é `--hx-midia-pos` (50% 100%): quando o quadro fica mais largo que 16:9 (1366 × 768, 1280 × 720, celular deitado), sai o alto da janela e o pé da mídia (o desbotamento que emenda na página, o celular e a caixa do replay) fica inteiro. Servido pelo site, nunca de CDN nem `<iframe>` (CSP).
- Mecanismo da §9.6 (`HeroVideoProvider`, `HeroVideoClip`, `HeroVideoToggle`): sem `autoplay`, `play()` só por JavaScript depois de montar, com as cinco condições (sem reduced motion, sem "economizar dados", quadro na tela, aba visível, nenhum vídeo do portfólio tocando); mudo por propriedade; `preload="none"` (o `play()` começa o download; com reduced motion ou "economizar dados", o vídeo nem baixa); invisível só até o 1º quadro tocar (`data-started`): depois, pausado pelo controle ou fora da tela, mostra o quadro em que parou, sem voltar ao pôster; a mídia não recebe clique (`pointer-events: none`); `data-hero-video`. Só um vídeo toca por vez na página (§8.8). Com reduced motion, fica o pôster; ligar o reduced motion no meio da visita pausa o vídeo.
- **Controle** (WCAG 2.2.2): o botão da §9.6, com os nomes "Pausar o vídeo" / "Tocar o vídeo". Focar nele não expande o quadro (dá para pausar antes): abaixo de 640 px, ele ignora a faixa de 88 px que o `html` reserva ao FAB (`scroll-margin-bottom: -88px`; o FAB não aparece sobre o hero), senão o foco rolaria a página e a rolagem completaria a expansão. Com cores forçadas (alto contraste), o botão e o ícone usam as cores de sistema do botão (ícone `ButtonText` sobre `ButtonFace`, foco em `Highlight`): sem isso, o gradiente das barras sumia e o triângulo quase.

**Garantias** (além das da §6, "Exceção controlada"):
- **Contraste** (exceção ao véu de 0,86 da §9.1): o texto fica sobre a mídia, como no componente. A mídia é escura na faixa do texto: depois do tom do fundo e da sombra do quadro, o pixel mais claro atrás do título fica com luminância ≤ 0,162 e atrás da linha de apoio e da dica, ≤ 0,136 (§3.4). Toda troca de mídia confere isso nas capturas da §11. Com a mídia final (15/10/2026; texto escondido, de 320 a 1440 px, em p = 0 e 0,5 e com reduced motion), o pixel mais claro atrás do título ficou em no máximo 0,045, e atrás da linha de apoio e da dica, em no máximo 0,079.
- **FAB:** a seção tem `data-hides-fab` (§8.12).
- **Barra fixa:** o quadro expandido nunca passa sob a barra; o título fica no meio do palco.
- **Sem JavaScript:** o conteúdo (com os dois botões) está à vista logo abaixo do palco.

---

## 10. Checklist anti-cara-de-IA (em toda entrega)

- [ ] Nada de gradiente roxo-azul, glassmorphism, brilho neon, texto em
      gradiente ou "orbe" de luz decorativo fora do hero e do palco
      (§8.13).
- [ ] Nenhum emoji como ícone; ícones são SVG feitos para a função.
- [ ] Nenhuma seção resolvida como "três cartões iguais com ícone em cima":
      cada seção usa uma das composições da §5.2.
- [ ] Números só onde há sequência real (os passos do replay, §9.7).
- [ ] Texto alinhado à esquerda; nada centralizado "por padrão".
- [ ] Sem sobretítulo em caixa-alta espacejada, sem palavra do título
      destacada em cor ou itálico, sem "A · B · C", sem "→" no fim de botão
      ou link (exceção: a seta no círculo do botão de diagnóstico do hero
      "video", ADR-007), sem fonte mono decorativa.
- [ ] Sem sombra cinza genérica em todo cartão, sem raio único para tudo,
      sem pílula (exceção: os dois botões do hero "video", ADR-007).
- [ ] Movimento só onde a §6 permite; nada de fade-e-sobe em cada parágrafo.
- [ ] Os detalhes vêm da marca (junta, hexágono, ponto do i, luz de
      estúdio) e têm função.
- [ ] Texto é o aprovado em `src/content/landing.ts`; nenhum número,
      depoimento, logo de cliente ou selo inventado.
- [ ] Teste do espelho: tirar um acessório antes de entregar.

## 11. Checklist de entrega (UI)

- [ ] Capturas a 360, 768, 1024 e 1440 px conferidas (julgar pela imagem).
- [ ] Sem rolagem horizontal em nenhuma largura (`npm run check:browser`).
- [ ] Contraste conferido contra a tabela da §3.4; axe sem erro.
- [ ] Foco visível em tudo, inclusive dentro de paredes (`outline-offset`
      negativo) e sobre o escuro (cyan-400).
- [ ] Alvos de toque ≥ 44 × 44 px; `cursor: pointer` no que é clicável.
- [ ] `prefers-reduced-motion` respeitado sem ramificar a árvore React
      (ADR-004); hidratação limpa com a preferência ligada e desligada.
- [ ] Conteúdo aparece sem JavaScript.
- [ ] Cor e fonte só por token (nenhum hex solto em componente).

---

## 12. Migração da v1 (para a Fase B)

| v1 (`globals.css`) | v2 |
|---|---|
| `--color-petrol-900` / `-800` | `--color-navy-950` / `--color-navy-800` |
| `--color-petrol-700` / `-600` | `--color-navy-700` / `--color-navy-600` |
| `--color-petrol-100` / `-50` | `--color-navy-100` / `--color-navy-50` |
| `--color-ink` / `--color-ink-muted` | `--text` / `--text-muted` |
| `--color-surface` / `--color-surface-alt` | `--surface` / `--surface-raised` (por superfície) |
| `--color-border` / `--color-border-input` | `--border` / `--border-input` |
| `--color-whatsapp` / `-hover` (`#0e6f31`, texto branco) | `--color-whatsapp` `#25D366` / `#1FBF5B`, texto navy-950 |
| `--color-focus` (`#b34700`, laranja) | `--focus` (electric-700 no claro, cyan-400 no escuro) |
| `--font-inter` | `--font-geologica` |
