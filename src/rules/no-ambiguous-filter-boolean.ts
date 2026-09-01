import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { getArrayElementType } from "../utils/get-array-element-type.js";
import { type FalsyKind, getPossibleFalsyValues } from "../utils/get-possible-falsy-values.js";

type MessageIds = "ambiguousFilterBoolean";

const falsyKindLabels: Readonly<Record<FalsyKind, string>> = {
  "empty-string": 'empty string ("")',
  zero: "0",
  nan: "NaN",
  false: "false",
  "zero-bigint": "0n",
};

export const noAmbiguousFilterBoolean = createRule<[], MessageIds>({
  name: "no-ambiguous-filter-boolean",
  meta: {
    type: "suggestion",
    docs: {
      description: "Flag filter(Boolean) when the element type includes non-nullish falsy values.",
      recommended: false,
      requiresTypeChecking: true,
    },
    hasSuggestions: false,
    schema: [],
    messages: {
      ambiguousFilterBoolean:
        "filter(Boolean) may remove non-nullish values from this array: {{values}}. If you only intend to remove null or undefined, use an explicit nullish predicate.",
    },
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    return {
      CallExpression(node): void {
        const booleanArgument = getBooleanArgument(node);
        if (
          booleanArgument == null ||
          isShadowedBoolean(booleanArgument) ||
          !isDefaultLibrarySymbol(booleanArgument)
        ) {
          return;
        }

        const callee = node.callee;
        if (
          callee.type !== AST_NODE_TYPES.MemberExpression ||
          callee.computed ||
          callee.optional ||
          callee.property.type !== AST_NODE_TYPES.Identifier ||
          callee.property.name !== "filter" ||
          !isDefaultLibrarySymbol(callee.property)
        ) {
          return;
        }

        const receiverType = services.getTypeAtLocation(callee.object);
        const elementType = getArrayElementType(checker, receiverType);
        if (elementType == null) {
          return;
        }

        const falsyValues = getPossibleFalsyValues(elementType);
        if (falsyValues.length === 0) {
          return;
        }

        context.report({
          node: booleanArgument,
          messageId: "ambiguousFilterBoolean",
          data: {
            values: falsyValues.map((kind) => falsyKindLabels[kind]).join(", "),
          },
        });
      },
    };

    function isDefaultLibrarySymbol(node: TSESTree.Identifier): boolean {
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

    function isShadowedBoolean(node: TSESTree.Identifier): boolean {
      let scope: TSESLint.Scope.Scope | null = context.sourceCode.getScope(node);

      while (scope != null) {
        const variable = scope.variables.find((candidate) => candidate.name === "Boolean");
        if (variable != null && variable.defs.length > 0) {
          return true;
        }
        scope = scope.upper;
      }

      return false;
    }
  },
});

function getBooleanArgument(node: TSESTree.CallExpression): TSESTree.Identifier | undefined {
  if (node.optional || node.arguments.length !== 1) {
    return undefined;
  }

  const argument = node.arguments[0];
  return argument?.type === AST_NODE_TYPES.Identifier && argument.name === "Boolean"
    ? argument
    : undefined;
}
