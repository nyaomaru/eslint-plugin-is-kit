import { ESLintUtils } from "@typescript-eslint/utils";
import type ts from "typescript";

import { getArrayFilterCall } from "../utils/array-filter.js";
import { createRule } from "../utils/create-rule.js";
import { getIsKitImports, type IsKitPredicateName } from "../utils/is-kit-imports.js";
import {
  containsNullishType,
  containsUncertainType,
  isNeverType,
} from "../utils/type-properties.js";

type MessageIds = "redundantPredicate";

const acceptedTypeDescriptions: Readonly<Record<IsKitPredicateName, string>> = {
  isString: "a string",
  isNumberPrimitive: "a number primitive",
  isBoolean: "a boolean",
  isBigInt: "a bigint",
  isSymbol: "a symbol",
  isUndefined: "undefined",
  isNull: "null",
  isNotNil: "non-nullish",
};

export const noRedundantPredicate = createRule<[], MessageIds>({
  name: "no-redundant-predicate",
  meta: {
    type: "suggestion",
    docs: {
      description: "Flag is-kit filter predicates that accept every array element.",
      recommended: true,
      requiresTypeChecking: true,
    },
    hasSuggestions: false,
    schema: [],
    messages: {
      redundantPredicate:
        "{{predicate}} is redundant because every array element is already {{acceptedType}}.",
    },
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();
    const imports = getIsKitImports(context.sourceCode.ast, services);

    return {
      CallExpression(node): void {
        const filterCall = getArrayFilterCall(node, services, checker);
        if (filterCall == null) {
          return;
        }

        const predicate = imports.getPredicateName(filterCall.predicate);
        if (predicate == null || !isRedundant(filterCall.elementType, predicate)) {
          return;
        }

        context.report({
          node: filterCall.predicate,
          messageId: "redundantPredicate",
          data: {
            predicate,
            acceptedType: acceptedTypeDescriptions[predicate],
          },
        });
      },
    };

    function isRedundant(elementType: ts.Type, predicate: IsKitPredicateName): boolean {
      if (isNeverType(elementType) || containsUncertainType(elementType)) {
        return false;
      }

      if (predicate === "isNotNil") {
        return !containsNullishType(elementType);
      }

      return checker.isTypeAssignableTo(elementType, getPredicateTargetType(checker, predicate));
    }
  },
});

function getPredicateTargetType(
  checker: ts.TypeChecker,
  predicate: Exclude<IsKitPredicateName, "isNotNil">,
): ts.Type {
  switch (predicate) {
    case "isString":
      return checker.getStringType();
    case "isNumberPrimitive":
      return checker.getNumberType();
    case "isBoolean":
      return checker.getBooleanType();
    case "isBigInt":
      return checker.getBigIntType();
    case "isSymbol":
      return checker.getESSymbolType();
    case "isUndefined":
      return checker.getUndefinedType();
    case "isNull":
      return checker.getNullType();
  }
}
