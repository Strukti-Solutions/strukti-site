# Time de agentes (Maestri) — como retomar em outro PC

Guia do Claudinho (Maestro) para remontar o time de agentes do site da Strukti noutra máquina. A memória do Claude Code fica em cada PC e não vem pelo git. Por isso tudo o que o time precisa para continuar está aqui.

## 1. Pré-requisitos na máquina nova

- **Base:**
  - Node.js LTS e git.
  - GitHub CLI (`gh auth login`).
  - Claude Code e Maestri.
- **Navegador para o `check:browser`:** Microsoft Edge ou Chrome. O script usa o protocolo CDP (headless).
- **ffmpeg:** só para gerar ou tratar vídeos (`/brag`, pôsteres).
- **Skills do Claude Code:** `ui-ux-pro-max`, `shadcn` e `brag`.
- **Plugins:** frontend-design, superpowers, playwright, code-review, context7, feature-dev, vercel, typescript-lsp e security-guidance.
- **MCP da 21st.dev** (componentes):
  - Comando: `claude mcp add --scope user --transport http 21st https://21st.dev/api/mcp`, com a chave do usuário.
  - A chave fica só na máquina e **nunca** no repositório.
- **Clone e dependências:**
  ```
  git clone https://github.com/Strukti-Solutions/strukti-site.git C:\Dev\negocio
  cd C:\Dev\negocio
  npm ci
  npm run check:quarantine
  ```
  - Use sempre `npm ci`, ou `npm install --min-release-age=7` para dependência nova (ADR-003).
- **Opcional, para os papéis que leem o app de prova:** clone `Strukti-Solutions/rota-de-vendas` em `C:\Dev\rota_de_vendas`. Os papéis citam também `C:\dev\_video\brag-output` e `C:\dev\_qa`, materiais locais desta máquina que não estão no git; copie-os se precisar deles.

Se a pasta for outra, ajuste os caminhos em `papeis/comum.txt` antes de criar os papéis.

## 2. Hierarquia por andar

Cada andar do Maestri abriga um nível:

| Andar | Quem | Função |
|---|---|---|
| Térreo | Claudinho (Maestro, Opus) | líder geral: tarefas, prioridades, quadro, RAM, recrutar e dispensar |
| 1º andar ("Strukti") | Nanquim (Designer, Opus), Andaime (Dev Web, Sonnet), Crivo (Revisora, Opus), Manchete (Redator, Sonnet) | agentes principais, cada um lidera a sua frente |
| 2º andar ("2º andar · sub-agentes") | sub-agentes dos principais (ex.: Turbina e Ferrolho, Dev Web, Sonnet) | frentes paralelas pedidas por um agente do 1º andar |
| 3º andar em diante | níveis mais fundos | só se um sub-agente precisar do próprio sub-agente |

### Como funcionam os sub-agentes

- **Tarefa curta, sem terminal próprio** (pesquisa, varredura, rascunho): o agente usa o subagente interno do Claude Code (ferramenta Agent). Não precisa pedir a ninguém.
- **Frente paralela com terminal próprio:** o agente pede ao Claudinho com `maestri ask 'Claudinho'`, informando a tarefa, o critério de aceite e o modelo. O Claudinho então:
  1. confere a RAM;
  2. cria o worktree:
     ```
     git -C C:/dev/negocio worktree add C:/dev/negocio-wt/<nome> -b <branch> main
     ```
  3. recruta o sub-agente:
     ```
     maestri recruit "<Nome>" --role "Dev Web (Strukti)" --floor "2º andar · sub-agentes" --dir 'C:\dev\negocio-wt\<nome>' --command "claude --model sonnet --permission-mode auto"
     ```
  4. conecta: `maestri connect "<Nome>" "<líder>"`.
- **Quem pede lidera:** passa a tarefa, revisa o que volta e reporta para cima. O sub-agente reporta ao líder dele, não ao Claudinho, salvo bloqueio.
- O Claudinho dispensa o sub-agente quando ele termina.

### Modelos

Sempre fixe o modelo no `--command` (`claude --model opus|sonnet --permission-mode auto`). O `/model` de qualquer terminal muda o padrão global. Não use Haiku, porque ele ignora o modo auto.

## 3. Papéis

Os textos estão em `papeis/`. Cada papel é a primeira linha do arquivo dele, seguida de `comum.txt` e do resto do arquivo:

| Papel no Maestri | Arquivo |
|---|---|
| `Designer (Strukti)` | `papeis/designer.txt` |
| `Dev Web (Strukti)` | `papeis/dev-web.txt` |
| `Revisora (Strukti)` | `papeis/revisora.txt` |
| `Redator (Strukti)` | `papeis/redator.txt` |

Para gravar cada papel (Git Bash):

```
C="$(cat papeis/comum.txt)"; f=papeis/dev-web.txt
maestri role write "Dev Web (Strukti)" "$(head -1 $f)
$C

$(tail -n +2 $f)"
```

Um `role write` reinicia os agentes que usam o papel. Por isso, só grave papéis com os agentes ociosos.

## 4. Fluxo de entrega (resumo; o completo está em `papeis/comum.txt`)

1. Tarefa pequena com critério de aceite.
2. Branch curto a partir do `main`, Conventional Commits e `git add` explícito.
3. Definição de pronto, tudo passando:
   - typecheck, lint, testes, build e `check:quarantine`;
   - hidratação com e sem reduced motion;
   - `check:browser` em 11 larguras (de 360 a 1440, com o espaçamento de texto do WCAG 1.4.12), sem rolagem lateral, sem elemento fixo cobrindo controle e com as interações (menu com Tab, vídeos);
   - WCAG AA.
4. A Crivo revisa o delta até o APROVADO.
5. Integração no `main` por merge (nunca rebase), conferindo que a ponta integrada é o SHA aprovado.
6. Push e deploy só com o ok do cliente.

## 5. Fila pesada

Veja `FILA_PESADA.md`. Só um processo pesado roda por vez na máquina (npm ci, build, next start, check:browser, Lighthouse), controlado por um arquivo de vez (`FILA_PESADA.lock`). Com mais RAM dá para afrouxar a regra, mas meça antes. Cada agente gasta cerca de 450 MB: o terminal do Claude mais o MCP do Playwright.

## 6. Cuidados que já custaram tempo

- `maestri ask` transforma `\n` de caminhos do Windows em quebra de linha. Nas mensagens, escreva caminhos com `/`.
- **Agente parado num diálogo de pergunta:**
  - opção da lista: mande o número com `maestri ask "<agente>" --raw "N"`;
  - texto livre: mande `--raw "4"`, depois o texto e depois `--raw "\n"`;
  - se a pergunta for de autorização humana, pergunte ao usuário.
- **Limite de uso:** quando acaba, todos os agentes param e não voltam sozinhos. Depois do reset, rode `maestri check` em cada um e retome com uma mensagem dizendo onde ele parou.
- **Primeira vez numa pasta nova (`--dir`):** aparece o diálogo de confiança. Responda com `--raw "\e[B"` e depois `--raw "\n"`.
- **Processos:** nada de órfão (servidor ou navegador). O sistema derruba processos quando falta RAM.

## 7. Estado do trabalho

Onde paramos e os próximos passos estão em `ESTADO.md`.
