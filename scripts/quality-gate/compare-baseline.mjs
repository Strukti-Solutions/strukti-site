#!/usr/bin/env node
// compare-baseline.mjs — the deterministic PASS/FAIL authority of the quality gate.
//
// WHY this exists: an agent must never decide "did quality regress?" by judgement.
// This script compares the collected metrics against a FROZEN baseline using each
// metric's declared direction, and exits non-zero if any BLOCKING metric regressed.
// CI treats that exit code as the final word. The ratchet only turns one way.
//
// Comparison rule (the operational golden rule):
//   lower_better  : current <= baseline → PASS | current > baseline → FAIL
//   higher_better : current >= baseline → PASS | current < baseline → FAIL
//
// Classes: blocking (fails the gate) | warning (reported, does not fail) | info (reported).
// strictMode:true in the config forces EVERY metric to blocking (the video's pure rule).
//
// Usage:
//   node compare-baseline.mjs [--config quality-gate.config.json]
//   Exit 0 = gate PASS. Exit 1 = gate FAIL (a blocking metric regressed).

import { readFileSync, writeFileSync, existsSync } from "node:fs";

function parseArgs(argv) {
  const args = { config: "quality-gate.config.json" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config") args.config = argv[++i];
  }
  return args;
}

function statusFor(direction, current, baseline) {
  // Equal always passes — the ratchet allows "hold", only forbids "worse".
  if (direction === "higher_better") return current >= baseline ? "PASS" : "FAIL";
  return current <= baseline ? "PASS" : "FAIL"; // lower_better (default)
}

function fmtDelta(direction, delta) {
  const sign = delta > 0 ? "+" : "";
  const arrow = delta === 0 ? "→" : (direction === "higher_better") === delta > 0 ? "↑ better" : "↓ worse";
  return `${sign}${delta} (${arrow})`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = JSON.parse(readFileSync(args.config, "utf8"));
  const baselinePath = config.baselinePath || "baseline.json";
  const metricsPath = config.metricsPath || "metrics-summary.json";
  const reportPath = config.reportPath || "quality-report.md";
  const strict = config.strictMode === true;

  if (!existsSync(baselinePath)) {
    console.error(
      `No baseline found at ${baselinePath}. Freeze one first:\n` +
        `  node scripts/collect-metrics.mjs && cp ${metricsPath} ${baselinePath}`
    );
    process.exit(1);
  }
  const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
  const current = JSON.parse(readFileSync(metricsPath, "utf8"));

  const rows = [];
  const blockingFailures = [];
  let sawNewMetric = false;

  for (const metric of config.metrics) {
    const cls = strict ? "blocking" : metric.class || "blocking";
    const cur = current[metric.id];
    if (cur == null) {
      console.error(`metric "${metric.id}" missing from ${metricsPath} — collector did not produce it`);
      process.exit(1);
    }
    if (baseline[metric.id] == null) {
      // A metric with no baseline yet: report it, tell the user to freeze — never block on it.
      sawNewMetric = true;
      rows.push({ id: metric.id, cls: "info", baseline: "—", current: cur, delta: "new metric", status: "SEED" });
      continue;
    }
    const base = baseline[metric.id];
    const status = statusFor(metric.direction || "lower_better", cur, base);
    const delta = fmtDelta(metric.direction || "lower_better", cur - base);
    // Display status distinguishes a blocking failure from a non-blocking regression, so a
    // warning that regressed doesn't read as "FAIL" while the gate still passes.
    const display = status === "PASS" ? "PASS" : cls === "blocking" ? "FAIL" : cls === "warning" ? "WARN" : "INFO";
    rows.push({ id: metric.id, cls, baseline: base, current: cur, delta, status: display });
    if (status === "FAIL" && cls === "blocking") {
      blockingFailures.push({ id: metric.id, base, cur, delta });
    }
  }

  // Build the Markdown report the agent (and humans) read to know WHAT regressed.
  const lines = [];
  lines.push("# Quality Gate Report", "");
  lines.push(`Mode: **${strict ? "strict (all blocking)" : "classified"}**`, "");
  lines.push("| Metric | Class | Baseline | Current | Delta | Status |");
  lines.push("|---|---|---|---|---|---|");
  for (const r of rows) {
    lines.push(`| ${r.id} | ${r.cls} | ${r.baseline} | ${r.current} | ${r.delta} | ${r.status} |`);
  }
  lines.push("");
  if (blockingFailures.length > 0) {
    lines.push("## ❌ Blocking regressions — the gate FAILED", "");
    for (const f of blockingFailures) {
      lines.push(`- **${f.id}**: baseline ${f.base} → current ${f.cur} (${f.delta})`);
    }
    lines.push("", "Fix the CODE so these return to baseline or better.");
    lines.push("Do NOT edit the baseline, tool config, thresholds, or this gate to pass. See ratchet.md.");
  } else {
    lines.push("## ✅ Gate PASSED — no blocking regressions.");
  }
  if (sawNewMetric) {
    lines.push("", "> Some metrics have no baseline yet (SEED). Freeze them: `cp " + metricsPath + " " + baselinePath + "`.");
  }
  const report = lines.join("\n") + "\n";
  writeFileSync(reportPath, report);
  console.log(report);

  if (blockingFailures.length > 0) {
    console.error(`Quality gate FAILED: ${blockingFailures.length} blocking regression(s).`);
    process.exit(1);
  }
  console.log("Quality gate PASSED.");
  process.exit(0);
}

main();
