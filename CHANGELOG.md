## [v0.1.0] - 2026-09-06

### Added

- add type-aware ESLint plugin for is-kit by @nyaomaru in [#1](https://github.com/nyaomaru/eslint-plugin-is-kit/pull/1)

### Chore

- prepare initial npm release by @nyaomaru in [#2](https://github.com/nyaomaru/eslint-plugin-is-kit/pull/2)
- add changelog-bot release workflow by @nyaomaru in [#3](https://github.com/nyaomaru/eslint-plugin-is-kit/pull/3)

### eslint-plugin-is-kit 🚀

The first release of `eslint-plugin-is-kit`, a type-aware ESLint plugin for writing precise TypeScript predicates.

It detects array predicates that are ambiguous, redundant, or less expressive than reusable guards from [`is-kit`](https://github.com/nyaomaru/is-kit). Rules are deliberately conservative: suggestions are reported only when they preserve runtime behavior and useful
type narrowing.

#### Highlights

- Detects potentially unsafe `filter(Boolean)` usage.
- Detects redundant is-kit predicates.
- Encourages `isNotNil` for eligible nullish-removal filters.
- Suggests reusable type guards for equivalent inline checks in array methods.
- Provides `recommended`, `stylistic`, and `strict` flat-config presets.
- Ships ESM, CommonJS, and TypeScript declarations.

#### Get started

```sh
pnpm add -D eslint-plugin-is-kit eslint typescript typescript-eslint
```

```ts
import isKit from "eslint-plugin-is-kit";

export default [
  {
    files: ["**/*.ts"],
    ...isKit.configs.recommended,
  },
];
```

See the [README](https://github.com/nyaomaru/eslint-plugin-is-kit/blob/main/README.md) for configuration, rule details, and compatibility information.

### New Contributors

* @nyaomaru made their first contribution in https://github.com/nyaomaru/eslint-plugin-is-kit/pull/1

**Full Changelog**: https://github.com/nyaomaru/eslint-plugin-is-kit/commits/v0.1.0

[v0.1.0]: https://github.com/nyaomaru/eslint-plugin-is-kit/compare/aae4d9b0f559bb5e980d5feb2c22e1bd08754ed0...v0.1.0

