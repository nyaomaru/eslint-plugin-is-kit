# eslint-plugin-is-kit

`eslint-plugin-is-kit` identifies ambiguous, redundant, or weakly typed
predicates and suggests is-kit predicates only when they improve intent or type
narrowing.

The plugin is separate from the zero-dependency `is-kit` runtime package and
does not depend on it.

## Design principles

Rules intervene only when at least one of these is true:

1. A predicate's intent is ambiguous, such as nullish removal written as
   `filter(Boolean)` when other falsy values can also be removed.
2. A reusable type guard communicates useful narrowing better than an inline
   predicate.
3. An is-kit predicate makes a first-class predicate meaningfully clearer.

The plugin does not replace ordinary native checks in control flow. For
example, `if (typeof value === "string")` and `Array.isArray(value)` are left
alone.

## Rules

### Correctness

| Rule                                                                       | Description                                                                       | Recommended |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------- |
| [`no-ambiguous-filter-boolean`](docs/rules/no-ambiguous-filter-boolean.md) | Flags nullish-looking `filter(Boolean)` calls that may remove other falsy values. | Yes         |
| [`no-redundant-predicate`](docs/rules/no-redundant-predicate.md)           | Flags is-kit filter predicates that already accept every element.                 | Yes         |

### Explicit predicate style

| Rule                                                                 | Description                                                            | Recommended |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------- |
| [`prefer-is-non-nullish`](docs/rules/prefer-is-non-nullish.md)       | Prefers `isNotNil` over inline nullish-removal filter predicates.      | No          |
| [`prefer-type-guard-filter`](docs/rules/prefer-type-guard-filter.md) | Prefers reusable is-kit guards over inline `typeof` filter predicates. | No          |

All rules require TypeScript type information and intentionally provide no
autofix or editor suggestion.

## Installation

```sh
pnpm add -D eslint-plugin-is-kit eslint typescript@^6.0.3 typescript-eslint@^8.69.0
```

Install `is-kit` when adopting the predicates suggested by opt-in rules:

```sh
pnpm add is-kit
```

## Configuration

Typed linting must be enabled. The `recommended` preset contains correctness
rules only:

```js
import isKit from "eslint-plugin-is-kit";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["**/*.ts"],
    ...isKit.configs.recommended,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
      },
    },
  },
];
```

Available presets:

- `isKit.configs.recommended`: correctness rules
- `isKit.configs.stylistic`: opt-in preference rules
- `isKit.configs.strict`: all rules

Rules can also be configured individually:

```js
{
  plugins: { "is-kit": isKit },
  rules: {
    "is-kit/prefer-is-non-nullish": "warn",
  },
}
```
