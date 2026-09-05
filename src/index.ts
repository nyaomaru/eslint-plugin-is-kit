import type { TSESLint } from "@typescript-eslint/utils";

import { noAmbiguousFilterBoolean } from "./rules/no-ambiguous-filter-boolean.js";
import { noRedundantPredicate } from "./rules/no-redundant-predicate.js";
import { preferIsNonNullish } from "./rules/prefer-is-non-nullish.js";
import { preferTypeGuard } from "./rules/prefer-type-guard.js";

export interface IsKitPlugin extends TSESLint.FlatConfig.Plugin {
  configs: {
    recommended: TSESLint.FlatConfig.Config;
    stylistic: TSESLint.FlatConfig.Config;
    strict: TSESLint.FlatConfig.Config;
  };
  rules: NonNullable<TSESLint.FlatConfig.Plugin["rules"]>;
}

const plugin = {
  meta: {
    name: "eslint-plugin-is-kit",
    version: "0.1.0",
  },
  rules: {
    "no-ambiguous-filter-boolean": noAmbiguousFilterBoolean,
    "no-redundant-predicate": noRedundantPredicate,
    "prefer-is-non-nullish": preferIsNonNullish,
    "prefer-type-guard": preferTypeGuard,
  },
  configs: {},
} as unknown as IsKitPlugin;

Object.assign(plugin.configs, {
  recommended: {
    name: "is-kit/recommended",
    plugins: { "is-kit": plugin },
    rules: {
      "is-kit/no-ambiguous-filter-boolean": "error",
      "is-kit/no-redundant-predicate": "error",
    },
  },
  stylistic: {
    name: "is-kit/stylistic",
    plugins: { "is-kit": plugin },
    rules: {
      "is-kit/prefer-is-non-nullish": "error",
      "is-kit/prefer-type-guard": "error",
    },
  },
  strict: {
    name: "is-kit/strict",
    plugins: { "is-kit": plugin },
    rules: {
      "is-kit/no-ambiguous-filter-boolean": "error",
      "is-kit/no-redundant-predicate": "error",
      "is-kit/prefer-is-non-nullish": "error",
      "is-kit/prefer-type-guard": "error",
    },
  },
} satisfies TSESLint.FlatConfig.SharedConfigs);

export default plugin;
export { noAmbiguousFilterBoolean, noRedundantPredicate, preferIsNonNullish, preferTypeGuard };
