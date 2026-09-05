import { noRedundantPredicate } from "../../src/rules/no-redundant-predicate.js";
import { ruleTester } from "../rule-tester.js";

function redundant(predicate: string, acceptedType: string) {
  return {
    messageId: "redundantPredicate" as const,
    data: { predicate, acceptedType },
  };
}

ruleTester.run("no-redundant-predicate", noRedundantPredicate, {
  valid: [
    `
      import { isString } from "is-kit";
      declare const values: unknown[];
      values.filter(isString);
    `,
    `
      import { isString } from "is-kit";
      declare const values: Array<string | null>;
      values.filter(isString);
    `,
    `
      import { isNumber } from "is-kit";
      declare const values: number[];
      values.filter(isNumber);
    `,
    `
      import { isNotNil } from "is-kit";
      declare const values: Array<string | null>;
      values.filter(isNotNil);
    `,
    `
      import { isNotNil } from "is-kit";
      declare const values: void[];
      values.filter(isNotNil);
    `,
    `
      const isString = (_value: unknown) => true;
      declare const values: string[];
      values.filter(isString);
    `,
    `
      import { isString } from "other-package";
      declare const values: string[];
      values.filter(isString);
    `,
    `
      import { isString } from "is-kit";
      declare const values: any[];
      values.filter(isString);
    `,
    `
      import { isString } from "is-kit";
      function filterValues<T>(values: T[]) {
        return values.filter(isString);
      }
    `,
    `
      import { isString } from "is-kit";
      declare const values: string[];
      function filterValues() {
        const isString = (_value: unknown) => true;
        return values.filter(isString);
      }
    `,
    `
      import { isString } from "is-kit";
      const custom: {
        filter(predicate: (value: string) => boolean): void;
        [index: number]: string;
      } = {} as never;
      custom.filter(isString);
    `,
  ],
  invalid: [
    {
      code: `
        import {
          isBigInt,
          isBoolean,
          isNumberPrimitive,
          isString,
          isSymbol,
        } from "is-kit";
        declare const strings: string[];
        declare const numbers: number[];
        declare const booleans: boolean[];
        declare const bigints: bigint[];
        declare const symbols: symbol[];
        strings.filter(isString);
        numbers.filter(isNumberPrimitive);
        booleans.filter(isBoolean);
        bigints.filter(isBigInt);
        symbols.filter(isSymbol);
      `,
      output: null,
      errors: [
        redundant("isString", "a string"),
        redundant("isNumberPrimitive", "a number primitive"),
        redundant("isBoolean", "a boolean"),
        redundant("isBigInt", "a bigint"),
        redundant("isSymbol", "a symbol"),
      ],
    },
    {
      code: `
        import { isString as stringGuard } from "is-kit";
        declare const values: Array<"a" | "b">;
        values.filter(stringGuard);
      `,
      errors: [redundant("isString", "a string")],
    },
    {
      code: `
        import * as isKit from "is-kit";
        declare const values: string[];
        values.filter(isKit.isString);
      `,
      errors: [redundant("isString", "a string")],
    },
    {
      code: `
        import { isNotNil } from "is-kit";
        declare const values: string[];
        values.filter(isNotNil);
      `,
      errors: [redundant("isNotNil", "non-nullish")],
    },
    {
      code: `
        import { isNull, isUndefined } from "is-kit";
        declare const nulls: null[];
        declare const undefineds: undefined[];
        nulls.filter(isNull);
        undefineds.filter(isUndefined);
      `,
      errors: [redundant("isNull", "null"), redundant("isUndefined", "undefined")],
    },
    {
      code: `
        import { isString } from "is-kit";
        declare const values: string[] | undefined;
        values?.filter(isString);
      `,
      errors: [redundant("isString", "a string")],
    },
    {
      code: `
        import { isString } from "is-kit";
        declare const values: readonly string[];
        values.filter(isString);
      `,
      errors: [redundant("isString", "a string")],
    },
  ],
});
