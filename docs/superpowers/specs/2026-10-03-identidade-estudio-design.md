# Identidade "Estúdio" e home nova da Strukti — design

Data: 03/10/2026. Status: aguardando revisão do Thiago.

## 1. Por que mudar

A Strukti mudou de rumo. O foco maior agora são **produtos que juntam hardware e IA**. Os aplicativos sob medida continuam, mas ficam em segundo plano. O site atual vende "aplicativo sob medida para distribuidoras" e não representa mais a empresa.

Fonte das decisões de negócio: o documento `contexto-replay.md` (03/10/2026), com as correções desta conversa (seção 9).

## 2. O que foi decidido

| Tema | Decisão |
|---|---|
| Papel do site | Vitrine da marca-mãe Strukti, com catálogo de produtos de hardware (em destaque) e de aplicativos. Cada produto pode ganhar site próprio depois; o do replay vem antes, mas **não faz parte deste trabalho**. |
| Venda | Cada produto tem a sua chamada (replay: demonstração; apps: diagnóstico) e há um contato geral para quem tem outra necessidade. O site serve tanto de cartão de visita na prospecção quanto para gerar contato sozinho. |
| Marca | O nome **Strukti** e o **símbolo atual** continuam. Muda o visual em volta. |
| Direção visual | **A · Produto em estúdio**: fundo escuro, produto iluminado como peça de vitrine, animado pela rolagem (referência: o reel de sites com 3D, sem copiar nenhum deles). |
| Objeto 3D | **Modelo estilizado** do botão de replay, feito por nós. Não há modelo nem caixa definitiva do produto. O site sempre o identifica como ilustração do conceito. |
| Técnica do 3D | **Sequência de quadros pré-renderizada no Blender**, desenhada num `<canvas>` conforme a rolagem. |
| Escopo desta rodada | Design system v3 **e** home reconstruída. Páginas próprias de cada produto ficam fora. |
| Agendar demonstração do replay | Abre o **WhatsApp com mensagem pronta**. |

## 3. Identidade: design system v3 "Estúdio"

O `design-system/strukti-solucoes/MASTER.md` passa à v3. O que não muda é mantido como está na v2.

**Fica (é a marca):** o símbolo hexagonal e os arquivos de `public/brand/`; a fonte Geologica com o eixo SHRP; as escalas marinho, elétrico e ciano (§3.1 da v2); as três assinaturas (a junta, o hexágono, o ponto do i); contraste WCAG 2.2 AA.

**Muda:**

1. **Conceito "Estúdio".** A Strukti mostra os produtos como peças de vitrine, sob luz controlada. O escuro é a base da página. O claro fica só onde se lê e se age: chamada geral, como trabalhamos, equipe, contato, dúvidas e aviso de privacidade.
2. **Quarta assinatura: a luz de estúdio.** Luz principal azul elétrico (`electric-500`) atrás do produto e contorno ciano (`cyan-400`). Só aparece onde há produto (palco), nunca como fundo decorativo solto.
3. **Componente palco.** Superfície escura (`navy-950` → `navy-900`) com piso em degradê e a luz de estúdio. Usado no hero e nos cards de hardware e de aplicativos. Nos aplicativos, a tela do app (vídeo ou pôster já existentes) ocupa o lugar do objeto.
4. **Selos de status.** Todo produto mostra um, e o texto é fixo:
   - "Piloto gratuito": replay e o aplicativo Rota de Vendas (decisão do cliente);
   - "Em desenvolvimento": estacionamento inteligente;
   - "Em uso": aplicativos que já rodam (Fleet Analytics BI);
   - "Em breve": qualquer recurso de IA.
   Cor e contraste definidos no MASTER v3; o selo nunca é o único portador da informação (o texto também diz).
5. **Ficha técnica.** Números grandes com algarismos tabulares (`font-variant-numeric: tabular-nums`) na Geologica, com rótulo curto embaixo. Exemplo do replay: "30 s", "Wi-Fi", "PoE". Sem fonte nova.
6. **Movimento.** Animação guiada pela rolagem só no hero. No resto, as entradas suaves que já existem (`src/lib/motion.ts`, componente `Reveal`). Tudo respeita `prefers-reduced-motion`.
7. **Registro.** ADR-009 em `docs/DECISOES.md`: a mudança de rumo, a direção "Estúdio" e por que a sequência de quadros venceu o Three.js (decisão do cliente: visual mais fotográfico, nenhuma biblioteca de 3D no site).

## 4. Home nova

Seções, em ordem:

| # | Seção | Fundo | Conteúdo |
|---|---|---|---|
| 1 | Barra do topo | escuro | A barra atual (`TopBar`), com o menu: Produtos, Apps, Equipe, Contato e o botão de WhatsApp. |
| 2 | Hero | escuro | Sequência do botão de replay (seção 5). Título sobre a Strukti (hardware + IA); botões "Conhecer o replay" (âncora para a seção 3) e "Falar no WhatsApp"; selo discreto "Ilustração do conceito". |
| 3 | Produtos de hardware | escuro, palcos | **Replay**, card grande: o que é (1 frase); como funciona em 3 passos (aperta o botão → o clipe é cortado → chega no celular); ficha técnica; selo "Piloto gratuito"; botão "Agendar demonstração" → WhatsApp com mensagem pronta. Espaço para o link do site do replay, escondido enquanto o endereço não existir. **Estacionamento inteligente**, card menor: selo "Em desenvolvimento", 1 frase, botão "Quero conversar sobre isso" → WhatsApp com mensagem pronta. |
| 4 | Aplicativos | escuro, palcos | Rota de Vendas e Fleet Analytics BI, reaproveitando `ProjectGrid`, os vídeos e os pôsteres atuais, agora em palcos. Selos "Piloto gratuito" (Rota de Vendas) e "Em uso" (Fleet Analytics BI). Chamada "Diagnóstico gratuito" → formulário com interesse "Aplicativo". |
| 5 | Tem um problema que pede hardware? | claro | Chamada geral para empresas fora do catálogo → formulário com interesse "Outro". |
| 6 | Como trabalhamos | claro | Seção atual (`ComoResolvemos`) adaptada: diagnóstico, protótipo, instalação, suporte local. |
| 7 | Equipe | claro | Nomes e curso. Fotos ficam como `[A PREENCHER]` até o grupo mandar. |
| 8 | Contato | claro | Formulário único (seção 6). |
| 9 | Dúvidas e rodapé | claro / escuro | `Faq` e `Rodape` atuais, com o texto novo. |

**Saem:** `Problemas` (dores das distribuidoras) e o bloco `Diagnostico` como seção própria. O diagnóstico vira a chamada dos aplicativos e o campo "interesse" do formulário. O componente de formulário e os seus testes de estados (erro, enviando, sucesso, falha, limite) são reaproveitados.

## 5. Hero em sequência de quadros

### 5.1 Produção (`scripts/hero-3d/`, versionado)

- **Ferramenta:** Blender (versão estável atual, instalada na máquina de quem renderiza; download oficial de blender.org, com autorização do Thiago antes de baixar). Rodado sem interface: `blender -b -P scripts/hero-3d/render.py`.
- **Modelo, gerado pelo script** (nada modelado à mão, para qualquer um do grupo refazer): caixa de cantos arredondados; botão grande circular; LED em barra; o hexágono da Strukti em baixo relevo na caixa. Materiais e cores da marca.
- **Cena:** piso escuro com degradê, luz principal elétrica atrás, contorno ciano, fundo `navy-950`. É a luz de estúdio da seção 3.
- **Câmera (a história):** o botão surge do escuro → gira cerca de 180° → a câmera aproxima → o botão é apertado e o LED acende ("aperta e o lance volta").
- **Saídas:** desktop com ~90 quadros a 1600 px de largura; celular com ~45 quadros a 800 px. Compressão em AVIF com o ffmpeg. Mais um quadro-chave escolhido como pôster (AVIF + JPG).
- **Orçamento:** desktop ≤ 3 MB no total; celular ≤ 1,2 MB. Se passar, reduz-se primeiro a qualidade, depois o número de quadros.
- **Destino:** `public/hero/sequencia/desktop/`, `public/hero/sequencia/celular/` e o pôster em `public/hero/sequencia/`. Servidos pelo próprio site (CSP `img-src 'self'` já cobre). Render nosso: nenhuma licença de terceiro.
- **Troca futura:** quando existir a caixa definitiva (CAD/STL), o script passa a importar o arquivo em vez de gerar o modelo; câmera, luz e saídas continuam.

### 5.2 No site (`HeroSequence`)

- Novo valor `"estudio"` em `HeroVariant` (`src/config/site.ts`), que passa a ser o padrão. `"video"` e `"classic"` continuam até a v3 ser aprovada no ar; a remoção vem numa limpeza separada, com registro no `DECISOES.md`.
- A seção do hero tem cerca de 2,5 alturas de tela; dentro dela, um palco fixo (`position: sticky`) com o `<canvas>`. A posição da rolagem dentro da seção escolhe o quadro. Desenho por `requestAnimationFrame`, só quando o quadro muda.
- Texto e botões: à esquerda no desktop, em cima no celular. São HTML comum, não fazem parte do canvas.
- **Carregamento:** o pôster vem como `<img>` comum no HTML do servidor (é o LCP). O conjunto de quadros (desktop ou celular, pela largura e pela densidade da tela) baixa depois do `load`. Enquanto um quadro não chegou, o canvas mostra o mais próximo já carregado.
- **Sem animação:** com `prefers-reduced-motion`, com `navigator.connection.saveData`, sem JavaScript ou com falha ao carregar os quadros, fica só o pôster, e a seção perde a altura extra. Todo o conteúdo continua acessível.
- **Acessibilidade:** o canvas é decorativo (`aria-hidden`); o pôster tem `alt` vazio, e o selo "Ilustração do conceito" é texto visível. O foco do teclado nunca fica preso no trecho fixo.
- **Unidade testável:** uma função pura `frameForProgress(progresso, totalDeQuadros)` → índice. O componente só cuida de DOM e carregamento.

## 6. Formulário, dados e LGPD

- Campos: nome, empresa, WhatsApp, **interesse** (Replay, Estacionamento inteligente, Aplicativo, Outro), mensagem, consentimento (não pré-marcado). O schema Zod continua compartilhado entre cliente e servidor.
- As chamadas da página podem abrir o formulário com o interesse já marcado (âncora com parâmetro, sem guardar nada).
- Banco: a tabela `leads` ganha `interest TEXT NOT NULL`. O SQL de migração vai no README, junto do `CREATE TABLE` atualizado. Sem `DATABASE_URL`, a rota continua respondendo `503` com mensagem clara.
- O aviso de privacidade é atualizado (o que se coleta e para quê) e `privacyPolicyVersion` sobe.
- WhatsApp com mensagem pronta: os textos ficam em `src/content/landing.ts`; o link é montado por uma função só, com teste.

## 7. Texto, documentação e ordem de entrega

**Texto.** O Claude escreve a v2.0 de `docs/landing-copy.md` com a home inteira. **Portão:** nenhum texto novo entra em `src/content/landing.ts` antes da aprovação do Thiago.

**Ordem**, cada etapa num branch curto, revisada pela Crivo até APROVADO e integrada por merge:

1. **Documentação:** `CLAUDE.md` (novo rumo), ADR-009, `MASTER.md` v3, `ESTADO.md` (novo backlog), `.superpowers/` no `.gitignore`.
2. **Texto v2.0** em `docs/landing-copy.md` → aprovação do Thiago.
3. **Quadros do 3D:** instalar o Blender (com autorização), script, render, compressão dentro do orçamento; mostrar alguns quadros ao Thiago antes de seguir.
4. **Hero no site:** `HeroSequence`, `"estudio"` como padrão, conferências novas no `check:browser`.
5. **Home reestruturada:** palcos, selos, catálogo, WhatsApp com mensagem pronta, formulário com interesse, migração, aviso de privacidade.
6. **Depois, à parte:** remover os heros "video" e "classic" e os arquivos que só eles usam.

## 8. Testes e definição de pronto

A definição de pronto do README vale para toda etapa (typecheck, lint, testes, `check:quarantine`, build, `check:browser`). Novos testes:

- `frameForProgress`: início, fim, valores fora de 0–1, poucos quadros.
- Schema do formulário com `interest` (válido, ausente, valor fora da lista) e a rota de API gravando o campo.
- Link do WhatsApp com mensagem pronta (texto codificado corretamente).
- axe em cada seção nova; hidratação da página inteira com e sem reduced motion (o teste existente cobre).
- `check:browser`: rolar o hero troca o quadro desenhado; com reduced motion o hero fica parado e sem altura extra; nenhuma rolagem lateral em nenhuma largura; o botão flutuante do WhatsApp não cobre controles nas seções novas.
- Orçamento de tamanho dos quadros conferido por script (falha se passar de 3 MB / 1,2 MB).

## 9. Correções ao `contexto-replay.md`

- O replay usa o **Wi-Fi da arena**, não roteador 4G. O site não promete "funciona sem internet".
- O replay terá site próprio; o site da Strukti não cobre área do jogador nem painel da quadra.
- Os aplicativos continuam no catálogo.
- O documento diz React com Vite; o site da Strukti continua em Next.js, neste repositório.

## 10. Regras de conteúdo (valem para todo o texto novo)

- Nada inventado: clientes, depoimentos, números de uso, logos, resultados. Onde faltar, `[A PREENCHER]`.
- Recursos de IA sempre como "em breve".
- Nenhum concorrente citado pelo nome.
- O 3D é sempre identificado como ilustração do conceito.
- Português do Brasil, com acentos.

## 11. Fica `[A PREENCHER]` até o grupo mandar

- Fotos e curso de cada pessoa da equipe.
- Endereço do site do replay.
- Provedores de hospedagem e banco no aviso de privacidade (pendência antiga).
- Domínio final (`SITE_URL`).

## 12. Fora deste trabalho

Site do replay, área do jogador, painel da quadra, páginas próprias de cada produto, preço do replay, região de atuação.
