import { preferIsNonNullish } from "../../src/rules/prefer-is-non-nullish.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("prefer-is-non-nullish", preferIsNonNullish, {
  valid: [
    `
      declare const value: string | null;
      if (value != null) value.toUpperCase();
    `,
    `
      declare const values: Array<string | null>;
      values.map(value => value != null);
    `,
    `
      declare const values: string[];
      values.filter(value => value != null);
    `,
    `
      declare const values: Array<string | null | undefined>;
      values.filter(value => value !== null);
    `,
    `
      declare const values: Array<string | null>;
      values.filter(value => {
        return value != null;
      });
    `,
    `
      declare const values: Array<string | null>;
      values.filter(function (value) {
        return value != null;
      });
    `,
    `
      const custom: {
        filter(predicate: (value: string | null) => boolean): void;
        [index: number]: string | null;
      } = {} as never;
      custom.filter(value => value != null);
    `,
    `
      declare const values: Array<string | null>;
      values.find(value => value != null);
    `,
    `
      export {};
      const undefined = "not the global value";
      declare const values: Array<string | null>;
      values.filter(value => value !== null && value !== undefined);
    `,
  ],
  invalid: [
    {
      code: `
        declare const values: Array<string | null | undefined>;
        values.filter(value => value != null);
      `,
      output: null,
      errors: [{ messageId: "preferIsNotNil" }],
    },
    {
      code: `
        declare const values: Array<string | null>;
        values.filter(value => null != value);
      `,
      errors: [{ messageId: "preferIsNotNil" }],
    },
    {
      code: `
        declare const values: Array<string | null | undefined>;
        values.filter(value => value !== null && value !== undefined);
      `,
      errors: [{ messageId: "preferIsNotNil" }],
    },
    {
      code: `
        declare const values: Array<string | null | undefined>;
        values.filter(value => undefined !== value && null !== value);
      `,
      errors: [{ messageId: "preferIsNotNil" }],
    },
    {
      code: `
        declare const values: Array<string | null> | undefined;
        values?.filter(value => value != null);
      `,
      errors: [{ messageId: "preferIsNotNil" }],
    },
    {
      code: `
        function filterValues<T>(values: Array<T | null | undefined>) {
          return values.filter(value => value != null);
        }
      `,
      errors: [{ messageId: "preferIsNotNil" }],
    },
  ],
});
