import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const temporaryDirectory = mkdtempSync(join(tmpdir(), "eslint-plugin-is-kit-smoke-"));
const packageDirectory = join(temporaryDirectory, "package");
const consumerDirectory = join(temporaryDirectory, "consumer");

const run = (command, arguments_, options = {}) =>
  execFileSync(command, arguments_, {
    cwd: options.cwd ?? consumerDirectory,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });

try {
  mkdirSync(packageDirectory);
  mkdirSync(consumerDirectory);

  run("pnpm", ["pack", "--pack-destination", packageDirectory], { cwd: root });

  const tarballs = readdirSync(packageDirectory).filter((file) => file.endsWith(".tgz"));
  assert.equal(tarballs.length, 1, "Expected pnpm pack to create exactly one tarball");

  const tarballPath = join(packageDirectory, tarballs[0]);
  const dependencies = {
    "@typescript-eslint/parser": packageJson.devDependencies["@typescript-eslint/parser"],
    eslint: packageJson.devDependencies.eslint,
    "eslint-plugin-is-kit": `file:${tarballPath}`,
    "is-kit": "1.14.0",
    typescript: packageJson.devDependencies.typescript,
  };

  writeFileSync(
    join(consumerDirectory, "package.json"),
    `${JSON.stringify(
      {
        name: "eslint-plugin-is-kit-smoke-consumer",
        private: true,
        type: "module",
        packageManager: packageJson.packageManager,
        dependencies,
      },
      null,
      2,
    )}\n`,
  );

  writeFileSync(
    join(consumerDirectory, "eslint.config.js"),
    `import parser from "@typescript-eslint/parser";
import isKit from "eslint-plugin-is-kit";

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  isKit.configs.strict,
];
`,
  );

  writeFileSync(
    join(consumerDirectory, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          module: "NodeNext",
          moduleResolution: "NodeNext",
          noEmit: true,
          strict: true,
          target: "ES2022",
        },
        include: ["*.ts", "*.cts"],
      },
      null,
      2,
    )}\n`,
  );

  writeFileSync(
    join(consumerDirectory, "fixture.ts"),
    `import { isString } from "is-kit";

const values: Array<string | null> = ["value", null];
const strings: string[] = ["value"];

values.filter(Boolean);
values.find((value) => typeof value === "string");
strings.filter(isString);
`,
  );

  writeFileSync(
    join(consumerDirectory, "clean.ts"),
    `import { isNotNil, isString } from "is-kit";

const values: Array<string | null> = ["value", null];

values.filter(isNotNil);
values.find(isString);
`,
  );

  writeFileSync(
    join(consumerDirectory, "cjs-consumer.cts"),
    `import isKit from "eslint-plugin-is-kit";

void isKit.configs.strict;
`,
  );

  run("pnpm", ["install", "--ignore-scripts"]);

  const esmOutput = run(
    "node",
    [
      "--input-type=module",
      "--eval",
      'import plugin from "eslint-plugin-is-kit"; console.log(Object.keys(plugin.rules).length);',
    ],
    { capture: true },
  ).trim();
  assert.equal(esmOutput, "4", "Expected the ESM entry point to export all four rules");

  const cjsOutput = run(
    "node",
    [
      "--input-type=commonjs",
      "--eval",
      'const { default: plugin } = require("eslint-plugin-is-kit"); console.log(Object.keys(plugin.rules).length);',
    ],
    { capture: true },
  ).trim();
  assert.equal(cjsOutput, "4", "Expected the CommonJS entry point to export all four rules");

  run("pnpm", ["exec", "tsc", "--noEmit"]);
  run("pnpm", ["exec", "eslint", "clean.ts"]);

  const lintResult = spawnSync("pnpm", ["exec", "eslint", "fixture.ts", "--format", "json"], {
    cwd: consumerDirectory,
    encoding: "utf8",
  });
  assert.equal(lintResult.status, 1, lintResult.stderr || "Expected the fixture to fail linting");

  const lintOutput = JSON.parse(lintResult.stdout);
  const ruleIds = lintOutput.flatMap((result) => result.messages.map((message) => message.ruleId));
  assert.deepEqual(ruleIds, [
    "is-kit/no-ambiguous-filter-boolean",
    "is-kit/prefer-type-guard",
    "is-kit/no-redundant-predicate",
  ]);

  console.log("Smoke test passed");
} finally {
  rmSync(temporaryDirectory, { force: true, recursive: true });
}
