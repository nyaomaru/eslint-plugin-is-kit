# eslint-plugin-is-kit

Type-aware ESLint rules for precise TypeScript predicates.

`eslint-plugin-is-kit` finds array predicates that are ambiguous, redundant,
or weaker than a reusable type guard. It suggests predicates from
[`is-kit`](https://github.com/nyaomaru/is-kit) only when they preserve runtime
behavior and improve intent or type narrowing.

```ts
// Ambiguous: this also removes "", 0, false, and NaN when present.
values.filter(Boolean);

// Explicit: remove only null and undefined.
values.filter(isNotNil);
```

The plugin is separate from the zero-dependency `is-kit` runtime package and
does not depend on it. Install `is-kit` when adopting predicates suggested by
the stylistic rules.

## Installation

Install the plugin alongside ESLint and typed-linting support:

```sh
pnpm add -D eslint-plugin-is-kit eslint typescript@^6.0.3 typescript-eslint@^8.69.0
```

Equivalent `npm`, `yarn`, and `bun` commands work as well.

If you enable the stylistic rules or use the suggested replacements, install
`is-kit` as a runtime dependency:

```sh
pnpm add is-kit
```

## Configuration

All rules require TypeScript type information. Enable typed linting and start
with the correctness-focused `recommended` preset:

```js
// eslint.config.js
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

Use `strict` to enable every rule:

```js
export default [
  {
    files: ["**/*.ts"],
    ...isKit.configs.strict,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
      },
    },
  },
];
```

### Presets

| Preset                      | Purpose                                         |
| --------------------------- | ----------------------------------------------- |
| `isKit.configs.recommended` | Correctness rules suitable as a starting point. |
| `isKit.configs.stylistic`   | Opt-in preferences for reusable is-kit guards.  |
| `isKit.configs.strict`      | Every correctness and stylistic rule.           |

### Individual rules

Rules can also be configured individually:

```js
{
  plugins: { "is-kit": isKit },
  rules: {
    "is-kit/prefer-is-non-nullish": "warn",
  },
}
```

### CommonJS

The package includes a CommonJS build. Its default export is available through
the generated module namespace:

```js
// eslint.config.cjs
const { default: isKit } = require("eslint-plugin-is-kit");
```

## Rules

| Rule                                                                                                                                  | What it reports                                                            | Recommended |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------- |
| [`no-ambiguous-filter-boolean`](https://github.com/nyaomaru/eslint-plugin-is-kit/blob/main/docs/rules/no-ambiguous-filter-boolean.md) | `filter(Boolean)` when nullish and other falsy values can both be removed. | Yes         |
| [`no-redundant-predicate`](https://github.com/nyaomaru/eslint-plugin-is-kit/blob/main/docs/rules/no-redundant-predicate.md)           | An is-kit filter predicate that already accepts every array element.       | Yes         |
| [`prefer-is-non-nullish`](https://github.com/nyaomaru/eslint-plugin-is-kit/blob/main/docs/rules/prefer-is-non-nullish.md)             | Inline nullish-removal filters that can use `isNotNil`.                    | No          |
| [`prefer-type-guard`](https://github.com/nyaomaru/eslint-plugin-is-kit/blob/main/docs/rules/prefer-type-guard.md)                     | Equivalent inline checks in `filter`, `find`, `findLast`, and `every`.     | No          |

The rules are deliberately conservative. They inspect built-in array methods,
use TypeScript's type information, and skip cases where a replacement could
change runtime behavior or weaken useful narrowing. They do not replace native
checks in ordinary control flow.

No rule currently provides an autofix. Adding or changing imports is an
intentional user decision, and `filter(Boolean)` can sometimes mean “keep only
truthy values.”

## Compatibility

| Dependency                  | Supported versions                |
| --------------------------- | --------------------------------- |
| Node.js                     | `^22.13.0` or `>=24.0.0`          |
| ESLint                      | `^8.57.0`, `^9.0.0`, or `^10.0.0` |
| TypeScript                  | `>=5.7.0 <6.1.0`                  |
| `@typescript-eslint/parser` | `^8.69.0`                         |

The package ships ESM and CommonJS builds with declarations for both entry
points.

## Development

```sh
pnpm install
pnpm check
pnpm smoke
```

`pnpm smoke` packs the package, installs the tarball in an isolated consumer
project, and verifies its imports, declarations, and ESLint behavior.

## License

[MIT](LICENSE)
