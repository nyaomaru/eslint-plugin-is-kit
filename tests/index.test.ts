import { describe, expect, it } from "vitest";

import plugin from "../src/index.js";

describe("plugin", () => {
  it("exports all initial rules", () => {
    expect(Object.keys(plugin.rules ?? {})).toEqual([
      "no-ambiguous-filter-boolean",
      "no-redundant-predicate",
      "prefer-is-non-nullish",
      "prefer-type-guard",
    ]);
  });

  it("keeps preference rules out of the recommended preset", () => {
    expect(plugin.configs?.recommended).toMatchObject({
      rules: {
        "is-kit/no-ambiguous-filter-boolean": "error",
        "is-kit/no-redundant-predicate": "error",
      },
    });
    expect(plugin.configs?.recommended).not.toMatchObject({
      rules: {
        "is-kit/prefer-is-non-nullish": expect.anything(),
      },
    });
  });

  it("exports stylistic and strict presets", () => {
    expect(plugin.configs?.stylistic).toBeDefined();
    expect(plugin.configs?.strict).toBeDefined();
  });
});
