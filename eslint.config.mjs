import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // scripts/hero-expansao, os .js de scripts/hero-notebook e os de
    // scripts/catalogo-arte: a produção da mídia do hero e da arte do catálogo
    // (renderizadores Canvas2D que rodam no navegador e sondas CommonJS do
    // Node), fora do app. O medir-contraste.mjs do catálogo e o teste da cena
    // do notebook (cena.test.ts) continuam no lint.
    ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts", "scripts/hero-expansao/**", "scripts/hero-notebook/**/*.js", "scripts/catalogo-arte/**/*.js"],
  },
];

export default eslintConfig;
