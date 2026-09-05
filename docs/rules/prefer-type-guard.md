# `prefer-type-guard`

Prefers reusable is-kit type guards over inline predicates passed directly to
the built-in array methods `filter`, `find`, `some`, and `every` when the
replacement preserves runtime behavior and useful narrowing.

Examples of **incorrect** code:

```ts
values.filter((value) => typeof value === "string");
values.filter((value) => typeof value === "number");
values.find((value) => value === null);
values.some((value) => value === undefined);
values.every((value) => Array.isArray(value));
```

Examples of **correct** code:

```ts
import { isArray, isNull, isNumberPrimitive, isString, isUndefined } from "is-kit";

values.filter(isString);
values.filter(isNumberPrimitive);
values.find(isNull);
values.some(isUndefined);
values.every(isArray);

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
| `value === null`               | `isNull`            |
| `value === undefined`          | `isUndefined`       |
| `Array.isArray(value)`         | `isArray`           |

`isNumber` is deliberately not suggested for `typeof value === "number"`:
`isNumber` rejects `NaN` and positive or negative infinity, so that replacement
would change runtime behavior.

For `filter`, `find`, and `every`, the rule verifies that the is-kit guard's
target type remains assignable to the array element type. This prevents a broad
guard such as `isString` from weakening the inferred result of a literal union.
`some` does not return or establish an element type, so it may also report safe
literal-union replacements when the checked type can occur.

`isArray` narrows to `readonly unknown[]`, unlike the native `Array.isArray`
declaration's `any[]`. For narrowing methods, this initial implementation only
reports `isArray` replacements for `any` or `unknown` element types, where the
safer narrowing is guaranteed to fit. `some` can additionally report unions
with a concrete array member.

The rule does not report control flow, custom methods, block-bodied predicates,
already-narrow element types, loose null equality, shadowed globals, or a
replacement that would weaken useful narrowing. This rule requires type
information, is opt-in, and has no autofix.
