import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";
import type ts from "typescript";

import { getArrayElementType } from "./get-array-element-type.js";

export interface ArrayPredicateCall {
  elementType: ts.Type;
  method: ArrayPredicateMethod;
  predicate: TSESTree.CallExpression["arguments"][number];
}

export type ArrayPredicateMethod = "filter" | "find" | "some" | "every";

const arrayPredicateMethods = new Set<ArrayPredicateMethod>(["filter", "find", "some", "every"]);

export function getArrayFilterCall(
  node: TSESTree.CallExpression,
  services: ParserServicesWithTypeInformation,
  checker: ts.TypeChecker,
): ArrayPredicateCall | undefined {
  const call = getArrayPredicateCall(node, services, checker);
  return call?.method === "filter" ? call : undefined;
}

export function getArrayPredicateCall(
  node: TSESTree.CallExpression,
  services: ParserServicesWithTypeInformation,
  checker: ts.TypeChecker,
): ArrayPredicateCall | undefined {
  if (node.optional || node.arguments.length === 0) {
    return undefined;
  }

  const callee = node.callee;
  if (
    callee.type !== AST_NODE_TYPES.MemberExpression ||
    callee.computed ||
    callee.property.type !== AST_NODE_TYPES.Identifier ||
    !isArrayPredicateMethod(callee.property.name) ||
    !isDefaultLibrarySymbol(services, callee.property)
  ) {
    return undefined;
  }

  const receiverType = checker.getNonNullableType(services.getTypeAtLocation(callee.object));
  const elementType = getArrayElementType(checker, receiverType);
  const predicate = node.arguments[0];

  return elementType == null || predicate == null
    ? undefined
    : { elementType, method: callee.property.name, predicate };
}

function isArrayPredicateMethod(value: string): value is ArrayPredicateMethod {
  return arrayPredicateMethods.has(value as ArrayPredicateMethod);
}

export function isDefaultLibrarySymbol(
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Identifier,
): boolean {
  const symbol = services.getSymbolAtLocation(node);
  const declarations = symbol?.getDeclarations();

  return (
    declarations != null &&
    declarations.length > 0 &&
    declarations.every((declaration) =>
      services.program.isSourceFileDefaultLibrary(declaration.getSourceFile()),
    )
  );
}

export function isGlobalIdentifier(
  sourceCode: TSESLint.SourceCode,
  services: ParserServicesWithTypeInformation,
  node: TSESTree.Identifier,
  name: string,
): boolean {
  return isUnshadowedIdentifier(sourceCode, node, name) && isDefaultLibrarySymbol(services, node);
}

export function isUnshadowedIdentifier(
  sourceCode: TSESLint.SourceCode,
  node: TSESTree.Identifier,
  name: string,
): boolean {
  if (node.name !== name) {
    return false;
  }

  // TypeScript may resolve a top-level script redeclaration to the global lib
  // symbol even though ESLint's scope manager can see the local binding.
  let scope: TSESLint.Scope.Scope | null = sourceCode.getScope(node);
  while (scope != null) {
    const variable = scope.variables.find((candidate) => candidate.name === name);
    if (variable != null && variable.defs.length > 0) {
      return false;
    }
    scope = scope.upper;
  }

  return true;
}
