import { preferTypeGuard } from "../../src/rules/prefer-type-guard.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("prefer-type-guard", preferTypeGuard, {
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
    `
      declare const values: Array<"a" | "b" | number>;
      values.find(value => typeof value === "string");
      values.every(value => typeof value === "string");
    `,
    `
      declare const values: string[];
      values.some(value => typeof value === "string");
    `,
    `
      declare const values: number[];
      values.some(value => typeof value === "string");
    `,
    `
      declare const value: unknown;
      if (value === null) console.log(value);
      if (value === undefined) console.log(value);
      if (Array.isArray(value)) console.log(value.length);
    `,
    `
      declare const values: Array<string | null | undefined>;
      values.filter(value => value == null);
    `,
    `
      declare const values: null[];
      values.filter(value => value === null);
    `,
    `
      export {};
      const undefined = "local";
      declare const values: Array<string | undefined>;
      values.filter(value => value === undefined);
    `,
    `
      export {};
      const Array = { isArray: (_value: unknown) => true };
      declare const values: unknown[];
      values.filter(value => Array.isArray(value));
    `,
    `
      declare const values: Array<unknown[] | string>;
      values.filter(value => Array.isArray(value));
    `,
    `
      declare const values: unknown[];
      values.filter(Array.isArray);
    `,
    `
      declare const values: unknown[];
      values.find?.(value => typeof value === "string");
    `,
    `
      const custom: {
        find(predicate: (value: unknown) => boolean): void;
        [index: number]: unknown;
      } = {} as never;
      custom.find(value => typeof value === "string");
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
          data: { method: "filter", predicate: "isString" },
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
          data: { method: "filter", predicate: "isString" },
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
          data: { method: "filter", predicate: "isNumberPrimitive" },
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
          data: { method: "filter", predicate: "isBoolean" },
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
          data: { method: "filter", predicate: "isBigInt" },
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
          data: { method: "filter", predicate: "isSymbol" },
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
          data: { method: "filter", predicate: "isUndefined" },
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
          data: { method: "filter", predicate: "isString" },
        },
      ],
    },
    {
      code: `
        declare const values: Array<string | number>;
        values.find(value => typeof value === "string");
      `,
      errors: [
        {
          messageId: "preferTypeGuard",
          data: { method: "find", predicate: "isString" },
        },
      ],
    },
    {
      code: `
        declare const values: Array<string | number> | undefined;
        values?.find(value => typeof value === "string");
      `,
      errors: [
        {
          messageId: "preferTypeGuard",
          data: { method: "find", predicate: "isString" },
        },
      ],
    },
    {
      code: `
        declare const values: Array<string | number>;
        values.every(value => typeof value === "string");
      `,
      errors: [
        {
          messageId: "preferTypeGuard",
          data: { method: "every", predicate: "isString" },
        },
      ],
    },
    {
      code: `
        declare const values: Array<"a" | "b" | number>;
        values.some(value => typeof value === "string");
      `,
      errors: [
        {
          messageId: "preferTypeGuard",
          data: { method: "some", predicate: "isString" },
        },
      ],
    },
    {
      code: `
        declare const values: Array<string | null>;
        values.filter(value => value === null);
      `,
      errors: [
        {
          messageId: "preferTypeGuard",
          data: { method: "filter", predicate: "isNull" },
        },
      ],
    },
    {
      code: `
        declare const values: Array<string | undefined>;
        values.find(value => undefined === value);
      `,
      errors: [
        {
          messageId: "preferTypeGuard",
          data: { method: "find", predicate: "isUndefined" },
        },
      ],
    },
    {
      code: `
        declare const values: unknown[];
        values.filter(value => Array.isArray(value));
        values.find(value => Array.isArray(value));
        values.some(value => Array.isArray(value));
        values.every(value => Array.isArray(value));
      `,
      output: null,
      errors: [
        {
          messageId: "preferTypeGuard",
          data: { method: "filter", predicate: "isArray" },
        },
        {
          messageId: "preferTypeGuard",
          data: { method: "find", predicate: "isArray" },
        },
        {
          messageId: "preferTypeGuard",
          data: { method: "some", predicate: "isArray" },
        },
        {
          messageId: "preferTypeGuard",
          data: { method: "every", predicate: "isArray" },
        },
      ],
    },
    {
      code: `
        declare const values: Array<unknown[] | string>;
        values.some(value => Array.isArray(value));
      `,
      errors: [
        {
          messageId: "preferTypeGuard",
          data: { method: "some", predicate: "isArray" },
        },
      ],
    },
  ],
});
