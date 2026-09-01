import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { getArrayFilterCall, isGlobalIdentifier } from "../utils/array-filter.js";
import { type FalsyKind, getPossibleFalsyValues } from "../utils/get-possible-falsy-values.js";
import { containsNullishType } from "../utils/type-properties.js";

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
      recommended: true,
      requiresTypeChecking: true,
    },
    hasSuggestions: false,
    schema: [],
    messages: {
      ambiguousFilterBoolean:
        "filter(Boolean) may remove non-nullish values from this array: {{values}}. If you only intend to remove null or undefined, use isNotNil.",
    },
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    return {
      CallExpression(node): void {
        const filterCall = getArrayFilterCall(node, services, checker);
        const booleanArgument = filterCall?.predicate;
        if (
          filterCall == null ||
          node.arguments.length !== 1 ||
          booleanArgument?.type !== AST_NODE_TYPES.Identifier ||
          !isGlobalIdentifier(context.sourceCode, services, booleanArgument, "Boolean")
        ) {
          return;
        }

        if (!containsNullishType(filterCall.elementType)) {
          return;
        }

        const falsyValues = getPossibleFalsyValues(filterCall.elementType);
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
  },
});
