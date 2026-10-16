import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // scripts/hero-expansao: a produção da mídia do hero (renderizador Canvas2D
    // que roda no navegador e sondas CommonJS do Node), fora do app.
    ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts", "scripts/hero-expansao/**"],
  },
];

export default eslintConfig;
