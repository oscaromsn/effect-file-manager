# CI/CD Pipeline

> **Relevant source files**
> * [.github/actions/setup/action.yml](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/actions/setup/action.yml)
> * [.github/workflows/check.yml](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml)

## Purpose and Scope

This document describes the GitHub Actions-based continuous integration and continuous delivery (CI/CD) system that automatically validates code quality on every push and pull request. The pipeline executes four parallel jobs: TypeScript type-checking, linting, formatting verification, and test execution.

For information about the underlying code quality tools (OxLint, ESLint, Prettier), see [Code Quality Tools](/lucas-barake/effect-file-manager/8.1-code-quality-tools). For details about the testing framework and strategy, see [Testing Strategy](/lucas-barake/effect-file-manager/8.3-testing-strategy).

**Sources:** [.github/workflows/check.yml L1-L73](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml#L1-L73)

---

## Workflow Overview

The CI/CD pipeline is defined in the `check` workflow, which runs automatically on:

* Pushes to the `main` branch
* Pull requests targeting the `main` branch

The workflow uses GitHub Actions concurrency controls to cancel in-progress runs when new commits are pushed to the same branch or pull request, preventing resource waste.

```

```

This configuration creates a concurrency group based on the workflow name and Git reference (branch or PR), ensuring only the latest commit's checks are running.

**Sources:** [.github/workflows/check.yml L3-L11](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml#L3-L11)

---

## Job Execution Matrix

The workflow executes four independent jobs in parallel, each running on `ubuntu-latest` with a 10-minute timeout:

| Job Name | Purpose | Script Command | Timeout |
| --- | --- | --- | --- |
| `typecheck` | Validates TypeScript types across all packages | `pnpm typecheck` | 10 minutes |
| `lint` | Runs OxLint and ESLint checks | `pnpm lint` | 10 minutes |
| `format` | Verifies Prettier formatting compliance | `pnpm format:check` | 10 minutes |
| `test` | Executes Vitest test suites | `pnpm test` | 10 minutes |

All jobs share an identical structure:

1. Checkout repository code
2. Execute the custom setup action
3. Run the job-specific script command

**Sources:** [.github/workflows/check.yml L14-L72](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml#L14-L72)

---

## Workflow Execution Flow

```

```

**Diagram: GitHub Actions Workflow Execution**

This diagram illustrates how the `check` workflow processes incoming triggers, manages concurrency, and executes four parallel jobs. Each job runs independently on its own runner instance, allowing failures in one job to report immediately without blocking others.

**Sources:** [.github/workflows/check.yml L1-L73](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml#L1-L73)

---

## Setup Composite Action

The setup logic is extracted into a reusable composite action located at `.github/actions/setup/action.yml`. This action standardizes the environment configuration across all jobs:

```

```

**Diagram: Setup Action Step Sequence**

### Step Breakdown

**1. Install pnpm**
The action uses `pnpm/action-setup@v4` to install pnpm version 9, the package manager for the monorepo workspace.

```

```

**2. Setup Node.js**
The action configures Node.js version 22 with pnpm caching enabled. The cache key is automatically derived from the `pnpm-lock.yaml` file, ensuring cache hits when dependencies haven't changed.

```

```

**3. Install Dependencies**
Finally, the action installs all workspace dependencies using `--frozen-lockfile`, which fails if the lockfile is out of sync with `package.json` files. This enforces lockfile consistency and prevents unexpected dependency updates during CI runs.

```

```

**Sources:** [.github/actions/setup/action.yml L1-L21](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/actions/setup/action.yml#L1-L21)

---

## Job Definitions

### TypeScript Type-Checking Job

The `typecheck` job validates TypeScript types across all packages in the monorepo workspace.

```

```

The `pnpm typecheck` command is defined in the root `package.json` and runs TypeScript's `tsc` compiler in type-checking mode (no emit) across all workspace packages. This validates:

* Type correctness in source files
* Interface compatibility between packages
* Proper usage of Effect-TS types
* Shared type definitions in `@example/domain`

**Sources:** [.github/workflows/check.yml L14-L27](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml#L14-L27)

---

### Lint Job

The `lint` job executes both OxLint and ESLint checkers to enforce code quality standards.

```

```

The `pnpm lint` script runs the configured linters. For details about the linting rules and configuration files (`.oxlintrc.json`, `eslint.config.mjs`), see [Code Quality Tools](/lucas-barake/effect-file-manager/8.1-code-quality-tools).

**Sources:** [.github/workflows/check.yml L29-L42](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml#L29-L42)

---

### Format Verification Job

The `format` job verifies that all files comply with Prettier formatting rules without modifying them.

```

```

The `pnpm format:check` command runs Prettier in check mode, which exits with a non-zero status code if any files are not properly formatted. Developers must run `pnpm format` locally to auto-fix formatting issues before pushing.

**Sources:** [.github/workflows/check.yml L44-L57](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml#L44-L57)

---

### Test Execution Job

The `test` job runs the Vitest test suites across all packages containing tests.

```

```

The `pnpm test` script executes Vitest, which:

* Discovers test files (`*.test.ts`, `*.test.tsx`)
* Runs Effect-based tests with mock layers
* Reports coverage statistics
* Fails the job if any test fails

For information about the testing framework, mock layers, and test patterns, see [Testing Strategy](/lucas-barake/effect-file-manager/8.3-testing-strategy).

**Sources:** [.github/workflows/check.yml L59-L72](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml#L59-L72)

---

## Code Entity Mapping

The following table maps natural language concepts to concrete code entities in the CI/CD system:

| Concept | Code Entity | Location |
| --- | --- | --- |
| Main workflow | `check` workflow | [.github/workflows/check.yml L1](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml#L1-L1) |
| Environment setup | `setup` composite action | [.github/actions/setup/action.yml L1](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/actions/setup/action.yml#L1-L1) |
| Type validation | `typecheck` job | [.github/workflows/check.yml L14-L27](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml#L14-L27) |
| Code linting | `lint` job | [.github/workflows/check.yml L29-L42](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml#L29-L42) |
| Format checking | `format` job | [.github/workflows/check.yml L44-L57](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml#L44-L57) |
| Test execution | `test` job | [.github/workflows/check.yml L59-L72](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml#L59-L72) |
| Package manager installation | `pnpm/action-setup@v4` | [.github/actions/setup/action.yml L8-L10](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/actions/setup/action.yml#L8-L10) |
| Node.js installation | `actions/setup-node@v4` | [.github/actions/setup/action.yml L13-L16](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/actions/setup/action.yml#L13-L16) |
| Dependency installation | `pnpm install --frozen-lockfile` | [.github/actions/setup/action.yml L20](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/actions/setup/action.yml#L20-L20) |
| Concurrency group | `${{ github.workflow }}-${{ github.ref }}` | [.github/workflows/check.yml L10](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml#L10-L10) |

---

## Pipeline Behavior and Characteristics

### Parallel Execution

All four jobs execute in parallel on separate runner instances. This reduces total execution time from approximately 40 minutes (4 jobs × 10 minutes) to approximately 10 minutes (the duration of the longest job). The jobs are independent and do not share state or artifacts.

### Fail-Fast Disabled

The workflow does not use GitHub Actions' `fail-fast` strategy (which would be specified in a job matrix). Each job runs to completion regardless of whether other jobs fail. This provides complete feedback on all quality checks, even if one check fails early.

### Timeout Protection

Each job has a 10-minute timeout configured. If any job exceeds this duration, GitHub Actions automatically terminates it and marks it as failed. This prevents runaway processes from consuming excessive runner time.

```

```

**Sources:** [.github/workflows/check.yml L17-L62](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml#L17-L62)

---

## Integration with Development Workflow

```

```

**Diagram: Developer-to-CI Integration Flow**

This sequence diagram shows how developer actions trigger the CI/CD pipeline and how results are reported back through GitHub's status checks.

**Sources:** [.github/workflows/check.yml L1-L73](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml#L1-L73)

---

## Caching Strategy

The setup action leverages GitHub Actions' built-in caching for Node.js dependencies. The `actions/setup-node@v4` action with `cache: "pnpm"` automatically:

1. Generates a cache key from the `pnpm-lock.yaml` content hash
2. Checks for a cached `node_modules` directory with a matching key
3. Restores the cache if found, significantly reducing `pnpm install` time
4. Updates the cache after `pnpm install` if dependencies changed

On cache hits, dependency installation completes in seconds instead of minutes. Cache misses occur when:

* The `pnpm-lock.yaml` file changes (new/updated dependencies)
* The cache expires (GitHub Actions caches expire after 7 days of inactivity)
* The runner OS or Node.js version changes

**Sources:** [.github/actions/setup/action.yml L13-L16](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/actions/setup/action.yml#L13-L16)

---

## Status Checks and Branch Protection

The four jobs (`typecheck`, `lint`, `format`, `test`) can be configured as required status checks in GitHub repository settings. When enabled as branch protection rules, they prevent:

* Merging pull requests with failing checks
* Direct pushes to `main` that would break the build
* Merging code that doesn't meet quality standards

Each job reports its status independently, allowing developers to identify which specific check failed without examining logs for all jobs.

**Sources:** [.github/workflows/check.yml L14-L72](https://github.com/lucas-barake/effect-file-manager/blob/28eedd82/.github/workflows/check.yml#L14-L72)