#!/usr/bin/env node
// Falha (exit 1) se sobrar algum "[A PREENCHER" em src/. Rodar antes do
// deploy (L5) — ver README, seção "Pendências que bloqueiam a publicação".
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "src");
const PLACEHOLDER = "[A PREENCHER";

function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      found.push(...walk(full));
    } else if (stat.isFile()) {
      const content = readFileSync(full, "utf8");
      if (content.includes(PLACEHOLDER)) {
        found.push(full);
      }
    }
  }
  return found;
}

const filesWithPlaceholders = walk(ROOT);

if (filesWithPlaceholders.length > 0) {
  console.error(`Encontrado "${PLACEHOLDER}" nos arquivos abaixo — resolva antes de publicar:\n`);
  for (const file of filesWithPlaceholders) {
    console.error(" -", file);
  }
  process.exit(1);
}

console.log("Nenhum placeholder pendente em src/.");
