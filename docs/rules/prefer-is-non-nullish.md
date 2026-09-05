# `prefer-is-non-nullish`

Prefers the is-kit `isNotNil` type guard over an inline nullish-removal
predicate passed directly to `Array.prototype.filter`.

The rule name describes the nullish concept; the corresponding is-kit API is
named `isNotNil`.

Examples of **incorrect** code:

```ts
values.filter((value) => value != null);
values.filter((value) => value !== null && value !== undefined);
```

Example of **correct** code:

```ts
import { isNotNil } from "is-kit";

values.filter(isNotNil);
```

The rule only inspects inline arrow predicates in the built-in array `filter`
position. It does not report equivalent checks in `if` statements or other
control flow, custom `filter` methods, block-bodied functions, or arrays whose
element type does not contain `null` or `undefined`.

This rule requires type information. It is opt-in and has no autofix because
adding or modifying imports is outside its initial scope.
