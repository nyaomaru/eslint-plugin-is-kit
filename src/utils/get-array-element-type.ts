import ts from "typescript";

export function getArrayElementType(checker: ts.TypeChecker, type: ts.Type): ts.Type | undefined {
  return checker.getIndexTypeOfType(type, ts.IndexKind.Number);
}
