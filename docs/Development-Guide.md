# Development Guide

> **Relevant source files**
> * [.gitignore](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/.gitignore)
> * [README.md](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md)
> * [bun.lock](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/bun.lock)
> * [package.json](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json)
> * [packages/server/package.json](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json)

This document provides practical guidance for developers working on the TalentScore codebase. It covers local environment setup, development workflows, available build commands, and debugging strategies.

For detailed environment configuration, see [Environment Setup](/oscaromsn/TalentScore/6.1-environment-setup). For a complete reference of build scripts, see [Build and Development Commands](/oscaromsn/TalentScore/6.2-build-and-development-commands). For tracing and debugging techniques, see [Observability and Debugging](/oscaromsn/TalentScore/6.3-observability-and-debugging).

---

## Prerequisites

TalentScore requires specific versions of runtime tools and external services to run correctly:

| Requirement | Version | Purpose |
| --- | --- | --- |
| **Node.js** | 22.14.0 | JavaScript runtime |
| **pnpm** | 10.3.0 | Package manager and workspace orchestrator |
| **Docker** | Latest | Runs PostgreSQL and Jaeger containers |
| **OpenAI API Key** | - | Required for `CustomGPT5` BAML client |
| **UploadThing Token** | v7 API | Required for file upload service |

The Node.js and pnpm versions are enforced in [package.json L5-L8](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L5-L8)

 via the `engines` field. The `packageManager` field at [package.json L4](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L4-L4)

 ensures pnpm version consistency across environments.

**Sources**: [package.json L1-L68](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L1-L68)

 [README.md L32-L36](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L32-L36)

---

## Development Workflow Overview

The following diagram illustrates the complete development setup workflow, from initial clone to running development servers:

```

```

This workflow must be executed in order. The `pnpm baml:generate` step is critical because it generates type-safe TypeScript clients from BAML definitions in `packages/server/baml_src/`. Without this step, the server will fail to compile due to missing imports.

**Sources**: [README.md L38-L86](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L38-L86)

 [package.json L12-L29](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L12-L29)

---

## Monorepo Development Architecture

TalentScore uses pnpm workspaces to manage three interdependent packages. The following diagram maps the development server processes to their package locations and responsibilities:

```mermaid
flowchart TD

DevServer["pnpm dev:server<br>tsx --watch src/server.ts"]
ServerPort["HTTP: localhost:3001<br>WebSocket: ws://localhost:3001/rpc"]
DevClient["pnpm dev:client<br>vite dev"]
ClientPort["HTTP: localhost:5173<br>Vite HMR: ws://localhost:5173"]
ServerSrc["src/server.ts<br>Main entry point"]
RPCHandlers["src/public/<br>ResumeRpcLive, FilesRpcLive"]
BAMLSrc["baml_src/<br>resume.baml, clients.baml"]
Migrations["src/db/migrations/<br>*.sql"]
ClientSrc["src/main.tsx<br>React entry point"]
Routes["src/routes/<br>TanStack Router pages"]
Atoms["src/lib/atoms/<br>resume-atoms, files-atoms"]
Components["src/components/<br>UI layer"]
RPCContracts["src/rpc/<br>ResumeRpc, FilesRpc"]
Schemas["src/schemas/<br>ResumeData, UploadedFile"]
Postgres["PostgreSQL<br>localhost:5432"]
Jaeger["Jaeger UI<br>Unsupported markdown: link"]

ServerPort --> ServerSrc
ServerSrc --> Postgres
ServerSrc --> Jaeger
ClientPort --> ClientSrc
Atoms --> ServerPort
RPCHandlers --> RPCContracts
Atoms --> RPCContracts
RPCHandlers --> Schemas
Atoms --> Schemas

subgraph subGraph5 ["External Services (Docker)"]
    Postgres
    Jaeger
end

subgraph packages/domain ["packages/domain"]
    RPCContracts
    Schemas
end

subgraph packages/client ["packages/client"]
    ClientSrc
    Routes
    Atoms
    Components
    ClientSrc --> Routes
    Routes --> Atoms
    Routes --> Components
end

subgraph packages/server ["packages/server"]
    ServerSrc
    RPCHandlers
    BAMLSrc
    Migrations
    ServerSrc --> RPCHandlers
    ServerSrc --> BAMLSrc
    ServerSrc --> Migrations
end

subgraph subGraph1 ["Terminal 2: Client Process"]
    DevClient
    ClientPort
    DevClient --> ClientPort
end

subgraph subGraph0 ["Terminal 1: Server Process"]
    DevServer
    ServerPort
    DevServer --> ServerPort
end
```

**Key Development Features**:

1. **Hot Module Replacement (HMR)**: The client's Vite dev server supports instant updates without full page reloads. Changes to React components in `packages/client/src/components/` trigger automatic re-renders.
2. **Watch Mode Compilation**: The server's `tsx --watch` process at [packages/server/package.json L17](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L17-L17)  monitors TypeScript files and restarts on changes. Modifications to RPC handlers in `packages/server/src/public/` trigger automatic server restarts.
3. **Shared Type Safety**: Both client and server depend on `@example/domain`, ensuring contract changes trigger compilation errors on both sides simultaneously.
4. **Independent Development**: The client and server can be developed and restarted independently. The WebSocket RPC connection automatically reconnects after server restarts.

**Sources**: [package.json L25-L26](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L25-L26)

 [packages/server/package.json L17](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L17-L17)

 [README.md L73-L82](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L73-L82)

---

## Quick Start Commands

The following table provides copy-paste commands for common development tasks:

| Task | Command | Notes |
| --- | --- | --- |
| **Initial Setup** |  |  |
| Install dependencies | `pnpm install` | Installs all workspace packages |
| Create environment file | `cp .env.example .env` | Must manually add API keys |
| Start infrastructure | `docker compose up -d` | Starts PostgreSQL + Jaeger |
| Apply database schema | `pnpm db:migrate` | Runs migrations in [packages/server/src/db/migrations/](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/db/migrations/) |
| Generate BAML clients | `pnpm baml:generate` | Creates TypeScript types from `.baml` files |
| **Development** |  |  |
| Start server | `pnpm dev:server` | Runs on port 3001 with hot reload |
| Start client | `pnpm dev:client` | Runs on port 5173 with Vite HMR |
| **Code Quality** |  |  |
| Type checking | `pnpm check` | Runs `tsc -b` on all packages |
| Fast type check | `pnpm check:fast` | Runs linting + type check without rebuild |
| Lint code | `pnpm lint` | Runs Oxlint + ESLint |
| Fix lint issues | `pnpm lint:fix` | Auto-fixes linting violations |
| Format code | `pnpm format` | Runs Prettier on all files |
| Check formatting | `pnpm format:check` | Verifies Prettier compliance |
| **Testing** |  |  |
| Run tests | `pnpm test` | Runs Vitest suite once |
| Watch mode | `pnpm test:watch` | Runs Vitest in watch mode |
| **Database** |  |  |
| Reset database | `pnpm db:reset` | Drops all tables and re-applies schema |
| **Build** |  |  |
| Build all packages | `pnpm build` | Compiles domain → client → server |

All commands listed above are defined in [package.json L12-L29](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L12-L29)

 and delegate to package-specific scripts using pnpm's `--filter` flag.

**Sources**: [package.json L12-L29](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L12-L29)

 [packages/server/package.json L11-L21](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L11-L21)

 [README.md L119-L129](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L119-L129)

---

## Environment Variables Configuration

TalentScore requires environment variables to connect to external services. The following diagram maps environment variables to their consuming services:

```mermaid
flowchart TD

EnvFile[".env file<br>(gitignored)"]
DBUrl["DATABASE_URL<br>PostgreSQL connection"]
UTToken["UPLOADTHING_TOKEN<br>v7 API token"]
OpenAIKey["OPENAI_API_KEY<br>LLM access"]
SQLRepo["@effect/sql-pg<br>PgClient.layer"]
UTService["FilesRpcLive<br>UploadThing.init"]
BAMLClient["BAML runtime<br>b.CustomGPT5"]
PostgresDB["PostgreSQL<br>localhost:5432"]
UploadThingAPI["UploadThing API<br>uploadthing.com"]
OpenAIAPI["OpenAI API<br>api.openai.com"]

EnvFile --> DBUrl
EnvFile --> UTToken
EnvFile --> OpenAIKey
DBUrl --> SQLRepo
UTToken --> UTService
OpenAIKey --> BAMLClient
SQLRepo --> PostgresDB
UTService --> UploadThingAPI
BAMLClient --> OpenAIAPI

subgraph subGraph1 ["Server Dependencies"]
    SQLRepo
    UTService
    BAMLClient
end

subgraph subGraph0 ["Required Variables"]
    DBUrl
    UTToken
    OpenAIKey
end
```

**Variable Details**:

* **`DATABASE_URL`**: PostgreSQL connection string. Default for Docker: `postgresql://postgres:postgres@localhost:5432/postgres`. Used by `@effect/sql-pg` to create the `PgClient` layer.
* **`UPLOADTHING_TOKEN`**: Authentication token for UploadThing v7 API. Required for `initiateUpload` and `getFilesByKeys` RPC methods in `FilesRpcLive`. Obtain from [uploadthing.com dashboard](https://uploadthing.com).
* **`OPENAI_API_KEY`**: API key for OpenAI services. Used by the `CustomGPT5` BAML client defined in `packages/server/baml_src/clients.baml`. If using Anthropic instead, configure `ANTHROPIC_API_KEY` and modify the client configuration.

The server loads environment variables via `dotenv-cli` at [packages/server/package.json L17](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L17-L17)

 using the `dotenv -e ../../.env` prefix.

**Sources**: [README.md L44-L56](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L44-L56)

 [packages/server/package.json L17](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L17-L17)

---

## BAML Code Generation Workflow

BAML (BoundaryML) generates type-safe TypeScript clients from declarative `.baml` schema files. The generation process must be executed whenever BAML definitions change:

```mermaid
sequenceDiagram
  participant Developer
  participant baml_src/
  participant resume.baml, clients.baml
  participant pnpm baml:generate
  participant bunx baml-cli generate
  participant baml_client/
  participant TypeScript code
  participant packages/server/src/
  participant Imports from baml_client

  Developer->>baml_src/: Edit .baml schema
  Developer->>pnpm baml:generate: Execute generation command
  pnpm baml:generate->>bunx baml-cli generate: Delegate to BAML CLI
  bunx baml-cli generate->>baml_src/: Parse schema files
  bunx baml-cli generate->>baml_client/: Generate TypeScript types
  baml_client/->>packages/server/src/: Import generated clients
  packages/server/src/->>packages/server/src/: TypeScript compilation
  note over baml_src/,TypeScript code: Generation creates:
```

The generation command at [package.json L29](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L29-L29)

 is defined as:

```

```

This command:

1. Reads schema files from `packages/server/baml_src/`
2. Generates TypeScript output to `packages/server/baml_client/` (gitignored via [.gitignore L31](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/.gitignore#L31-L31) )
3. Creates type-safe client classes like `b.CustomGPT5` and data types like `BamlResume`
4. Enables streaming with `partial_types` for progressive LLM responses

The generated code is imported by server files such as `packages/server/src/public/resume/resume-rpc-live.ts` which uses `b.stream.ExtractResume()` for streaming resume extraction.

**When to Regenerate**:

* After modifying enum definitions in `resume.baml`
* After changing LLM client configurations in `clients.baml`
* After updating the `ExtractResume` function prompt or schema
* After pulling changes from git that modify `.baml` files

**Sources**: [package.json L29](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L29-L29)

 [.gitignore L30-L31](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/.gitignore#L30-L31)

 [README.md L68-L69](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L68-L69)

---

## Database Migration Workflow

TalentScore uses SQL migration files to version the PostgreSQL schema. The migration system is implemented in TypeScript using Effect-TS patterns:

```mermaid
flowchart TD

MigrationFiles["src/db/migrations/<br>001_init.sql, 002_xyz.sql"]
MigratorScript["src/db/scripts/migrator.ts<br>Reads migration directory"]
DBMigrate["pnpm db:migrate<br>Applies pending migrations"]
DBReset["pnpm db:reset<br>Drops all tables"]
ReadFiles["Read .sql files<br>Sort by filename"]
CheckApplied["Check migrations table<br>Which already ran?"]
RunPending["Execute pending SQLs<br>in transaction"]
RecordSuccess["INSERT INTO migrations<br>Record completion"]
PostgresDB["PostgreSQL<br>file_folders, files, resumes"]

MigrationFiles --> MigratorScript
DBMigrate --> MigratorScript
DBReset --> MigratorScript
MigratorScript --> ReadFiles
RecordSuccess --> PostgresDB

subgraph subGraph0 ["Migration Execution"]
    ReadFiles
    CheckApplied
    RunPending
    RecordSuccess
    ReadFiles --> CheckApplied
    CheckApplied --> RunPending
    RunPending --> RecordSuccess
end
```

**Migration Commands**:

* **`pnpm db:migrate`**: Defined at [packages/server/package.json L19](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L19-L19)  Runs [packages/server/src/db/scripts/migrator.ts](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/db/scripts/migrator.ts)  to apply all pending migrations. Safe to run multiple times (idempotent).
* **`pnpm db:reset`**: Defined at [packages/server/package.json L20](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L20-L20)  Runs [packages/server/src/db/scripts/reset-database.ts](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/src/db/scripts/reset-database.ts)  to drop all tables and re-apply the full schema. **Destructive operation** - only use in development.

**Migration File Structure**:

Migration files are stored in `packages/server/src/db/migrations/` with sequential numeric prefixes:

* `001_initial_schema.sql`
* `002_add_indexes.sql`
* `003_new_feature.sql`

Each migration should be self-contained and idempotent where possible (using `IF NOT EXISTS`, `IF EXISTS` clauses).

**Adding a New Migration**:

1. Create new file: `packages/server/src/db/migrations/00X_description.sql`
2. Write SQL (CREATE TABLE, ALTER TABLE, etc.)
3. Run `pnpm db:migrate` to apply
4. Verify with `psql` or database client

**Sources**: [packages/server/package.json L19-L20](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L19-L20)

 [README.md L65-L66](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L65-L66)

---

## Testing Strategy

TalentScore uses Vitest for unit and integration testing. The testing infrastructure is configured at the monorepo root with workspace support:

```mermaid
flowchart TD

TestCmd["pnpm test<br>vitest run"]
WatchCmd["pnpm test:watch<br>vitest (watch mode)"]
VitestConfig["vitest.config.ts<br>(implicit)"]
EffectVitest["@effect/vitest<br>Effect-aware matchers"]
ServerTests["packages/server/**/*.test.ts<br>Repository tests"]
ClientTests["packages/client/**/*.test.ts<br>Atom tests"]
DomainTests["packages/domain/**/*.test.ts<br>Schema tests"]
TestContainers["@testcontainers/postgresql<br>Ephemeral databases"]
EffectTest["Effect.test<br>Layer testing"]

TestCmd --> VitestConfig
WatchCmd --> VitestConfig
VitestConfig --> ServerTests
VitestConfig --> ClientTests
VitestConfig --> DomainTests
ServerTests --> TestContainers
ServerTests --> EffectTest
ClientTests --> EffectTest

subgraph subGraph3 ["Test Utilities"]
    TestContainers
    EffectTest
end

subgraph subGraph2 ["Test Files"]
    ServerTests
    ClientTests
    DomainTests
end

subgraph subGraph1 ["Test Infrastructure"]
    VitestConfig
    EffectVitest
    VitestConfig --> EffectVitest
end

subgraph subGraph0 ["Test Execution"]
    TestCmd
    WatchCmd
end
```

**Testing Approach**:

1. **Repository Tests**: Use `@testcontainers/postgresql` to spin up ephemeral PostgreSQL containers for true integration tests. Defined as dev dependency at [packages/server/package.json L38](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L38-L38)
2. **Effect-Aware Testing**: The `@effect/vitest` package at [package.json L33](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L33-L33)  provides custom matchers for testing Effect programs, such as `expect.effect()` for async Effect values.
3. **Watch Mode**: The `pnpm test:watch` command at [package.json L22](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L22-L22)  runs Vitest in watch mode, re-executing tests on file changes.

**Running Tests**:

```

```

**Sources**: [package.json L21-L33](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L21-L33)

 [packages/server/package.json L16-L38](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L16-L38)

---

## Common Development Tasks

### Adding a New RPC Method

To add a new RPC endpoint, follow this workflow:

1. **Define Contract** in `packages/domain/src/rpc/`: * Add method to appropriate `Rpc` interface (e.g., `ResumeRpc`, `FilesRpc`) * Define request/response schemas using `@effect/schema`
2. **Implement Server Handler** in `packages/server/src/public/`: * Create handler function in corresponding `*-rpc-live.ts` file * Implement business logic using Effect layers * Return `Rpc.handler()` mapping
3. **Consume in Client** from `packages/client/src/lib/atoms/`: * Call method via `rpc.resume_method()` or `rpc.files_method()` * Handle streaming responses if applicable * Update atom state with results

**Type safety is enforced** at compile time through the shared domain package.

### Modifying BAML Schemas

1. Edit `.baml` files in `packages/server/baml_src/`
2. Run `pnpm baml:generate` to regenerate TypeScript clients
3. Update server code consuming generated types (e.g., `BamlResume`)
4. Restart server (`pnpm dev:server`)

### Database Schema Changes

1. Create new migration file: `packages/server/src/db/migrations/00X_name.sql`
2. Write SQL statements (prefer idempotent operations)
3. Apply migration: `pnpm db:migrate`
4. Update repository code in `packages/server/src/db/repos/`
5. Update domain schemas if data models changed

**Sources**: [README.md L87-L108](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L87-L108)

---

## Code Quality Checks

TalentScore uses a multi-layered code quality pipeline combining type checking, linting, and formatting:

```mermaid
flowchart TD

Prettier["prettier<br>Auto-formatting"]
PrettierPlugins["Plugins:<br>- organize-imports<br>- sql<br>- tailwindcss"]
FastCheck["pnpm check:fast"]
Lint["pnpm lint"]
TypeCheck["pnpm check"]
Oxlint["oxlint<br>Fast Rust-based linter"]
ESLint["eslint<br>TypeScript-aware rules"]
TSC["tsc -b<br>Incremental builds"]
TSConfig["tsconfig.json<br>Strict mode enabled"]

Lint --> Oxlint
Lint --> ESLint
TypeCheck --> TSC

subgraph subGraph2 ["Type Checking"]
    TSC
    TSConfig
    TSC --> TSConfig
end

subgraph subGraph1 ["Linting Layers"]
    Oxlint
    ESLint
end

subgraph subGraph0 ["Fast Checks (CI)"]
    FastCheck
    Lint
    TypeCheck
    FastCheck --> Lint
    FastCheck --> TypeCheck
end

subgraph Formatting ["Formatting"]
    Prettier
    PrettierPlugins
    Prettier --> PrettierPlugins
end
```

**Quality Commands**:

| Command | Purpose | When to Use |
| --- | --- | --- |
| `pnpm check` | Full TypeScript compilation | Before committing |
| `pnpm check:fast` | Lint + type check without rebuild | During development |
| `pnpm lint` | Run Oxlint + ESLint | Before committing |
| `pnpm lint:fix` | Auto-fix linting issues | When lint errors reported |
| `pnpm format` | Format all files with Prettier | Before committing |
| `pnpm format:check` | Verify formatting compliance | In CI pipeline |

**Linting Strategy**:

1. **Oxlint** ([package.json L18](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L18-L18) ): Fast Rust-based linter runs first with `--type-aware` flag for TypeScript-specific checks
2. **ESLint** ([package.json L19](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L19-L19) ): Follows up with additional TypeScript rules using `@typescript-eslint/parser`
3. Both linters use `--quiet` flag to suppress warnings, showing only errors

**Formatting Plugins**:

* `prettier-plugin-organize-imports` ([package.json L41](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L41-L41) ): Auto-sorts import statements
* `prettier-plugin-sql` ([package.json L42](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L42-L42) ): Formats SQL in template literals
* `prettier-plugin-tailwindcss` ([package.json L43](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L43-L43) ): Sorts Tailwind CSS classes

**Sources**: [package.json L14-L47](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L14-L47)

---

## Development Server Ports

The following table documents all network ports used during development:

| Service | Port | Protocol | Purpose |
| --- | --- | --- | --- |
| **Client Dev Server** | 5173 | HTTP | Vite development server with HMR |
| **Client HMR WebSocket** | 5173 | WebSocket | Vite hot module replacement |
| **API Server** | 3001 | HTTP | Effect RPC HTTP endpoint |
| **RPC WebSocket** | 3001 | WebSocket | Effect RPC bidirectional stream |
| **PostgreSQL** | 5432 | TCP | Database connection |
| **Jaeger UI** | 16686 | HTTP | Trace visualization interface |
| **Jaeger Collector** | 4318 | HTTP | OTLP trace ingestion |

**Port Configuration**:

* Client port (5173) is Vite's default and can be changed in `vite.config.ts`
* Server port (3001) is configured in `packages/server/src/server.ts`
* PostgreSQL and Jaeger ports are defined in `docker-compose.yml`

**Accessing Services**:

* **Application UI**: [http://localhost:5173](http://localhost:5173)
* **Jaeger Traces**: [http://localhost:16686](http://localhost:16686)
* **Health Check**: [http://localhost:3001](http://localhost:3001) (if implemented)

**Sources**: [README.md L84-L85](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L84-L85)