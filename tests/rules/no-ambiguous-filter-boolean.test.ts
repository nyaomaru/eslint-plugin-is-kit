import { noAmbiguousFilterBoolean } from "../../src/rules/no-ambiguous-filter-boolean.js";
import { ruleTester } from "../rule-tester.js";

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
    `[1, 2, 3].filter(Boolean);`,
    `["a", "b"].filter(Boolean);`,
    `
      declare const numbers: number[];
      declare const strings: string[];
      declare const booleans: boolean[];
      declare const bigints: bigint[];
      numbers.filter(Boolean);
      strings.filter(Boolean);
      booleans.filter(Boolean);
      bigints.filter(Boolean);
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
        const values: Array<number | void> = [];
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
