import { AST_NODE_TYPES, ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

import { getArrayFilterCall, isUnshadowedIdentifier } from "../utils/array-filter.js";
import { createRule } from "../utils/create-rule.js";
import { containsNullishType } from "../utils/type-properties.js";

type MessageIds = "preferIsNotNil";

export const preferIsNonNullish = createRule<[], MessageIds>({
  name: "prefer-is-non-nullish",
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer isNotNil for inline nullish-removal filter predicates.",
      recommended: false,
      requiresTypeChecking: true,
    },
    hasSuggestions: false,
    schema: [],
    messages: {
      preferIsNotNil:
        "Use isNotNil instead of an inline nullish check to make the filter predicate reusable and explicit.",
    },
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    return {
      CallExpression(node): void {
        const filterCall = getArrayFilterCall(node, services, checker);
        if (
          filterCall?.predicate.type !== AST_NODE_TYPES.ArrowFunctionExpression ||
          !containsNullishType(filterCall.elementType) ||
          !isNullishRemovalPredicate(filterCall.predicate)
        ) {
          return;
        }

        context.report({
          node: filterCall.predicate,
          messageId: "preferIsNotNil",
        });
      },
    };

    function isNullishRemovalPredicate(node: TSESTree.ArrowFunctionExpression): boolean {
      if (
        node.async ||
        node.params.length !== 1 ||
        node.params[0]?.type !== AST_NODE_TYPES.Identifier ||
        node.body.type === AST_NODE_TYPES.BlockStatement
      ) {
        return false;
      }

      const parameter = node.params[0];
      if (isLooseNonNullCheck(node.body, parameter.name)) {
        return true;
      }

      if (node.body.type !== AST_NODE_TYPES.LogicalExpression || node.body.operator !== "&&") {
        return false;
      }

      const checks = [node.body.left, node.body.right];
      return (
        checks.some((check) => isStrictNonNullCheck(check, parameter.name)) &&
        checks.some((check) => isStrictDefinedCheck(check, parameter.name))
      );
    }

    function isLooseNonNullCheck(node: TSESTree.Expression, parameterName: string): boolean {
      return (
        node.type === AST_NODE_TYPES.BinaryExpression &&
        node.operator === "!=" &&
        isIdentifierAndNull(node.left, node.right, parameterName)
      );
    }

    function isStrictNonNullCheck(node: TSESTree.Expression, parameterName: string): boolean {
      return (
        node.type === AST_NODE_TYPES.BinaryExpression &&
        node.operator === "!==" &&
        isIdentifierAndNull(node.left, node.right, parameterName)
      );
    }

    function isStrictDefinedCheck(node: TSESTree.Expression, parameterName: string): boolean {
      if (node.type !== AST_NODE_TYPES.BinaryExpression || node.operator !== "!==") {
        return false;
      }

      const [identifier, undefinedNode] =
        node.left.type === AST_NODE_TYPES.Identifier && node.left.name === parameterName
          ? [node.left, node.right]
          : node.right.type === AST_NODE_TYPES.Identifier && node.right.name === parameterName
            ? [node.right, node.left]
            : [];

      return (
        identifier != null &&
        undefinedNode?.type === AST_NODE_TYPES.Identifier &&
        isUnshadowedIdentifier(context.sourceCode, undefinedNode, "undefined")
      );
    }
  },
});

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

function isNamedIdentifier(
  node: TSESTree.Expression | TSESTree.PrivateIdentifier,
  name: string,
): node is TSESTree.Identifier {
  return node.type === AST_NODE_TYPES.Identifier && node.name === name;
}

function isNullLiteral(node: TSESTree.Expression | TSESTree.PrivateIdentifier): boolean {
  return node.type === AST_NODE_TYPES.Literal && node.value === null;
}
