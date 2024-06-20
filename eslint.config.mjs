import eslint from "@eslint/js";
import jestPlugin from "eslint-plugin-jest";
import eslingPluginNoRelativeImportPaths from "eslint-plugin-no-relative-import-paths";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import unicornPlugin from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    plugins: {
      ["@typescript-eslint"]: tseslint.plugin,
      ["no-relative-import-paths"]: eslingPluginNoRelativeImportPaths,
      ["jest"]: jestPlugin,
      ["unicorn"]: unicornPlugin,
    },
  },
  {
    ignores: [
      "**/coverage/",
      "**/node_modules/",
      "*.js",
      ".esbuild/",
      "build/",
      "dist/",
      "eslint.config.mjs",
      "gen/",
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      globals: {
        ...globals.es2020,
        ...globals.node,
      },

      parserOptions: {
        allowAutomaticSingleRunInference: true,
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      "@typescript-eslint/consistent-indexed-object-style": [
        "error",
        "index-signature",
      ],
      "@typescript-eslint/dot-notation": "error",
      // We'll often do things like `foo.status == NOT_FOUND` and we don't want to
      // have to cast `NOT_FOUND` to a number to make this work.
      "@typescript-eslint/no-unsafe-enum-comparison": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/restrict-template-expressions": "off",
      "dot-notation": "off",

      "no-relative-import-paths/no-relative-import-paths": [
        "error",
        { allowSameFolder: true },
      ],

      "unicorn/no-typeof-undefined": "error",
    },
  },
  {
    files: ["pulumi/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["**/*.test.ts"],
    ...jestPlugin.configs["flat/recommended"],
    ...jestPlugin.configs["flat/style"],
    plugins: {
      jest: jestPlugin,
    },
    rules: {
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/unbound-method": "off",
      "jest/unbound-method": "error",
    },
  },
  eslintPluginPrettierRecommended,
);
