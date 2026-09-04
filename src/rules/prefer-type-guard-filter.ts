import { AST_NODE_TYPES, ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import type ts from "typescript";

import {
  type ArrayPredicateMethod,
  getArrayPredicateCall,
  isDefaultLibrarySymbol,
  isGlobalIdentifier,
  isUnshadowedIdentifier,
} from "../utils/array-filter.js";
import { createRule } from "../utils/create-rule.js";
import {
  containsTypeParameter,
  containsUncertainType,
  isNeverType,
} from "../utils/type-properties.js";

type MessageIds = "preferTypeGuard";
type GuardPredicate =
  | "isString"
  | "isNumberPrimitive"
  | "isBoolean"
  | "isBigInt"
  | "isSymbol"
  | "isUndefined"
  | "isNull"
  | "isArray";

const predicatesByTypeof: Readonly<Record<string, GuardPredicate>> = {
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
      description: "Prefer reusable is-kit type guards for inline array predicate callbacks.",
      recommended: false,
      requiresTypeChecking: true,
    },
    hasSuggestions: false,
    schema: [],
    messages: {
      preferTypeGuard:
        "Use {{predicate}} as the {{method}} predicate to make the type guard reusable and explicit.",
    },
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    return {
      CallExpression(node): void {
        const predicateCall = getArrayPredicateCall(node, services, checker);
        if (predicateCall?.predicate.type !== AST_NODE_TYPES.ArrowFunctionExpression) {
          return;
        }

        const predicate = getGuardPredicate(predicateCall.predicate);
        if (
          predicate == null ||
          !replacementImprovesType(predicateCall.elementType, predicate, predicateCall.method)
        ) {
          return;
        }

        context.report({
          node: predicateCall.predicate,
          messageId: "preferTypeGuard",
          data: { method: predicateCall.method, predicate },
        });
      },
    };

    function getGuardPredicate(node: TSESTree.ArrowFunctionExpression): GuardPredicate | undefined {
      if (
        node.async ||
        node.params.length !== 1 ||
        node.params[0]?.type !== AST_NODE_TYPES.Identifier ||
        node.body.type === AST_NODE_TYPES.BlockStatement
      ) {
        return undefined;
      }

      const parameterName = node.params[0].name;
      return (
        getTypeofPredicate(node.body, parameterName) ??
        getEqualityPredicate(node.body, parameterName) ??
        getArrayPredicate(node.body, parameterName)
      );
    }

    function getEqualityPredicate(
      node: TSESTree.Expression,
      parameterName: string,
    ): GuardPredicate | undefined {
      if (node.type !== AST_NODE_TYPES.BinaryExpression || node.operator !== "===") {
        return undefined;
      }

      if (isIdentifierAndNull(node.left, node.right, parameterName)) {
        return "isNull";
      }

      const comparedValue = getComparedValue(node.left, node.right, parameterName);
      return comparedValue?.type === AST_NODE_TYPES.Identifier &&
        isUnshadowedIdentifier(context.sourceCode, comparedValue, "undefined")
        ? "isUndefined"
        : undefined;
    }

    function getArrayPredicate(
      node: TSESTree.Expression,
      parameterName: string,
    ): GuardPredicate | undefined {
      if (
        node.type !== AST_NODE_TYPES.CallExpression ||
        node.optional ||
        node.arguments.length !== 1 ||
        node.arguments[0]?.type !== AST_NODE_TYPES.Identifier ||
        node.arguments[0].name !== parameterName ||
        node.callee.type !== AST_NODE_TYPES.MemberExpression ||
        node.callee.computed ||
        node.callee.object.type !== AST_NODE_TYPES.Identifier ||
        node.callee.property.type !== AST_NODE_TYPES.Identifier ||
        node.callee.property.name !== "isArray" ||
        !isGlobalIdentifier(context.sourceCode, services, node.callee.object, "Array") ||
        !isDefaultLibrarySymbol(services, node.callee.property)
      ) {
        return undefined;
      }

      return "isArray";
    }

    function replacementImprovesType(
      elementType: ts.Type,
      predicate: GuardPredicate,
      method: ArrayPredicateMethod,
    ): boolean {
      if (isNeverType(elementType) || containsTypeParameter(elementType)) {
        return false;
      }

      if (predicate === "isArray") {
        return arrayReplacementImprovesType(elementType, method);
      }

      const targetType = getPredicateTargetType(checker, predicate);
      if (
        !containsUncertainType(elementType) &&
        checker.isTypeAssignableTo(elementType, targetType)
      ) {
        return false;
      }

      if (method !== "some") {
        return checker.isTypeAssignableTo(targetType, elementType);
      }

      return typeCouldContainTarget(elementType, targetType);
    }

    function arrayReplacementImprovesType(
      elementType: ts.Type,
      method: ArrayPredicateMethod,
    ): boolean {
      if (containsUncertainType(elementType)) {
        return true;
      }

      const parts = elementType.isUnion() ? elementType.types : [elementType];
      const arrayParts = parts.filter(
        (part) => checker.isArrayType(part) || checker.isTupleType(part),
      );

      return method === "some" && arrayParts.length > 0 && arrayParts.length < parts.length;
    }

    function typeCouldContainTarget(elementType: ts.Type, targetType: ts.Type): boolean {
      if (containsUncertainType(elementType)) {
        return true;
      }

      const parts = elementType.isUnion() ? elementType.types : [elementType];
      return parts.some(
        (part) =>
          checker.isTypeAssignableTo(part, targetType) ||
          checker.isTypeAssignableTo(targetType, part),
      );
    }
  },
});

function getTypeofPredicate(
  node: TSESTree.Expression,
  parameterName: string,
): GuardPredicate | undefined {
  if (
    node.type !== AST_NODE_TYPES.BinaryExpression ||
    (node.operator !== "===" && node.operator !== "==")
  ) {
    return undefined;
  }

  const typeofValue = getTypeofComparisonValue(node.left, node.right, parameterName);
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

function isIdentifierAndNull(
  left: TSESTree.Expression | TSESTree.PrivateIdentifier,
  right: TSESTree.Expression,
  parameterName: string,
): boolean {
  return (
    (isNamedIdentifier(left, parameterName) && isNullLiteral(right)) ||
    (isNullLiteral(left) && isNamedIdentifier(right, parameterName))
  );
}

function getComparedValue(
  left: TSESTree.Expression | TSESTree.PrivateIdentifier,
  right: TSESTree.Expression,
  parameterName: string,
): TSESTree.Expression | undefined {
  if (isNamedIdentifier(left, parameterName)) {
    return right;
  }
  if (isNamedIdentifier(right, parameterName)) {
    return left.type === AST_NODE_TYPES.PrivateIdentifier ? undefined : left;
  }
  return undefined;
}

function isNamedIdentifier(
  node: TSESTree.Expression | TSESTree.PrivateIdentifier,
  name: string,
): node is TSESTree.Identifier {
  return node.type === AST_NODE_TYPES.Identifier && node.name === name;
}

function isNullLiteral(node: TSESTree.Expression | TSESTree.PrivateIdentifier): boolean {
  return node.type === AST_NODE_TYPES.Literal && node.value === null;
}

function getPredicateTargetType(
  checker: ts.TypeChecker,
  predicate: Exclude<GuardPredicate, "isArray">,
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
