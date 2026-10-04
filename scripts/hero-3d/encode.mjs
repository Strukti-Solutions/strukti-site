#!/usr/bin/env node
// PNG (render do Blender) -> AVIF dos quadros + pôster AVIF/JPG do quadro 0
// (MASTER §9.7; spec 2026-10-03 §5.1). Uso:
//   node scripts/hero-3d/encode.mjs [--crf 18]
// Lê .hero-render/{desktop,celular}/f###.png e escreve em
// public/hero/sequencia/{desktop,celular}/. FFMPEG_PATH escolhe o ffmpeg
// (precisa do libaom-av1 e do muxer AVIF).
//
// Qualidade antes de tamanho: o fundo é um degradê marinho muito escuro (halo
// e piso), e com crf 34 em 8 bits ele mostrava faixas. Por isso PNG de 16 bits
// na entrada, 10 bits (yuv420p10le) na saída e crf 18, escolhido comparando os
// quadros decodificados com os PNGs. Sobram blocos de 1 nível no degradê, só
// visíveis com contraste ampliado: vêm da quantização do AV1 e não somem com
// crf menor, dither ou 16 bits. Mesmo assim o conjunto fica muito abaixo do
// orçamento (3 MB / 1,2 MB).
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const SETS = ["desktop", "celular"];
const crfArg = process.argv.indexOf("--crf");
const CRF = crfArg > -1 ? Number(process.argv[crfArg + 1]) : 18;
const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";
// Quantos quadros cada conjunto tem: o SETS do render.py, a mesma fonte do render.
const RENDER_PY = readFileSync(path.join(import.meta.dirname, "render.py"), "utf8");
function ffmpeg(args) {
  execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
}

// O PNG de 16 bits (rgb48be) vai direto para yuv420p10le. A matriz de cor fica
// a padrão do ffmpeg: converte em BT.601 e declara "unspecified" (primárias
// BT.709, curva sRGB e faixa limitada vêm do PNG). Declarar bt709 foi testado
// na correção R1 e deixou o azul saturado 6–7 níveis mais escuro no Edge 154,
// então não mude sem conferir no navegador.
function avif(input, output, crf) {
  ffmpeg(["-i", input, "-c:v", "libaom-av1", "-still-picture", "1", "-crf", String(crf), "-b:v", "0", "-cpu-used", "6", "-pix_fmt", "yuv420p10le", output]);
}

function expectedFrames(set) {
  const match = RENDER_PY.match(new RegExp(`"${set}":\\s*\\(\\s*\\d+,\\s*\\d+,\\s*(\\d+)\\s*\\)`));
  if (!match) throw new Error(`Não achei o conjunto "${set}" no SETS do render.py.`);
  return Number(match[1]);
}

// Confere todas as origens antes de escrever qualquer coisa em public/.
const sources = SETS.map((set) => {
  const source = path.join(ROOT, ".hero-render", set);
  const message = `Nenhum PNG em ${source}. Rode o render.py antes (com a pasta vazia).`;
  if (!existsSync(source)) throw new Error(message);
  const pngs = readdirSync(source).filter((name) => /^f\d{3}\.png$/.test(name)).sort();
  if (pngs.length === 0) throw new Error(message);
  const frames = expectedFrames(set);
  const expected = Array.from({ length: frames }, (_, index) => `f${String(index).padStart(3, "0")}.png`);
  if (pngs.join() !== expected.join()) {
    const list = (names) => (names.length > 5 ? `${names.slice(0, 5).join(", ")} e mais ${names.length - 5}` : names.join(", ") || "nenhum");
    const missing = expected.filter((name) => !pngs.includes(name));
    const extra = pngs.filter((name) => !expected.includes(name));
    throw new Error(
      `${source}: esperava f000..f${String(frames - 1).padStart(3, "0")}.png (${frames} quadros, SETS do render.py), ` +
        `achei ${pngs.length}. Faltam: ${list(missing)}. Sobram: ${list(extra)}. Esvazie a pasta e renderize de novo.`,
    );
  }
  return { set, source, pngs };
});

for (const { set, source, pngs } of sources) {
  const target = path.join(ROOT, "public", "hero", "sequencia", set);
  mkdirSync(target, { recursive: true });
  // Tira os quadros antigos: se a quantidade diminuiu, nenhum AVIF velho fica.
  for (const name of readdirSync(target)) {
    if (/^f\d{3}\.avif$/.test(name)) rmSync(path.join(target, name));
  }

  let total = 0;
  for (const png of pngs) {
    const out = path.join(target, png.replace(".png", ".avif"));
    avif(path.join(source, png), out, CRF);
    total += statSync(out).size;
  }
  // Pôster AVIF = cópia exata do f000.avif: troca pelo canvas sem salto. Quem
  // não lê AVIF recebe o poster.jpg, em qualidade alta (q 2).
  copyFileSync(path.join(target, "f000.avif"), path.join(target, "poster.avif"));
  ffmpeg(["-i", path.join(source, pngs[0]), "-q:v", "2", path.join(target, "poster.jpg")]);

  console.log(`${set}: ${pngs.length} quadros, ${(total / 1_000_000).toFixed(2)} MB (crf ${CRF})`);
}
