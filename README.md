# eslint-plugin-is-kit

Type-aware ESLint rules for precise TypeScript predicates.

The plugin is separate from the zero-dependency `is-kit` runtime package and
does not depend on it.

## Rules

| Rule                                                                       | Description                                                          | Type-aware | Fixable |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------- | ------- |
| [`no-ambiguous-filter-boolean`](docs/rules/no-ambiguous-filter-boolean.md) | Flags `filter(Boolean)` when it may remove non-nullish falsy values. | Yes        | No      |

The rule is opt-in in v0.1.0. No recommended configuration is exported yet.

## Installation

```sh
pnpm add -D eslint-plugin-is-kit eslint typescript@^6.0.3 typescript-eslint@^8.69.0
```

## Configuration

Typed linting must be enabled. With ESLint flat config:

```js
import isKit from "eslint-plugin-is-kit";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      "is-kit": isKit,
    },
    rules: {
      "is-kit/no-ambiguous-filter-boolean": "warn",
    },
  },
];
```

See the
[`no-ambiguous-filter-boolean` documentation](docs/rules/no-ambiguous-filter-boolean.md)
for behavior and examples.
