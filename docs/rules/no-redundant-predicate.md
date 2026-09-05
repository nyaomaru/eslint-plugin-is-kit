# `no-redundant-predicate`

Flags an is-kit predicate passed to `Array.prototype.filter` when every element
is already accepted by that predicate.

Example of **incorrect** code:

```ts
import { isString } from "is-kit";

declare const values: string[];
values.filter(isString);
```

Examples of **correct** code:

```ts
import { isNumber, isString } from "is-kit";

declare const values: unknown[];
values.filter(isString);

declare const numbers: number[];
numbers.filter(isNumber); // Still removes NaN and infinities.
```

The initial rule recognizes direct named or namespace imports of `isString`,
`isNumberPrimitive`, `isBoolean`, `isBigInt`, `isSymbol`, `isUndefined`,
`isNull`, and `isNotNil` from `is-kit`. Aliased named imports are supported.
Local predicates and predicates imported from other packages are ignored.

`any`, `unknown`, `never`, and type parameters are not reported. The rule
requires type information, belongs to the recommended correctness preset, and
has no autofix.
