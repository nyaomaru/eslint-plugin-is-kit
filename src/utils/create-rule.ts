import { ESLintUtils } from "@typescript-eslint/utils";

export interface RuleDocs {
  description: string;
  recommended?: boolean;
  requiresTypeChecking?: boolean;
}

export const createRule = ESLintUtils.RuleCreator<RuleDocs>(
  (name) => `https://github.com/nyaomaru/eslint-plugin-is-kit/blob/main/docs/rules/${name}.md`,
);
