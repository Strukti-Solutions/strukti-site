#!/usr/bin/env node
// Quarentena contra ataque de cadeia de suprimentos (ver CLAUDE.md e
// docs/DECISOES.md): falha (exit 1) se QUALQUER pacote do
// package-lock.json — direto ou transitivo — tiver sido publicado há
// menos de 7 dias. Roda como parte da definição de pronto, junto do
// typecheck, lint, test e build.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const QUARANTINE_DAYS = 7;
const CONCURRENCY = 8;
const REQUEST_TIMEOUT_MS = 15_000;

const lockPath = join(import.meta.dirname, "..", "package-lock.json");
const lock = JSON.parse(readFileSync(lockPath, "utf8"));

if (lock.lockfileVersion < 3 || !lock.packages) {
  console.error("package-lock.json não está no formato esperado (lockfileVersion 3, com `packages`).");
  process.exit(1);
}

function nameFromPackagePath(pkgPath) {
  const segments = pkgPath.split("node_modules/");
  const last = segments[segments.length - 1];
  return last || null;
}

const seen = new Map(); // "name@version" -> name/version
for (const [pkgPath, entry] of Object.entries(lock.packages)) {
  if (pkgPath === "" || entry.link || !entry.version) continue;
  const name = nameFromPackagePath(pkgPath);
  if (!name) continue;
  seen.set(`${name}@${entry.version}`, { name, version: entry.version });
}

const packages = [...seen.values()];
console.log(`Checando a data de publicação de ${packages.length} pacotes (diretos + transitivos)...`);

const cutoff = new Date();
cutoff.setUTCDate(cutoff.getUTCDate() - QUARANTINE_DAYS);

async function fetchPublishedAtOnce(name, version) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return { name, version, error: `HTTP ${res.status}` };
    }
    const json = await res.json();
    const publishedAt = json.time?.[version];
    if (!publishedAt) {
      return { name, version, error: "sem data de publicação no registry" };
    }
    return { name, version, publishedAt: new Date(publishedAt) };
  } catch (error) {
    return { name, version, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timeout);
  }
}

// Uma retentativa: evita falso-negativo da quarentena por causa de um
// soluço de rede, não de um pacote realmente recente.
async function fetchPublishedAt(name, version) {
  const first = await fetchPublishedAtOnce(name, version);
  if (!first.error) return first;
  return fetchPublishedAtOnce(name, version);
}

async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function runNext() {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runNext));
  return results;
}

const results = await runWithConcurrency(packages, CONCURRENCY, ({ name, version }) =>
  fetchPublishedAt(name, version),
);

const tooRecent = results.filter((r) => r.publishedAt && r.publishedAt > cutoff);
const unresolved = results.filter((r) => r.error);

if (unresolved.length > 0) {
  console.error(`\nNão foi possível checar ${unresolved.length} pacote(s):`);
  for (const r of unresolved) {
    console.error(` - ${r.name}@${r.version}: ${r.error}`);
  }
}

if (tooRecent.length > 0) {
  console.error(
    `\n${tooRecent.length} pacote(s) publicado(s) há menos de ${QUARANTINE_DAYS} dias (quarentena violada):`,
  );
  for (const r of tooRecent.sort((a, b) => b.publishedAt - a.publishedAt)) {
    console.error(` - ${r.name}@${r.version}: ${r.publishedAt.toISOString().slice(0, 10)}`);
  }
}

if (tooRecent.length > 0 || unresolved.length > 0) {
  console.error(
    "\nRegenere o lock com `npm install --min-release-age=7` (fixando em `overrides` o que não resolver sozinho) ou aguarde a janela de quarentena passar.",
  );
  process.exit(1);
}

console.log(`Nenhum pacote do lock foi publicado nos últimos ${QUARANTINE_DAYS} dias.`);
