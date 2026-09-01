import { AST_NODE_TYPES, ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import type ts from "typescript";

import { getArrayFilterCall } from "../utils/array-filter.js";
import { createRule } from "../utils/create-rule.js";
import {
  containsTypeParameter,
  containsUncertainType,
  isNeverType,
} from "../utils/type-properties.js";

type MessageIds = "preferTypeGuard";
type PrimitivePredicate =
  | "isString"
  | "isNumberPrimitive"
  | "isBoolean"
  | "isBigInt"
  | "isSymbol"
  | "isUndefined";

const predicatesByTypeof: Readonly<Record<string, PrimitivePredicate>> = {
  string: "isString",
  number: "isNumberPrimitive",
  boolean: "isBoolean",
  bigint: "isBigInt",
  symbol: "isSymbol",
  undefined: "isUndefined",
};

export const preferTypeGuardFilter = createRule<[], MessageIds>({
  name: "prefer-type-guard-filter",
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer reusable is-kit type guards for inline typeof filter predicates.",
      recommended: false,
      requiresTypeChecking: true,
    },
    hasSuggestions: false,
    schema: [],
    messages: {
      preferTypeGuard:
        "Use {{predicate}} as the filter predicate to make the type guard reusable and explicit.",
    },
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    return {
      CallExpression(node): void {
        const filterCall = getArrayFilterCall(node, services, checker);
        if (filterCall?.predicate.type !== AST_NODE_TYPES.ArrowFunctionExpression) {
          return;
        }

        const predicate = getTypeofPredicate(filterCall.predicate);
        if (
          predicate == null ||
          !replacementPreservesNarrowing(filterCall.elementType, predicate)
        ) {
          return;
        }

        context.report({
          node: filterCall.predicate,
          messageId: "preferTypeGuard",
          data: { predicate },
        });
      },
    };

    function replacementPreservesNarrowing(
      elementType: ts.Type,
      predicate: PrimitivePredicate,
    ): boolean {
      if (isNeverType(elementType) || containsTypeParameter(elementType)) {
        return false;
      }

      const targetType = getPredicateTargetType(checker, predicate);
      if (
        !containsUncertainType(elementType) &&
        checker.isTypeAssignableTo(elementType, targetType)
      ) {
        return false;
      }

      return checker.isTypeAssignableTo(targetType, elementType);
    }
  },
});

function getTypeofPredicate(
  node: TSESTree.ArrowFunctionExpression,
): PrimitivePredicate | undefined {
  if (
    node.async ||
    node.params.length !== 1 ||
    node.params[0]?.type !== AST_NODE_TYPES.Identifier ||
    node.body.type !== AST_NODE_TYPES.BinaryExpression ||
    (node.body.operator !== "===" && node.body.operator !== "==")
  ) {
    return undefined;
  }

  const parameterName = node.params[0].name;
  const typeofValue = getTypeofComparisonValue(node.body.left, node.body.right, parameterName);
  return typeofValue == null ? undefined : predicatesByTypeof[typeofValue];
}

function getTypeofComparisonValue(
  left: TSESTree.Expression | TSESTree.PrivateIdentifier,
  right: TSESTree.Expression,
  parameterName: string,
): string | undefined {
  if (isTypeofParameter(left, parameterName) && isStringLiteral(right)) {
    return right.value;
  }
  if (isStringLiteral(left) && isTypeofParameter(right, parameterName)) {
    return left.value;
  }
  return undefined;
}

function isTypeofParameter(
  node: TSESTree.Expression | TSESTree.PrivateIdentifier,
  parameterName: string,
): boolean {
  return (
    node.type === AST_NODE_TYPES.UnaryExpression &&
    node.operator === "typeof" &&
    node.argument.type === AST_NODE_TYPES.Identifier &&
    node.argument.name === parameterName
  );
}

function isStringLiteral(
  node: TSESTree.Expression | TSESTree.PrivateIdentifier,
): node is TSESTree.StringLiteral {
  return node.type === AST_NODE_TYPES.Literal && typeof node.value === "string";
}

function getPredicateTargetType(checker: ts.TypeChecker, predicate: PrimitivePredicate): ts.Type {
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
  }
}
