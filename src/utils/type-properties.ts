import ts from "typescript";

export function containsNullishType(type: ts.Type): boolean {
  return getTypeParts(type).some(
    (part) => part.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void),
  );
}

export function containsUncertainType(type: ts.Type): boolean {
  return getTypeParts(type).some(
    (part) => part.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.TypeParameter),
  );
}

export function containsTypeParameter(type: ts.Type): boolean {
  return getTypeParts(type).some((part) => part.flags & ts.TypeFlags.TypeParameter);
}

export function isNeverType(type: ts.Type): boolean {
  return Boolean(type.flags & ts.TypeFlags.Never);
}

function getTypeParts(type: ts.Type): readonly ts.Type[] {
  return type.isUnion() ? type.types : [type];
}
