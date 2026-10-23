#!/usr/bin/env node
// collect-metrics.mjs — deterministic metric collector for the quality gate.
//
// WHY this exists: the gate must NOT depend on an agent's judgement to decide
// whether quality regressed. This script reduces each declared metric to a single
// NUMBER by running a command you configured and extracting a value from its output.
// It is stack-agnostic: Node is only the runner. Your project declares the commands
// (npm run lint, phpunit, jscpd, ...), so this works for any language.
//
// Output: writes metrics-summary.json as a flat map { metricId: number }, the SAME
// shape as baseline.json — so "freezing a baseline" is literally copying this file.
//
// Usage:
//   node collect-metrics.mjs [--config quality-gate.config.json] [--out metrics-summary.json]

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

function parseArgs(argv) {
  const args = { config: "quality-gate.config.json", out: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config") args.config = argv[++i];
    else if (argv[i] === "--out") args.out = argv[++i];
  }
  return args;
}

// Read a dot-path (e.g. "total.lines.pct") out of a parsed JSON value.
// Kept intentionally tiny (no JSONPath dependency) so the engine stays dependency-free.
function getByPath(obj, path) {
  if (!path) return obj;
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

// Turn a command's raw output into ONE number, according to the metric's extract rule.
// Supported extract types cover the vast majority of quality tools:
//   stdout-number : run a regex over stdout, capture group 1 → Number
//   stdout-lines  : count non-empty lines of stdout
//   json-path     : parse stdout as JSON, read a numeric value at a dot-path
//   json-length   : parse stdout as JSON, take the array length at a dot-path
//   exit-code     : use the command's exit code as the number (0 pass / non-zero fail)
function extractNumber(metric, stdout, exitCode) {
  const ex = metric.extract || { type: "stdout-number" };
  switch (ex.type) {
    case "exit-code":
      return exitCode;
    case "stdout-lines":
      return stdout.split("\n").filter((l) => l.trim() !== "").length;
    case "stdout-number": {
      const m = stdout.match(new RegExp(ex.regex));
      if (!m) throw new Error(`metric "${metric.id}": regex ${ex.regex} did not match output`);
      return Number(m[1]);
    }
    case "json-path": {
      const value = getByPath(JSON.parse(stdout), ex.path || "");
      return Number(value);
    }
    case "json-length": {
      const value = getByPath(JSON.parse(stdout), ex.path || "");
      if (!Array.isArray(value)) throw new Error(`metric "${metric.id}": json-length path is not an array`);
      return value.length;
    }
    default:
      throw new Error(`metric "${metric.id}": unknown extract type "${ex.type}"`);
  }
}

function collect(config) {
  const summary = {};
  for (const metric of config.metrics) {
    let stdout = "";
    let exitCode = 0;
    try {
      // Many quality tools exit non-zero when they find issues; that is NOT a runner
      // failure, so we capture stdout regardless and read the exit code from the error.
      //
      // maxBuffer: o default do execSync é 1MB. Ferramentas como o jscpd emitem
      // JSON com fragmentos de código dos clones — o report cresce com o codebase
      // e já passou de 1MB, o que TRUNCAVA o stdout e quebrava o JSON.parse
      // ("Unterminated string"). 256MB dá folga larga sem risco prático.
      stdout = execSync(metric.command, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 256 * 1024 * 1024,
        // Os comandos do config são POSIX (find, xargs, awk). No CI (Linux) o shell
        // padrão serve; no Windows, rode com QG_SHELL apontando para o bash do Git,
        // ex.: QG_SHELL="C:/Program Files/Git/bin/bash.exe".
        shell: process.env.QG_SHELL || undefined,
      });
    } catch (err) {
      stdout = (err.stdout || "").toString() + (err.stderr || "").toString();
      exitCode = typeof err.status === "number" ? err.status : 1;
    }
    const value = extractNumber(metric, stdout, exitCode);
    if (Number.isNaN(value)) throw new Error(`metric "${metric.id}": extracted value is NaN`);
    summary[metric.id] = value;
    console.log(`  ${metric.id} = ${value}`);
  }
  return summary;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = JSON.parse(readFileSync(args.config, "utf8"));
  const outPath = args.out || config.metricsPath || "metrics-summary.json";
  console.log(`Collecting ${config.metrics.length} metric(s) from ${args.config}...`);
  const summary = collect(config);
  writeFileSync(outPath, JSON.stringify(summary, null, 2) + "\n");
  console.log(`Wrote ${outPath}`);
}

main();
