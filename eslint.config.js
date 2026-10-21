import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";
import pluginQuery from "@tanstack/eslint-plugin-query";

const RESTRICTED_MSW = {
  paths: [
    {
      name: "msw",
      message: "MSW so pode ser importado dentro de src/mocks/**.",
    },
  ],
  patterns: [
    {
      group: ["msw/*", "@mswjs/*"],
      message: "MSW so pode ser importado dentro de src/mocks/**.",
    },
  ],
};

const RESTRICTED_AXIOS = {
  paths: [
    {
      name: "axios",
      message: "Axios so pode ser importado dentro de src/lib/http/**.",
    },
  ],
  patterns: [
    {
      group: ["axios/*"],
      message: "Axios so pode ser importado dentro de src/lib/http/**.",
    },
  ],
};

const RESTRICTED_SOCKET = {
  paths: [
    {
      name: "socket.io-client",
      message: "Socket.IO client so pode ser importado dentro de src/lib/realtime/**.",
    },
  ],
  patterns: [
    {
      group: ["socket.io-client/*"],
      message: "Socket.IO client so pode ser importado dentro de src/lib/realtime/**.",
    },
  ],
};

function combineRestrictions(...restrictions) {
  return {
    paths: restrictions.flatMap((r) => r.paths),
    patterns: restrictions.flatMap((r) => r.patterns),
  };
}

export default tseslint.config(
  {
    ignores: [
      "dist",
      "dist-ssr",
      "coverage",
      "test-results",
      "playwright-report",
      "node_modules",
      ".pnpm-store",
      "public",
      "src/routeTree.gen.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  ...pluginQuery.configs["flat/recommended"],
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-restricted-imports": [
        "error",
        combineRestrictions(RESTRICTED_MSW, RESTRICTED_AXIOS, RESTRICTED_SOCKET),
      ],
    },
  },
  // Scripts Node (ex.: scripts/lighthouse-summary.mjs)
  {
    files: ["scripts/**/*.{js,mjs}"],
    languageOptions: { globals: globals.node },
  },
  // Permissão de MSW apenas dentro de src/mocks/**
  {
    files: ["src/mocks/**", "**/src/mocks/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        combineRestrictions(RESTRICTED_AXIOS, RESTRICTED_SOCKET),
      ],
    },
  },
  // Permissão de Axios apenas dentro de src/lib/http/**
  {
    files: ["src/lib/http/**", "**/src/lib/http/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        combineRestrictions(RESTRICTED_MSW, RESTRICTED_SOCKET),
      ],
    },
  },
  // Permissão de Socket.IO apenas dentro de src/lib/realtime/**
  {
    files: ["src/lib/realtime/**", "**/src/lib/realtime/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        combineRestrictions(RESTRICTED_MSW, RESTRICTED_AXIOS),
      ],
    },
  },
  // Permite exportar variantes junto a componentes no shadcn/ui e definicoes de rotas no TanStack Router
  {
    files: [
      "src/components/ui/**",
      "**/src/components/ui/**",
      "src/routes/**",
      "**/src/routes/**",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
