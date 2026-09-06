# eslint-plugin-is-kit release and is-kit integration plan

## Status

- Owner: nyaomaru
- Target plugin release: `eslint-plugin-is-kit@0.1.0`
- Release preparation PR: `nyaomaru/eslint-plugin-is-kit#2`
- Follow-up: documentation integration PR in `nyaomaru/is-kit`

## Goal

Publish the first small release of `eslint-plugin-is-kit`, then add focused
discovery paths from `is-kit` without turning the runtime package's README or
documentation into a duplicate copy of the plugin documentation.

The integration should reach two audiences:

1. Existing `is-kit` users who may benefit from linting their predicates.
2. Developers who find the nullish-filtering guide while investigating
   `filter(Boolean)` behavior.

## Decisions

### Publish before integration

The `is-kit` integration PR is created only after `eslint-plugin-is-kit@0.1.0`
is installable from npm. This keeps all commands and links in the integration
PR immediately verifiable.

### Keep the first integration PR documentation-only

The first integration PR adds discovery paths but does not install or enable
ESLint in the `is-kit` repository. `is-kit` currently uses Oxlint; introducing
ESLint, typescript-eslint, and a second lint configuration solely for
dogfooding would add dependencies and CI cost beyond the purpose of the
integration PR.

Actual dogfooding can be evaluated separately after the plugin has received
some real-world use.

### Use the plugin README as the canonical documentation

The plugin README and rule pages remain the source of truth for installation,
configuration, presets, compatibility, and rule behavior. The `is-kit`
repository contains short explanations and direct links, not copied setup
documentation.

### Do not add a dedicated is-kit.dev guide yet

The existing nullish-filtering guide already matches the strongest initial use
case. A dedicated plugin guide would duplicate the plugin README while the
plugin contains only four rules. Reconsider this when the plugin covers more
use cases or needs a longer migration guide.

## Delivery sequence

### 1. Complete release preparation

Merge `eslint-plugin-is-kit#2` after its Build, Lint, Test, and compatibility
smoke-test jobs pass.

The merged changes must include:

- the release-ready README;
- `publishConfig` for the public npm registry;
- `pnpm release:check`;
- `.github/workflows/npm-publish.yml`.

### 2. Prepare the public release

Before creating the release:

1. Make `nyaomaru/eslint-plugin-is-kit` public.
2. Confirm that `eslint-plugin-is-kit` is still unregistered on npm.
3. Add a granular `NPM_TOKEN` repository secret for the bootstrap publish.
4. Confirm that `package.json` and `src/index.ts` both report version `0.1.0`.
5. Run `pnpm release:check` from a clean checkout of `main`.

The repository should be public before publishing so npm metadata, source
links, rule documentation, and provenance can point to accessible source.

### 3. Publish 0.1.0

Create and publish a GitHub Release with tag `v0.1.0`. The npm workflow must:

1. install the frozen dependency graph;
2. run the complete release check, including the packed-consumer smoke test;
3. reject a tag that does not match `package.json`;
4. publish the already-verified artifact with lifecycle scripts disabled.

After the workflow succeeds, verify:

```sh
npm view eslint-plugin-is-kit@0.1.0 version
npm view eslint-plugin-is-kit@0.1.0 dist-tags
```

Also install `eslint-plugin-is-kit@0.1.0` in a fresh consumer project and
confirm that the npm page renders the README and its rule links correctly.

Once the package exists, configure npm Trusted Publishing for:

- owner: `nyaomaru`
- repository: `eslint-plugin-is-kit`
- workflow: `npm-publish.yml`

After one successful OIDC publish, remove the long-lived `NPM_TOKEN` secret.

For later releases, run the `Version Bump` workflow from the Actions page. It
updates `package.json` and the plugin metadata version together, validates the
result, and opens a `release/<version>` pull request. Merge that pull request
before creating the matching GitHub Release. The repository setting **Allow
GitHub Actions to create and approve pull requests** must be enabled for the
workflow to open that pull request.

### 4. Create the is-kit integration PR

Create a new branch from the latest `nyaomaru/is-kit` main branch. Suggested
branch and PR title:

- Branch: `docs/eslint-plugin-integration`
- PR title: `docs: add eslint-plugin-is-kit integration`

Keep this PR independent from runtime changes and version bumps.

## is-kit integration changes

### README

Add a compact `ESLint integration` section after Quick Start. It should be
visible early in the README without interrupting the initial explanation of
the runtime package.

The section should contain:

- one sentence explaining that the plugin detects ambiguous or redundant
  array predicates;
- a before/after example using `filter(Boolean)` and `filter(isNotNil)`;
- the plugin installation command;
- one link to the plugin README for typed configuration and the full rule list.

Suggested content:

````md
## ESLint integration

[`eslint-plugin-is-kit`](https://github.com/nyaomaru/eslint-plugin-is-kit)
detects ambiguous or redundant array predicates and can suggest reusable
is-kit guards when they preserve runtime behavior and useful narrowing.

```ts
values.filter(Boolean); // May also remove "", 0, false, and NaN.
values.filter(isNotNil); // Removes only null and undefined.
```

```sh
pnpm add -D eslint-plugin-is-kit
```

See the [plugin setup and rule reference](https://github.com/nyaomaru/eslint-plugin-is-kit#readme).
````

Do not copy the complete flat-config example or rules table into the `is-kit`
README. Those details will change more frequently than the integration link.

### Nullish-filtering guide

Update `docs/app/guides/filter-null-and-undefined/page.tsx`. Add a short callout
immediately after the existing explanation of why `filter(Boolean)` is broader
than nullish removal.

The callout should:

- name the `no-ambiguous-filter-boolean` rule;
- state that it uses TypeScript type information and only reports when both
  nullish and non-nullish falsy values are possible;
- link to the plugin's rule page;
- avoid implying that every `filter(Boolean)` call is incorrect.

Suggested message:

> Want to catch this distinction during linting? The
> `is-kit/no-ambiguous-filter-boolean` rule reports `filter(Boolean)` only when
> the array type contains both a nullish value and another possible falsy
> value.

Use the existing `GuideCallout` and `TextLink` components. Do not add a new
guide route, navigation entry, screenshot, or site-wide promotional banner.

### Optional release communication

After merging the integration PR:

- mention the plugin in the next relevant `is-kit` release notes;
- add `eslint-plugin`, `typescript`, `type-guards`, and `is-kit` topics to the
  plugin repository;
- add an npm version badge to the plugin README once the npm page exists.

These are follow-up visibility tasks, not requirements for the integration PR.

## Out of scope

- Adding ESLint or typescript-eslint dependencies to `is-kit`.
- Replacing or extending the existing Oxlint setup.
- Adding new plugin rules or changing rule semantics.
- Creating a dedicated plugin guide on is-kit.dev.
- Automating cross-repository pull requests.
- Bumping the `is-kit` runtime package solely for documentation changes.

## Validation

### eslint-plugin-is-kit release

- `pnpm release:check` passes on `main`.
- The npm workflow succeeds for tag `v0.1.0`.
- `npm view eslint-plugin-is-kit@0.1.0 version` returns `0.1.0`.
- A fresh consumer can import the ESM and CommonJS entry points.
- The npm README and all four rule links are accessible without authentication.

### is-kit integration PR

- README formatting passes.
- `pnpm format:check` passes.
- `pnpm lint` passes.
- `pnpm --filter is-kit-docs build` passes.
- Both new links resolve to public pages.
- `package.json` and `pnpm-lock.yaml` are unchanged.

## Failure handling

- If publishing fails before npm accepts the version, fix the workflow and
  rerun the failed job for the same tag.
- If npm has accepted `0.1.0`, never attempt to overwrite or reuse that version.
  Fix forward with a new patch version.
- If public links or npm installation are not working, delay the `is-kit`
  integration PR rather than merging broken instructions.
- If the integration attracts false-positive reports, collect minimal
  reproductions in the plugin repository before expanding recommended rules.

## Completion criteria

This plan is complete when:

1. `eslint-plugin-is-kit@0.1.0` is publicly installable;
2. npm publishing has a verified path away from the bootstrap token;
3. the `is-kit` README contains an early, concise plugin introduction;
4. the nullish-filtering guide links the relevant rule at the point of need;
5. the integration PR adds no runtime or lint-tooling dependencies to `is-kit`.
