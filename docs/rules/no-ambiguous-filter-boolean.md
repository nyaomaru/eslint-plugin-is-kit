# `no-ambiguous-filter-boolean`

Flags `array.filter(Boolean)` when the array's TypeScript element type can
contain falsy values other than `null` or `undefined`.

This rule requires type information. It has no autofix or editor suggestion
because `filter(Boolean)` may intentionally mean “keep only truthy values.”

## Rule details

The rule reports the specific values that `Boolean` may remove:

- `string` or `""`: empty string (`""`)
- `number`: `0` and `NaN`
- `0`: `0`
- `boolean` or `false`: `false`
- `bigint` or `0n`: `0n`

`any`, `unknown`, and type parameters are not reported because their possible
contents are not concrete enough for this rule.

The syntax match is intentionally narrow. It only checks a direct
`array.filter(Boolean)` or `array?.filter(Boolean)` call with the built-in
global `Boolean` as its sole argument. Aliases, arrow functions, computed
access, optional calls such as `array.filter?.(Boolean)`, custom `filter`
methods, and a locally shadowed `Boolean` are ignored.

Examples of **incorrect** code:

```ts
const names: Array<string | null> = [];
names.filter(Boolean); // May also remove "".

const values: Array<number | undefined> = [];
values.filter(Boolean); // May also remove 0 and NaN.

[1, 2, 3].filter(Boolean); // Inferred as number[], so 0 and NaN are possible.
```

Examples of **correct** code:

```ts
const records: Array<{ id: string } | null | undefined> = [];
records.filter(Boolean);

const states: Array<"ready" | "done" | null> = [];
states.filter(Boolean);

([1, 2, 3] as const).filter(Boolean); // Element type is 1 | 2 | 3.
```

If only nullish values should be removed, use an explicit predicate. `isNotNil`
from `is-kit` is one option, but the rule does not require it:

```ts
import { isNotNil } from "is-kit";

values.filter(isNotNil);

// Or without is-kit:
values.filter((value) => value != null);
```

## Configuration

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

Use a TypeScript version within the supported range of the installed
`typescript-eslint` release.
