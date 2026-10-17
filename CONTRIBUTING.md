# Como contribuir

## Protocolo de branches e PRs

| Branch | Papel |
|---|---|
| `main` | Produção. Só recebe PR vindo de `homologacao`. |
| `homologacao` | Homologação: onde o trabalho é validado antes de ir para produção. Recebe os PRs das branches de trabalho. |
| `feat/...`, `fix/...`, `docs/...`, `ci/...` | Branch própria de cada mudança, criada a partir de `homologacao`. |

Toda mudança nas branches compartilhadas (`homologacao` e `main`) entra por Pull Request:

1. Crie a branch a partir de `homologacao` atualizada.
2. Faça commits pequenos e com mensagem clara. Use `git add` com arquivos explícitos e nunca reescreva o histórico (sem rebase nem force-push).
3. Abra o PR para `homologacao`. O CI precisa ficar verde: `CI` (quarentena, typecheck, lint, test, build e `check:browser`) e `quality-gate`.
4. Revise e faça o merge (merge commit ou squash). Depois apague a branch.
5. Para publicar, abra um PR de `homologacao` para `main` e faça o merge com o CI verde.

A única exceção é a sincronização descendente por fast-forward depois de um merge (`main` → `homologacao`). Ela não cria commit novo.

O workflow `direct-push guard` acusa em vermelho qualquer push direto em `main` ou `homologacao` que não tenha vindo de um PR. Ele não impede o push, porque o plano Free não tem branch protection, mas notifica quem fez.

## Antes de abrir o PR

A definição de pronto, na ordem, está no `README.md` e no `CLAUDE.md`:

```bash
npm run typecheck && npm run lint && npm run test
npm run check:quarantine
npm run build            # com o dev parado
npm run dev              # e, em outro terminal:
npm run check:browser
```

O quality gate (`scripts/quality-gate/README.md`) roda no PR. Se ele reprovar, corrija o código; não mexa no baseline.

## Regras que não mudam

- Nunca invente cases, depoimentos, números ou logos.
- Dependências entram em versão exata e com quarentena de 7 dias (`npm install --min-release-age=7` e `npm run check:quarantine`).
- Segredos (`DATABASE_URL` etc.) ficam só no `.env.local` e nas variáveis do provedor, nunca no repositório.
- Push, deploy e conta em serviço externo só com o ok do cliente.
