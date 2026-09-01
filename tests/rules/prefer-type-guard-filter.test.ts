import { preferTypeGuardFilter } from "../../src/rules/prefer-type-guard-filter.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("prefer-type-guard-filter", preferTypeGuardFilter, {
  valid: [
    `
      declare const value: unknown;
      if (typeof value === "string") value.toUpperCase();
    `,
    `
      declare const values: unknown[];
      values.map(value => typeof value === "string");
    `,
    `
      declare const values: string[];
      values.filter(value => typeof value === "string");
    `,
    `
      declare const values: Array<"a" | "b" | number>;
      values.filter(value => typeof value === "string");
    `,
    `
      declare const values: unknown[];
      values.filter(value => typeof value !== "string");
    `,
    `
      declare const values: unknown[];
      values.filter(value => typeof value === "object");
    `,
    `
      declare const values: unknown[];
      values.filter(value => {
        return typeof value === "string";
      });
    `,
    `
      function filterValues<T>(values: T[]) {
        return values.filter(value => typeof value === "string");
      }
    `,
    `
      const custom: {
        filter(predicate: (value: unknown) => boolean): void;
        [index: number]: unknown;
      } = {} as never;
      custom.filter(value => typeof value === "string");
    `,
  ],
  invalid: [
    {
      code: `
        declare const values: unknown[];
        values.filter(value => typeof value === "string");
      `,
      output: null,
      errors: [
        {
          messageId: "preferTypeGuard",
          data: { predicate: "isString" },
        },
      ],
    },
    {
      code: `
        declare const values: any[];
        values.filter(value => typeof value === "string");
      `,
      errors: [
        {
          messageId: "preferTypeGuard",
          data: { predicate: "isString" },
        },
      ],
    },
    {
      code: `
        declare const values: Array<string | number | null>;
        values.filter(value => typeof value === "number");
      `,
      errors: [
        {
          messageId: "preferTypeGuard",
          data: { predicate: "isNumberPrimitive" },
        },
      ],
    },
    {
      code: `
        declare const values: Array<boolean | string>;
        values.filter(value => "boolean" === typeof value);
      `,
      errors: [
        {
          messageId: "preferTypeGuard",
          data: { predicate: "isBoolean" },
        },
      ],
    },
    {
      code: `
        declare const values: Array<bigint | number>;
        values.filter(value => typeof value == "bigint");
      `,
      errors: [
        {
          messageId: "preferTypeGuard",
          data: { predicate: "isBigInt" },
        },
      ],
    },
    {
      code: `
        declare const values: Array<symbol | string>;
        values.filter(value => typeof value === "symbol");
      `,
      errors: [
        {
          messageId: "preferTypeGuard",
          data: { predicate: "isSymbol" },
        },
      ],
    },
    {
      code: `
        declare const values: Array<string | undefined>;
        values.filter(value => typeof value === "undefined");
      `,
      errors: [
        {
          messageId: "preferTypeGuard",
          data: { predicate: "isUndefined" },
        },
      ],
    },
    {
      code: `
        declare const values: Array<string | null> | undefined;
        values?.filter(value => typeof value === "string");
      `,
      errors: [
        {
          messageId: "preferTypeGuard",
          data: { predicate: "isString" },
        },
      ],
    },
  ],
});
