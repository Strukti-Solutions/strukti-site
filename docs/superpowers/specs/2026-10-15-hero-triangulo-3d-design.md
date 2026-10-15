# Hero: triângulo de objetos 3D girando — design

> **Situação em 15/10/2026 (fim do dia):** o hero de objetos 3D / triângulo (H1–H8) **não foi adotado**: os objetos chegaram a entrar no branch `feat/hero-triangulo-3d` e foram revertidos (o hero "estudio" voltou ao palco em sequência de quadros do `main`). O hero padrão passa a ser a variante **"expansao"** (MASTER §9.8, ADR-010). Desta spec, foram **implementados** só N1 (barra em cápsula ao rolar), N2 (`aria-current` nos links da barra) e N5 (atalhos no topo de Produtos). N3, N4 e N6 seguem não feitos. O texto abaixo fica como registro do brainstorm.

**Data:** 15/10/2026
**Status:** rascunho, para revisão do Thiago antes de virar tarefa (ver a situação acima).
**Autor:** Claudinho, a partir de brainstorm com o Thiago e inspeção técnica (REA) de padrões do site aferium.com.br.
**Base:**
- Protótipo interativo descartável (Claude Artifact, não é código do projeto): `https://claude.ai/artifact/8VYLc8bDykwFxfmxFEo6WH`.
- Inspeção REA do aferium.com.br (`inspect_web_page`, `analyze_web_bundle`, screenshot): confirmou Next.js/React sem lib de animação detectada — a flutuação dos elementos lá é CSS/JS próprio, não uma biblioteca de terceiros. Nenhum código deles foi copiado; só o padrão estrutural (objetos flutuantes, header que recolhe, demo embutida) serviu de referência.

## Por que

O Thiago pediu para deixar o site "parecido com o Aferium" em alguns pontos específicos de interação (não uma cópia — layout e textos são da Strukti). Depois de ver protótipos em artifact, convergiu num conceito: 3 objetos 3D (um por frente de negócio) flutuando em formato de triângulo invertido, girando sozinhos ou por um botão, como ilustração do hero.

## Decisões

| # | Tema | Decisão |
|---|---|---|
| H1 | Ilustração do hero | 3 objetos 3D estilizados (CSS puro: `perspective` + `rotateX/rotateY` + sombras empilhadas simulando espessura — sem three.js nem WebGL), um por frente: **Aplicativos**, **Site**, **Software + Hardware**. |
| H2 | Layout | Triângulo invertido: 2 objetos menores nos cantos de cima, 1 em destaque embaixo (maior, centralizado), com título + descrição curta + uma prévia (ver H5). |
| H3 | Giro | A cada ~4,5 s, a posição de destaque passa para o próximo objeto (ciclo de 3), com um fade curto na troca — não corte seco. |
| H4 | Controle manual | Um botão ("Ver próximo") avança o giro na hora e reinicia o temporizador automático. |
| H5 | Prévia embutida | Sob o objeto em destaque, um controle simples tipo player (play/pause + barra clicável) — eco da demonstração ao vivo do Aferium, sem replicar a arte deles. |
| H6 | Flutuação | Cada objeto oscila sutilmente no eixo vertical (técnica CSS clássica: `@keyframes` + `translateY`, com `animation-delay` escalonado por objeto para não sincronizar). |
| H7 | Modelo de conteúdo | "Aplicativos / Site / Software+Hardware" são **categorias de capacidade**, diferentes dos 3 nomes de produto já no ar (Replay, Rota de Vendas, Fleet Analytics BI). **Em aberto:** decidir com o Verbo se essas categorias substituem, resumem ou duplicam a seção Produtos — não resolvido nesta spec. |
| H8 | Texto do hero | Mantém o texto de marca já aprovado; o H1/subtítulo usados no protótipo são só placeholder de layout, não copy final. |

## Fora do hero: pequenas mudanças de navegação e interação

Vieram do mesmo brainstorm, validadas no protótipo, mas são independentes da decisão do hero (podem seguir mesmo que H1–H8 mude):

| # | Tema | Decisão |
|---|---|---|
| N1 | Barra superior | Ao rolar, a barra deixa de ser uma faixa cheia e vira uma cápsula flutuante centralizada (~860px), com fundo translúcido e `backdrop-filter: blur()`. |
| N2 | Seção ativa | Sinalizada diretamente nos links que já existem no menu (Replay / Rota de Vendas / Fleet Analytics BI / FAQ) — fundo e cor de destaque no item correspondente à seção visível. Sem componente novo (sem "chip" separado). |
| N3 | Entrada ao rolar | Os cards de "Como funciona" e "Produtos" entram com fade + leve subida ao aparecerem na tela (`IntersectionObserver`, dispara uma vez por elemento). |
| N4 | FAQ | Acordeão de verdade: clique expande/recolhe a resposta, chevron gira 180°. |
| N5 | Atalhos em Produtos | 3 pills ("Replay", "Rota de Vendas", "Fleet Analytics BI") no topo da seção, pulando direto para o card correspondente. |
| N6 | Tema | Toggle claro/escuro no header, usando os tokens reais do design system (`--color-navy-*`, `--color-electric-*`, `--color-cyan-*` de `src/app/globals.css`), não cores inventadas. |

## Implementação técnica (quando for para código de verdade)

- **Objetos 3D:** `perspective` no elemento pai + `transform: rotateY() rotateX()` no objeto + `box-shadow` em camadas (offset sólido, sem blur) para simular a face lateral — técnica 100% CSS, sem dependência nova.
- **Giro automático:** um único temporizador (`setInterval`) controlando qual objeto ocupa a posição de destaque; ao trocar, um `setState` intermediário zera a opacidade por ~200ms antes de atualizar o conteúdo (fade). Zero bibliotecas de carrossel.
- **Seção ativa / entrada ao rolar:** `scroll` (com `requestAnimationFrame` para não disparar a cada pixel) e `IntersectionObserver`, nativos do browser — sem lib.
- **Redução de movimento:** a flutuação (H6) e a transição de giro (H3) precisam de um bloco `@media (prefers-reduced-motion: reduce)` que zera `animation`/`transition` nesses elementos, sem trocar a árvore de componentes. *Isso ainda não está no protótipo do artifact; precisa entrar na implementação real.*
- **Giro automático x conteúdo que se move sozinho:** o giro troca de conteúdo a cada poucos segundos, então precisa de uma forma de pausar. Proposta: checar a preferência de movimento reduzido antes de iniciar o `setInterval` — se a pessoa prefere menos movimento, o giro automático nem começa (só o botão manual funciona). Considerar também pausar ao passar o mouse ou dar foco na área.

## Pendências antes de virar tarefa

1. **H7** — alinhar com o Verbo se "Aplicativos/Site/Software+Hardware" é uma camada nova de conteúdo ou deveria mapear 1:1 com os 3 produtos atuais.
2. **Arte final dos 3 objetos** — o protótipo usa formas bem genéricas (celular, janela de navegador, placa com pinos); precisa de um passe de design de verdade antes de virar produção, mantendo a técnica (CSS puro, sem lib).
3. Copy final do H1/subtítulo do hero — com o Verbo, não travada aqui.
