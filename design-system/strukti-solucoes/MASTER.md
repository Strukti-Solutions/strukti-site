# Design System — Strukti Soluções · v2 ("Encaixe")

> **Natureza deste arquivo:** fonte da verdade visual do site (tarefa DS1,
> ADR-006). Cor, tipografia, espaçamento, raios, elevação, motion e
> aparência dos componentes nascem aqui; `src/app/globals.css` (tokens) e
> `src/fonts/index.ts` (fonte) **implementam** este arquivo. Se o código
> divergir, é defeito do código: corrija o código, ou mude primeiro este
> arquivo (com ADR, se a decisão for relevante). Dono: Nanquim (Designer).
> Substitui a v1 (paleta azul-petróleo + Inter), que deixa de valer.

---

## 1. Conceito

**Encaixe.** O logo da Strukti são quatro blocos que se encaixam num
hexágono, separados por juntas finas e cortados no ângulo do hexágono. O
site usa a mesma ideia: peças de conteúdo que se encaixam com precisão, em
vez de cartões soltos com sombra. É também a promessa do negócio: um
aplicativo feito para encaixar no jeito que a empresa já trabalha.

**Escuro para mostrar, claro para ler.** O site é ancorado no marinho do
logo. O que é para *ver* (o topo, os vídeos do portfólio, o rodapé) fica no
escuro; o que é para *ler e agir* (problemas, como trabalhamos, formulário,
equipe, dúvidas) fica no claro.

**Uma ousadia só.** O momento memorável é o topo (hoje, o hero "video":
a estrada ao entardecer e a palavra "Strukti" gigante, §9.6; o buraco negro
segue disponível no hero "classic"). Todo o resto é quieto, preciso e
tipográfico.

### Três assinaturas da marca (as únicas "decorações" permitidas)

1. **A junta**: fresta fina e constante (3 px) entre blocos do mesmo
   grupo. Comunica "estas peças formam um conjunto".
2. **O hexágono**: a geometria do símbolo. Aparece na marca, nas iniciais
   da equipe e no visual estático do topo. Não vira padrão de fundo nem
   ícone genérico.
3. **O ponto do i**: o círculo azul do logo (`--color-electric-500`), usado
   como marcador da lista de destaques do portfólio e como o pingo do "i" da
   palavra "Strukti" gigante do hero "video" (§9.6), e só ali.

---

## 2. Fundo (decisão)

| Superfície | Token | Hex | Onde |
|---|---|---|---|
| Espaço | `--color-navy-950` | `#08121D` | Cabeçalho, hero, rodapé |
| Noite | `--color-navy-900` | `#0E1C2B` | O que já construímos (sala de projeção); moldura do hero "video", dentro da margem de espaço |
| Papel | `--color-navy-50` | `#F1F5F8` | Problemas, Como trabalhamos, Diagnóstico, Equipe, Dúvidas |
| Branco | `--color-white` | `#FFFFFF` | Peças elevadas sobre o papel: blocos, formulário, acordeão |

**Por quê:**
- **Coerente com o topo e com o logo.** O espaço é o marinho do logo
  (`#15273B`) aprofundado, não um preto neutro. Qualquer visual do hero
  (buraco negro, estático ou o que vier) termina nessa cor, e o cabeçalho
  usa a mesma: o topo é uma peça só.
- **Legível para quem compra.** O público (dono ou gerente de distribuidora)
  lê textos longos, como problemas, formulário e dúvidas, muitas vezes no
  celular e na rua. Texto escuro sobre papel claro cansa menos e passa
  folgado do AA (13,8:1).
- **O escuro volta com intenção.** O portfólio de vídeos fica no escuro
  porque vídeo se assiste melhor no escuro, e o rodapé fecha a página com a
  mesma cor que a abriu.
- **Papel frio, não creme nem branco puro.** O cinza-azulado puxado do
  marinho mantém a família de cor e deixa o branco livre para as peças
  elevadas, sem precisar de sombra.

**Mapa da página:**

```
Cabeçalho ............ espaço
Hero (visual trocável)  espaço   ← qualquer visual termina em espaço (§9.1)
Problemas ............ papel     parede de blocos brancos
Como trabalhamos ..... papel     régua entre as duas seções
O que já construímos . noite     sala de projeção
Diagnóstico .......... papel     formulário em branco
Equipe ............... papel
Dúvidas .............. papel
Rodapé ............... espaço
```

Entre duas seções na mesma superfície: espaço generoso e uma **régua** de
1 px (`--border`) na largura do container (classe `.section--seam`; a régua
fica a ¾ do respiro da seção acima do conteúdo). Nunca alternar papel e branco
seção a seção (é o padrão `section--alt` de template).

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
- **Elétrico 700**: ação da marca. Botão primário (diagnóstico), links e
  foco no claro. O elétrico 500 só aparece no ponto do i.
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

Decorativos (sem exigência): junta navy-100 sobre branco 1,25; ponto do i
electric-500 sobre branco 3,81; verde WhatsApp sobre papel 1,81 (o botão é
identificado pelo próprio texto, 9,5:1).

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
| Título de bloco (H3) | 1.3125rem (21 px); 1.5rem (24 px) no destaque do portfólio | 640 | 60 | 1,25 | −0,01em |
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
  Texto de entrada longo, como o do Diagnóstico, usa o tamanho do corpo.
- O sobretítulo do hero é texto aprovado ("Aplicativos sob medida para…"):
  vai em 16–18 px, peso 500, `--text-muted`, sem caixa-alta e sem ponto
  colorido antes.

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
  - **Título fixo + lista** (Como trabalhamos, Dúvidas): título e texto de
    entrada nas colunas 1–5, com `position: sticky` (topo 96 px) a partir
    de 1024; conteúdo nas colunas 7–12.
  - **Parede** (Problemas, passos do Diagnóstico, Equipe, grade do
    portfólio): blocos encaixados com a junta.
  - **Texto + formulário** (Diagnóstico): texto nas colunas 1–6, formulário
    nas colunas 7–12; empilha abaixo de 1024.

### 5.3 Raios (por hierarquia, não um raio para tudo)

| Token | px | Uso |
|---|---|---|
| `--radius-joint` | 2 | Cantos internos de blocos dentro de uma parede |
| `--radius-1` | 4 | Campos de formulário, etiquetas |
| `--radius-2` | 6 | Botões, botão flutuante |
| `--radius-3` | 10 | Cantos externos de uma parede, moldura de vídeo, formulário |

Sem pílula (`999px`) em lugar nenhum: os botões da v1 eram pílulas e
passam a `--radius-2`. Círculo, só o ponto do i. **Exceção única (ADR-007):**
os dois botões do hero "video" são pílulas, e o de diagnóstico leva a seta
num círculo electric-700 (§9.6).

### 5.4 Elevação

A profundidade vem da cor da superfície e da junta, **não de sombra**.

| Nível | Como | Uso |
|---|---|---|
| 0 | plano | Quase tudo |
| 1 | `--surface-raised` (branco no papel, navy-800 no escuro) | Blocos, formulário, cartões do portfólio |
| 2 | `0 12px 32px -12px rgb(8 18 29 / 0.45)` (sombra tingida de marinho) | Só o que flutua: o botão flutuante do WhatsApp |
| Luz | `0 40px 80px -40px rgb(1 102 210 / 0.45)` | Só a moldura do vídeo em destaque (a tela "ilumina" a sala) |

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
   ~0,4–0,45 s, uma vez, com portão de montagem (ADR-004).
2. **Cartão 3D na rolagem**: `ScrollTiltCard`
   (`src/components/ui/scroll-tilt-card.tsx`), no vídeo em destaque do
   portfólio. Só a moldura muda de aparência (§8.8).
3. **Micro-interações de botão**: `useTapHover` (`src/lib/motion.ts`).
   Hover `scale 1.03`, toque `scale 0.96`, 150 ms.
4. **Movimento do buraco negro** (hero "classic"): o gás do disco gira e a
   câmera fica parada (`orbitSpeed: 0`).
5. **Hero "video"** (§9.6): o vídeo de fundo em loop (só por JavaScript,
   nunca com reduced motion) e, no carregamento, a palavra "Strukti" sobe
   de trás de uma linha (word pull-up, 900 ms) e o ponto do i cai no lugar
   (520 ms, depois dela). Só CSS (ADR-004): começa no 1º quadro, sem
   esperar a hidratação, e some com prefers-reduced-motion.

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
  que é decorativa). Nenhuma animação de entrada no texto do hero (o H1
  não pode esperar uma animação para aparecer).
- `Reveal` vai no **grupo** (cabeçalho de seção, uma parede inteira), não
  em cada parágrafo. Paredes usam o escalonamento existente, com no máximo
  60 ms entre blocos.
- Fora do hero e do cartão 3D, nada se move sem uma ação de quem visita.
  Hover não muda o tamanho de caixa (só `transform`, cor e sublinhado).
- `prefers-reduced-motion`: as regras da ADR-004 valem para tudo (CSS
  `motion-reduce:` ou portão de montagem; nunca ramificar a árvore React).
  No hero, o visual congela num quadro (buraco negro com `paused`) ou fica
  o estático.

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
| Primário | electric-700 | branco | electric-800 | "Pedir diagnóstico gratuito" (seção 4 e envio do formulário) |
| Contorno (escuro) | transparente, borda 1,5 px navy-300 | branco | fundo `rgb(255 255 255 / .06)` | Botão secundário do hero |
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
- Este cabeçalho é o do hero "classic". O hero "video" usa a barra da
  §8.3.1.

### 8.3.1 Barra do topo — a aba (hero "video")

`src/components/TopBar.tsx`. Uma aba em espaço (navy-950) presa no topo da
tela, centrada, **fixa a página toda** (substitui o cabeçalho sticky). Os
dois cantos de baixo são cortados a 30° (21 × 12 px), o ângulo das faces do
hexágono do logo. Sobre o hero, ela se encaixa na margem de espaço da
moldura do vídeo; sobre o papel, é uma peça escura pendurada no topo.

- Desenho pelo fundo (quatro camadas de gradiente), **sem clip-path**: o
  clip-path cortaria o contorno de foco e o painel do menu.
- Foco: cyan-400 (é superfície escura).
- **≥ 1024 px** (60 px de altura): assinatura de 24 px (28 px ≥ 1280), os
  5 links em navy-200, 600, 15 px, alvo de 44 px, hover branco com
  sublinhado de 2 px, e o WhatsApp compacto (44 px). Nada quebra linha; a
  1024 px tudo cabe em ~970 px (respiros de 16 px, que crescem a partir de
  1280).
- **< 1024 px** (56 px): assinatura e o botão **Menu** (44 px, borda 1,5 px
  navy-400, ícone de duas barras que vira X). O botão abre um painel solto
  abaixo da aba, na largura da tela menos 8 px de cada lado: espaço, borda
  navy-800, `--radius-3`, elevação nível 2; links brancos de 18 px com alvo
  de 48 px, separados por régua navy-800, e o WhatsApp na largura toda no
  fim. Foco dentro do painel desenhado para dentro.
- Comportamento: `aria-expanded` e `aria-controls` no botão; fecha com Esc
  (o foco volta ao botão), ao sair com Tab (o foco deixando a barra: o
  painel é fixo e cobriria o controle focado, WCAG 2.4.11), ao escolher um
  link, ao tocar fora e ao passar
  para ≥ 1024 px. Abre com fade + 8 px (`@starting-style`) só sem reduced
  motion.
- O botão vem antes do painel no DOM: com o painel aberto, o Tab segue do
  botão para os links.

### 8.4 Parede de blocos (Problemas)

Parede (§5.5) com 1 coluna (< 768), 2 (768–1023) e 3 (≥ 1024). Bloco em
`--surface-raised`, `padding: 28px 28px 32px` (20 px no celular), H3 e
texto em `--text-muted`. **Sem ícone no topo e sem número** (os problemas
não são uma sequência). O fecho e o botão do WhatsApp ficam abaixo da
parede, à esquerda.

### 8.5 Lista com régua (Como trabalhamos)

Título fixo + lista (§5.2). Itens separados por régua de 1 px (`--border`),
`padding-block: 28px`, H3 e texto. **Sem números**: os cinco itens são
qualidades, não etapas.

### 8.6 Passos (Diagnóstico, "Como funciona")

É uma sequência de verdade, então leva número: parede vertical de 4 blocos
na coluna do texto (composição "texto + formulário", §5.2), número em
Geologica 700 32 px, electric-700, `tabular-nums`, à esquerda do passo.

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

### 8.8 Portfólio de vídeos (O que já construímos)

Superfície **noite**. Vai de 1 a N projetos sem mudar o layout.

**Dados** (implementação na Fase B; o texto passa pelo Claudinho): uma
lista de projetos num arquivo de conteúdo, por exemplo:

```ts
interface Project {
  slug: string;            // "rota-de-vendas"
  name: string;            // "Rota de Vendas"
  summary: string;         // 1 frase, para o cartão da grade
  videoTitle: string;      // H3 do destaque: "Veja o Rota de Vendas"
  video: {
    src: string;           // vídeo de lançamento feito com /brag
    poster: string;
    accessibleName: string;// nome acessível do <video>
    caption: string;       // legenda visível abaixo do vídeo
    description: string;   // descrição completa (abre num <details>)
  };
  highlights?: { lead: string; rest: string }[]; // só o destaque mostra
  platforms: string[];     // ["Android", "Windows"]
  featured?: boolean;      // o primeiro com featured (ou o primeiro da lista) é o destaque
}
```

**Layout:**

```
H2 + texto de entrada (colunas 1–7, à esquerda)
┌ DESTAQUE ───────────────────────────────────────────────┐
│ moldura 16:9 com o vídeo (ScrollTiltCard, já existente) │
└─────────────────────────────────────────────────────────┘
H3 do vídeo, legenda, "Ler a descrição do vídeo"
destaques em 2 colunas (≥ 768), marcador = ponto do i
fecho + botão primário (diagnóstico)
┌ GRADE (só com 2+ projetos): parede, junta navy-950 ─────┐
│ [pôster 16:9]   [pôster 16:9]   [pôster 16:9]           │
│ nome (H3)       nome            nome                    │
│ resumo          resumo          resumo                  │
│ [Android] [Windows]  (etiquetas)                        │
└─────────────────────────────────────────────────────────┘
```

- **1 projeto (hoje):** só o destaque. Nada de grade vazia, "em breve" ou
  cartão fictício.
- **2 ou mais:** a grade aparece abaixo do destaque, com 1 coluna (< 768),
  2 (768–1023) ou 3 (≥ 1024), sob o título (H3) "Outros projetos"; o nome
  de cada projeto é H4.
- **Mais de 6 na grade:** mostra 6 e um botão de contorno "Mostrar mais
  projetos", que revela os demais sem mudar de página e leva o foco ao
  primeiro cartão revelado.
- Textos de interface aprovados em `docs/landing-copy.md` v1.5, "Portfólio
  (textos de interface)".
- **Cartão:** `--surface-raised` (navy-800), pôster 16:9 com
  `loading="lazy"` e largura e altura declaradas, botão de reproduzir
  sobre o pôster (56 px, `--radius-2`, electric-700 com triângulo branco,
  nome acessível "Assistir ao vídeo: {nome}"). Ao clicar, o pôster dá
  lugar a um `<video controls>` no mesmo lugar, já tocando (há gesto de
  quem visita), e o foco vai para o vídeo. Só um vídeo toca por vez.
  Etiquetas de plataforma em 14 px, borda de 1 px navy-600, `--radius-1`
  (nada de "A · B · C" com pontos).
- **Moldura do destaque:** fundo preto, borda de 1 px navy-600, "aro" de
  8 px em navy-800, `--radius-3` e a sombra "Luz" (§5.4). Substitui a
  moldura verde-petróleo da v1.
- **Vídeo:** `preload="none"`, pôster sempre, sem reprodução nem som
  automáticos; legenda e descrição em texto sempre presentes (os vídeos do
  /brag só têm música). Vídeo novo com narração entra com legenda `.vtt`.

### 8.9 Equipe

Parede de 4 blocos (2 colunas < 1024, 4 ≥ 1024). Cada bloco: um hexágono
de pé (a mesma proporção do símbolo) de 72 px, em navy-800, com as
iniciais em branco (decorativas, `aria-hidden`), e o nome em H3 abaixo.
Sem foto e sem cargo.

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
  à faixa do botão). Hoje: o hero (`section#inicio`, que já tem dois botões
  de WhatsApp — sem isso, a 360 px eram três chamadas na primeira tela), o
  vídeo em destaque do portfólio (`video.portfolio__video`, com o tilt da
  rolagem), o cartão do formulário (`.form-card`, que tem o link do
  WhatsApp) e o rodapé (idem);
- a caixa dele cruza a de qualquer controle focável visível (`a[href]`,
  `button`, campos, `summary`, `video[controls]`, `[tabindex] ≥ 0`),
  conferido em rolagem, redimensionamento e foco. Ele nunca cobre um botão,
  campo, link ou controle de vídeo.

**Com a barra do hero "video" (§8.3.1), o FAB só existe abaixo de 1024
px** (decisão do Claudinho no HR1): a partir daí o WhatsApp já está sempre à
mostra na barra fixa. É CSS (`.topbar ~ .fab-whatsapp { display: none }` em
≥ 1024 px), então vale só nas páginas com a barra; no /privacidade, sem
barra, nada muda. Abaixo de 1024 px valem todas as regras acima.

Esconder é imediato; mostrar só depois de conferir com o quadro assentado
(dois `requestAnimationFrame`, porque o motion aplica o tilt dentro do
quadro, e de novo 150 ms depois de a rolagem parar).

Oculto de verdade: `data-visible="false"`, atributo `inert` (fora do Tab e
do leitor de tela) e `visibility: hidden`, não só opacidade. Começa oculto
no SSR (o hero está na tela ao carregar: sem divergência de hidratação e
sem piscar); sem JavaScript fica oculto: no hero "classic", o botão do
cabeçalho continua lá; no hero "video", abaixo de 1024 px o menu da barra
não abre sem JavaScript, e o WhatsApp fica no botão principal do hero.
A transição só existe com `prefers-reduced-motion: no-preference` e só na
entrada (fade de opacidade, `--duration-base`); a saída é instantânea, para
o botão nunca ficar "sumindo" por cima do que acabou de chegar embaixo
dele. No celular, `html` tem
`scroll-padding-bottom: 88px`: a rolagem por foco para o controle acima da
faixa do botão.

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

### 9.6 Hero "video" (padrão desde o HR1)

As §9.1–9.5 descrevem o hero **"classic"**, que continua no código. A
versão em uso é escolhida em `siteConfig.heroVariant` (`"video"` ou
`"classic"`, em `src/config/site.ts`); a barra do topo muda junto
(§8.3 ou §8.3.1). Implementação própria (ADR-005) no estilo pedido pelo
cliente; componentes em `src/components/sections/HeroVideo*.tsx` e
`HeroWordmark.tsx`; decisões na ADR-007.

**Camadas** (dentro de uma moldura com `--radius-3` e uma margem de
espaço de 8 px, 12 px ≥ 768, onde a aba da barra se encaixa):

```
5. Conteúdo            palavra "Strukti" (decorativa) + texto aprovado
4. Controle do vídeo   44 px, canto de cima à direita, abaixo da aba
                       (antes do texto no DOM: vem logo depois da barra no Tab)
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

- Altura: `min-height: calc(100svh − 2 × margem)`; o conteúdo cresce se
  precisar (telas baixas). Conteúdo no container do site.
- Contraste: o texto nunca fica sobre o vídeo; fica sobre a noite sólida
  (§3.4). Por que máscara, e não véu: um véu de 0,88 deixava ver o céu claro
  e a crista do morro atrás das letras, lidos como um "retângulo" de borda
  reta (revisão HR1). A moldura em noite, um tom acima da margem e da aba
  em espaço, mantém visíveis o recorte da moldura e o da aba;
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

---

## 10. Checklist anti-cara-de-IA (em toda entrega)

- [ ] Nada de gradiente roxo-azul, glassmorphism, brilho neon, texto em
      gradiente ou "orbe" de luz decorativo fora do hero.
- [ ] Nenhum emoji como ícone; ícones são SVG feitos para a função.
- [ ] Nenhuma seção resolvida como "três cartões iguais com ícone em cima":
      cada seção usa uma das composições da §5.2.
- [ ] Números só onde há sequência real (os passos do diagnóstico).
- [ ] Texto alinhado à esquerda; nada centralizado "por padrão".
- [ ] Sem sobretítulo em caixa-alta espacejada, sem palavra do título
      destacada em cor ou itálico, sem "A · B · C", sem "→" no fim de botão
      ou link (exceção: a seta no círculo do botão de diagnóstico do hero
      "video", ADR-007), sem fonte mono decorativa.
- [ ] Sem sombra cinza genérica em todo cartão, sem raio único para tudo,
      sem pílula (exceção: os dois botões do hero "video", ADR-007).
- [ ] Movimento só onde a §6 permite; nada de fade-e-sobe em cada parágrafo.
- [ ] Os detalhes vêm da marca (junta, hexágono, ponto do i) e têm função.
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
