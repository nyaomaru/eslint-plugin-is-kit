# `prefer-type-guard-filter`

Prefers reusable is-kit type guards over inline `typeof` predicates passed
directly to `Array.prototype.filter` when the replacement preserves narrowing.

Examples of **incorrect** code:

```ts
values.filter((value) => typeof value === "string");
values.filter((value) => typeof value === "number");
```

Examples of **correct** code:

```ts
import { isNumberPrimitive, isString } from "is-kit";

values.filter(isString);
values.filter(isNumberPrimitive);

if (typeof value === "string") {
  // Native control flow is intentionally left alone.
}
```

Supported equivalent replacements:

| Native check                   | is-kit predicate    |
| ------------------------------ | ------------------- |
| `typeof value === "string"`    | `isString`          |
| `typeof value === "number"`    | `isNumberPrimitive` |
| `typeof value === "boolean"`   | `isBoolean`         |
| `typeof value === "bigint"`    | `isBigInt`          |
| `typeof value === "symbol"`    | `isSymbol`          |
| `typeof value === "undefined"` | `isUndefined`       |

`isNumber` is deliberately not suggested for `typeof value === "number"`:
`isNumber` rejects `NaN` and positive or negative infinity, so that replacement
would change runtime behavior.

The rule does not report control flow, custom methods, block-bodied predicates,
already-narrow element types, or a replacement that would widen a literal
union. This rule requires type information, is opt-in, and has no autofix.
