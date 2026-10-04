# quality-gate (strukti-site)

Ratchet de qualidade determinístico, adaptado do `lms_corporativo`. Um PR pode
adicionar código, mas não pode piorar uma métrica *blocking*. Quem decide é o exit
code do `compare-baseline.mjs`, e não o julgamento de quem revisa.

## Arquivos
- `collect-metrics.mjs` / `compare-baseline.mjs`: o motor. Ele roda os comandos do
  config e decide PASS/FAIL. É o mesmo do lms, com uma diferença: aceita `QG_SHELL`
  para rodar no Windows.
- `../../quality-gate.config.json`: quais métricas, comandos e classes.
- `../../baseline.quality-gate.json`: o **baseline congelado** (o padrão), versionado.
- `.github/workflows/quality-gate.yml`: roda em todo PR e comenta o relatório no PR.

## Rodar localmente
No Linux ou no macOS:
```bash
node scripts/quality-gate/collect-metrics.mjs      # -> metrics-summary.quality-gate.json
node scripts/quality-gate/compare-baseline.mjs     # -> quality-report.md + exit 0/1
```
No Windows, os comandos do config são POSIX (find, xargs, awk). Rode no Git Bash
apontando o shell:
```bash
QG_SHELL="C:/Program Files/Git/bin/bash.exe" node scripts/quality-gate/collect-metrics.mjs
node scripts/quality-gate/compare-baseline.mjs
```

## Métricas (v1: estáticas, sem build nem banco, sobre `src/`)
| Métrica | Classe | Baseline inicial (04/10/2026) |
|---|---|---|
| `duplication_pct` (jscpd 5.3.2) | blocking | 2,45% |
| `files_over_400_lines` (.ts/.tsx) | blocking | 2 |
| `largest_file_lines` (.ts/.tsx) | warning | 1243 (`blackhole-hero-section.tsx`) |

O `jscpd` roda via `npx` numa versão **exata**, publicada há mais de 7 dias, para
respeitar a regra de quarentena do projeto. Para atualizar a versão, escolha uma que
também tenha passado a quarentena.

Regra de ouro: não "passe" o gate editando o baseline ou o config. Corrija o código:
divida o arquivo grande, extraia o trecho duplicado. Mudar o padrão é deliberado e
vai num PR próprio, revisado.

## Fase 2 (a plugar)
Ainda faltam `lint_errors`, `typecheck_errors` e `coverage_pct`. Esses já são
garantidos pelo `ci.yml` (que falha em qualquer erro); entram aqui quando valer a
pena medir tendência. Ao congelar cada um, acrescente a chave no baseline.

## Atualizar/congelar o baseline (deliberado)
```bash
node scripts/quality-gate/collect-metrics.mjs
cp metrics-summary.quality-gate.json baseline.quality-gate.json   # revisado, em PR próprio
```
