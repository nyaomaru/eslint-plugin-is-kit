import ts from "typescript";

export type FalsyKind = "empty-string" | "zero" | "nan" | "false" | "zero-bigint";

const falsyKindOrder: readonly FalsyKind[] = [
  "empty-string",
  "zero",
  "nan",
  "false",
  "zero-bigint",
];

export function getPossibleFalsyValues(type: ts.Type): FalsyKind[] {
  const result = new Set<FalsyKind>();
  collectPossibleFalsyValues(type, result);
  return falsyKindOrder.filter((kind) => result.has(kind));
}

function collectPossibleFalsyValues(type: ts.Type, result: Set<FalsyKind>): void {
  if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.TypeParameter)) {
    return;
  }

  if (type.isUnion()) {
    for (const member of type.types) {
      collectPossibleFalsyValues(member, result);
    }
    return;
  }

  if (type.flags & ts.TypeFlags.String) {
    result.add("empty-string");
    return;
  }

  if (type.flags & ts.TypeFlags.StringLiteral) {
    if ((type as ts.StringLiteralType).value === "") {
      result.add("empty-string");
    }
    return;
  }

  if (type.flags & ts.TypeFlags.Number) {
    result.add("zero");
    result.add("nan");
    return;
  }

  if (type.flags & ts.TypeFlags.NumberLiteral) {
    if ((type as ts.NumberLiteralType).value === 0) {
      result.add("zero");
    }
    return;
  }

  if (type.flags & ts.TypeFlags.BooleanLiteral) {
    if ((type as { intrinsicName?: string }).intrinsicName === "false") {
      result.add("false");
    }
    return;
  }

  if (type.flags & ts.TypeFlags.Boolean) {
    result.add("false");
    return;
  }

  if (type.flags & ts.TypeFlags.BigInt) {
    result.add("zero-bigint");
    return;
  }

  if (type.flags & ts.TypeFlags.BigIntLiteral) {
    const value = (type as ts.BigIntLiteralType).value;
    if (!value.negative && value.base10Value === "0") {
      result.add("zero-bigint");
    }
  }
}
