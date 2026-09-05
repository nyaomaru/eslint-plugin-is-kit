import {
  AST_NODE_TYPES,
  type ParserServicesWithTypeInformation,
  type TSESTree,
} from "@typescript-eslint/utils";
import type ts from "typescript";

export type IsKitPredicateName =
  | "isString"
  | "isNumberPrimitive"
  | "isBoolean"
  | "isBigInt"
  | "isSymbol"
  | "isUndefined"
  | "isNull"
  | "isNotNil";

const supportedPredicates = new Set<IsKitPredicateName>([
  "isString",
  "isNumberPrimitive",
  "isBoolean",
  "isBigInt",
  "isSymbol",
  "isUndefined",
  "isNull",
  "isNotNil",
]);

export interface IsKitImports {
  getPredicateName(
    node: TSESTree.CallExpression["arguments"][number],
  ): IsKitPredicateName | undefined;
}

export function getIsKitImports(
  program: TSESTree.Program,
  services: ParserServicesWithTypeInformation,
): IsKitImports {
  const namedImports = new Map<ts.Symbol, IsKitPredicateName>();
  const namespaceImports = new Set<ts.Symbol>();

  for (const statement of program.body) {
    if (
      statement.type !== AST_NODE_TYPES.ImportDeclaration ||
      statement.source.value !== "is-kit" ||
      statement.importKind === "type"
    ) {
      continue;
    }

    for (const specifier of statement.specifiers) {
      const localSymbol = services.getSymbolAtLocation(specifier.local);
      if (localSymbol == null) {
        continue;
      }

      if (specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
        namespaceImports.add(localSymbol);
        continue;
      }

      if (specifier.type !== AST_NODE_TYPES.ImportSpecifier || specifier.importKind === "type") {
        continue;
      }

      const importedName =
        specifier.imported.type === AST_NODE_TYPES.Identifier
          ? specifier.imported.name
          : specifier.imported.value;
      if (isSupportedPredicate(importedName)) {
        namedImports.set(localSymbol, importedName);
      }
    }
  }

  return {
    getPredicateName(node) {
      if (node.type === AST_NODE_TYPES.Identifier) {
        const symbol = services.getSymbolAtLocation(node);
        return symbol == null ? undefined : namedImports.get(symbol);
      }

      if (
        node.type !== AST_NODE_TYPES.MemberExpression ||
        node.computed ||
        node.object.type !== AST_NODE_TYPES.Identifier ||
        node.property.type !== AST_NODE_TYPES.Identifier ||
        !isSupportedPredicate(node.property.name)
      ) {
        return undefined;
      }

      const namespaceSymbol = services.getSymbolAtLocation(node.object);
      return namespaceSymbol != null && namespaceImports.has(namespaceSymbol)
        ? node.property.name
        : undefined;
    },
  };
}

function isSupportedPredicate(value: string): value is IsKitPredicateName {
  return supportedPredicates.has(value as IsKitPredicateName);
}
