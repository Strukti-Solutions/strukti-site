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
| Métrica | Classe | Baseline (16/10/2026) |
|---|---|---|
| `duplication_pct` (jscpd 5.3.2) | blocking | 1,60% |
| `files_over_400_lines` (.ts/.tsx) | blocking | 5 (`blackhole-hero-section.tsx`, `HeroExpansao.test.tsx`, `landing.ts`, `scroll-expansion-hero.tsx`, `spike/FioPrototipo.tsx`) |
| `largest_file_lines` (.ts/.tsx) | warning | 1243 (`blackhole-hero-section.tsx`) |

O baseline acompanha o estado de `homologacao` quando o gate entra. Ele foi
recongelado em 13/10/2026, depois da prévia v2.2 (#7), que trouxe o protótipo
`spike/FioPrototipo.tsx` com 525 linhas, e de novo em 16/10/2026, depois do
hero "expansao" (#8), que trouxe `scroll-expansion-hero.tsx` (548 linhas) e
`HeroExpansao.test.tsx` (661 linhas) e subiu a duplicação de 1,40% para 1,60%.
Nos dois casos este PR não mexe em `src/`: o código já estava em `homologacao`.
Quando o fio tiver a implementação definitiva e o hero for dividido, o limite
baixa de volta.

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
