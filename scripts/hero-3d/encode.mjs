#!/usr/bin/env node
// PNG (render do Blender) -> AVIF dos quadros + pôster AVIF/JPG do quadro 0
// (MASTER §9.7; spec 2026-10-03 §5.1). Uso:
//   node scripts/hero-3d/encode.mjs [--crf 18]
// Lê .hero-render/{desktop,celular}/f###.png e escreve em
// public/hero/sequencia/{desktop,celular}/. FFMPEG_PATH escolhe o ffmpeg.
//
// Qualidade antes de tamanho: o fundo é um degradê marinho muito escuro (halo
// e piso), e com crf 34 em 8 bits ele mostrava faixas. Por isso 10 bits
// (yuv420p10le) e crf 18, escolhido comparando os quadros decodificados com os
// PNGs. Mesmo assim o conjunto fica muito abaixo do orçamento (3 MB / 1,2 MB).
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const SETS = ["desktop", "celular"];
const crfArg = process.argv.indexOf("--crf");
const CRF = crfArg > -1 ? Number(process.argv[crfArg + 1]) : 18;
const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";

function ffmpeg(args) {
  execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
}

function avif(input, output, crf) {
  ffmpeg(["-i", input, "-c:v", "libaom-av1", "-still-picture", "1", "-crf", String(crf), "-b:v", "0", "-cpu-used", "6", "-pix_fmt", "yuv420p10le", output]);
}

for (const set of SETS) {
  const source = path.join(ROOT, ".hero-render", set);
  const target = path.join(ROOT, "public", "hero", "sequencia", set);
  mkdirSync(target, { recursive: true });
  const pngs = readdirSync(source).filter((name) => /^f\d{3}\.png$/.test(name)).sort();
  if (pngs.length === 0) throw new Error(`Nenhum PNG em ${source}. Rode o render.py antes.`);

  let total = 0;
  for (const png of pngs) {
    const out = path.join(target, png.replace(".png", ".avif"));
    avif(path.join(source, png), out, CRF);
    total += statSync(out).size;
  }
  // Pôster = quadro 0, com mais qualidade (é o LCP e a imagem de quem não anima).
  avif(path.join(source, pngs[0]), path.join(target, "poster.avif"), Math.max(CRF - 6, 18));
  ffmpeg(["-i", path.join(source, pngs[0]), "-q:v", "2", path.join(target, "poster.jpg")]);

  console.log(`${set}: ${pngs.length} quadros, ${(total / 1_000_000).toFixed(2)} MB (crf ${CRF})`);
}
