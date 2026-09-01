import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import { noAmbiguousFilterBoolean } from "../../src/rules/no-ambiguous-filter-boolean.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.ts"],
      },
      tsconfigRootDir: import.meta.dirname,
    },
  },
});

ruleTester.run("no-ambiguous-filter-boolean", noAmbiguousFilterBoolean, {
  valid: [
    `
      interface User {
        id: string;
      }
      declare const users: Array<User | null | undefined>;
      users.filter(Boolean);
    `,
    `
      interface User {
        id: string;
      }
      declare const users: Array<User | null | undefined> | undefined;
      users?.filter(Boolean);
    `,
    `
      ([1, 2, 3] as const).filter(Boolean);
    `,
    `
      (["a", "b"] as const).filter(Boolean);
    `,
    `
      const values: Array<object | null | undefined> = [];
      values.filter(Boolean);
    `,
    `
      const values: Array<'a' | 'b' | null> = [];
      values.filter(Boolean);
    `,
    `
      const values: Array<1 | 2 | undefined> = [];
      values.filter(Boolean);
    `,
    `
      const values: Array<string | null> = [];
      values.filter(value => Boolean(value));
    `,
    `
      const values: Array<string | null> = [];
      const isTruthy = Boolean;
      values.filter(isTruthy);
    `,
    `
      const values: Array<string | null> = [];
      const Boolean = (_value: unknown) => true;
      values.filter(Boolean);
    `,
    `
      export {};
      const values: Array<string | null> = [];
      const Boolean = (_value: unknown) => true;
      values.filter(Boolean);
    `,
    `
      const values: Array<string | null> = [];
      function filterValues() {
        const Boolean = (_value: unknown) => true;
        return values.filter(Boolean);
      }
    `,
    `
      const values: Array<string | null> = [];
      values.filter?.(Boolean);
    `,
    `
      const values: Array<string | null> = [];
      values['filter'](Boolean);
    `,
    `
      const something = {
        customFilter(_predicate: BooleanConstructor) {},
      };
      something.customFilter(Boolean);
    `,
    `
      const something: {
        filter(predicate: BooleanConstructor): void;
        [index: number]: string | null;
      } = {} as never;
      something.filter(Boolean);
    `,
    `
      const values: any[] = [];
      values.filter(Boolean);
    `,
    `
      const values: unknown[] = [];
      values.filter(Boolean);
    `,
    `
      function filterValues<T>(values: T[]) {
        return values.filter(Boolean);
      }
    `,
    `
      function filterValues<T extends string>(values: T[]) {
        return values.filter(Boolean);
      }
    `,
    `
      const x: Array<1 | 2 | null> = [];
      x.filter(Boolean);
    `,
  ],
  invalid: [
    {
      code: `
        const values: Array<string | null> = [];
        values.filter(Boolean);
      `,
      output: null,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: 'empty string ("")' },
        },
      ],
    },
    {
      code: `
        const values: Array<number | undefined> = [];
        values.filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: "0, NaN" },
        },
      ],
    },
    {
      code: `
        const values: Array<false | object | null> = [];
        values.filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: "false" },
        },
      ],
    },
    {
      code: `
        const values: Array<0n | 1n | undefined> = [];
        values.filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: "0n" },
        },
      ],
    },
    {
      code: `
        const values: Array<'' | 'hello' | null> = [];
        values.filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: 'empty string ("")' },
        },
      ],
    },
    {
      code: `
        const values: Array<number | false | undefined> = [];
        values.filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: "0, NaN, false" },
        },
      ],
    },
    {
      code: `
        const values = [0, 1, null] as const;
        values.filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: "0" },
        },
      ],
    },
    {
      code: `
        const values: Array<boolean | undefined> = [];
        values.filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: "false" },
        },
      ],
    },
    {
      code: `
        const values: Array<bigint | null> = [];
        values.filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: "0n" },
        },
      ],
    },
    {
      code: `
        [1, 2, 3].filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: "0, NaN" },
        },
      ],
    },
    {
      code: `
        ["a", "b"].filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: 'empty string ("")' },
        },
      ],
    },
    {
      code: `
        declare const numbers: number[];
        numbers.filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: "0, NaN" },
        },
      ],
    },
    {
      code: `
        declare const strings: string[];
        strings.filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: 'empty string ("")' },
        },
      ],
    },
    {
      code: `
        declare const booleans: boolean[];
        booleans.filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: "false" },
        },
      ],
    },
    {
      code: `
        declare const bigints: bigint[];
        bigints.filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: "0n" },
        },
      ],
    },
    {
      code: `
        declare const mixed: Array<string | number | boolean | bigint | null>;
        mixed.filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: 'empty string (""), 0, NaN, false, 0n' },
        },
      ],
    },
    {
      code: `
        declare const values: Array<string | null> | undefined;
        values?.filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: 'empty string ("")' },
        },
      ],
    },
    {
      code: `
        const y: Array<0 | 1 | null> = [];
        y.filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: "0" },
        },
      ],
    },
    {
      code: `
        const z: Array<"" | "foo" | undefined> = [];
        z.filter(Boolean);
      `,
      errors: [
        {
          messageId: "ambiguousFilterBoolean",
          data: { values: 'empty string ("")' },
        },
      ],
    },
  ],
});
