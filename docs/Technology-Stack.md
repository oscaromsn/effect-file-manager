# Technology Stack

> **Relevant source files**
> * [.gitignore](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/.gitignore)
> * [README.md](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md)
> * [bun.lock](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/bun.lock)
> * [package.json](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json)
> * [packages/server/package.json](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json)

## Purpose and Scope

This document catalogs all major technologies, frameworks, and libraries used in the TalentScore codebase. It provides version information, explains the role of each technology in the system architecture, and documents integration patterns. For details on how Effect-TS specifically integrates across the system, see [Effect Ecosystem Integration](/oscaromsn/TalentScore/2.3-effect-ecosystem-integration). For workspace configuration and build tooling, see [Monorepo Structure](/oscaromsn/TalentScore/2.1-monorepo-structure).

---

## Technology Categories Overview

The TalentScore stack is organized into six major categories, each serving a distinct architectural role:

```

```

**Sources**: [package.json L1-L68](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L1-L68)

 [packages/server/package.json L1-L44](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L1-L44)

 [README.md L109-L118](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L109-L118)

---

## Effect Ecosystem

Effect is the foundational runtime that provides functional programming patterns, comprehensive error handling, and composable abstractions across the entire system.

### Core Effect Packages

| Package | Version | Role | Usage Location |
| --- | --- | --- | --- |
| `effect` | 3.19.8 | Core runtime, Effect monad, concurrency primitives | All packages |
| `@effect/platform` | 0.93.6 | Cross-platform abstractions (HTTP, File System, etc.) | `packages/server`, `packages/client` |
| `@effect/platform-node` | 0.103.0 | Node.js-specific platform bindings | `packages/server` |
| `@effect/platform-browser` | 0.73.0 | Browser-specific platform bindings | `packages/client` |
| `@effect/rpc` | 0.72.2 | Type-safe RPC over WebSocket/HTTP | `packages/domain`, `packages/server`, `packages/client` |
| `@effect/sql` | 0.48.6 | SQL client abstraction | `packages/server` |
| `@effect/sql-pg` | 0.49.7 | PostgreSQL driver for @effect/sql | `packages/server` |
| `@effect/opentelemetry` | 0.59.1 | OpenTelemetry integration for distributed tracing | `packages/server` |

### Effect Atom Packages

| Package | Version | Role |
| --- | --- | --- |
| `@effect-atom/atom` | 0.4.7 | Core reactive state management primitives |
| `@effect-atom/atom-react` | 0.4.2 | React bindings for Effect Atoms |

```

```

**Version Pinning Strategy**: All Effect packages are pinned to synchronized versions using `package.json` overrides [package.json L53-L67](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L53-L67)

 This prevents version conflicts in the pnpm workspace and ensures compatibility across the ecosystem.

**Sources**: [package.json L49-L67](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L49-L67)

 [packages/server/package.json L22-L35](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L22-L35)

---

## Frontend Technologies

The client application uses modern React patterns combined with Effect-based state management for reactive, type-safe UI development.

### Frontend Stack Breakdown

```

```

**Sources**: [README.md L114](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L114-L114)

 [package.json L51](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L51-L51)

### React 19 Features

React 19 provides automatic batching, improved concurrent rendering, and enhanced server component support. The application uses:

* **Concurrent Rendering**: Enables progressive loading during resume parsing streams
* **Automatic Batching**: Multiple state updates batched in event handlers
* **Enhanced Suspense**: Loading states for async data fetching

### TanStack Router

File-based routing with type-safe route parameters and automatic route tree generation:

* Route files located in `packages/client/src/routes/`
* Generated route tree at `packages/client/src/routeTree.gen.ts`
* Type-safe navigation with route parameter validation

### Tailwind CSS v4

Utility-first CSS framework with improved performance and DX:

* Configuration: `packages/client/tailwind.config.ts`
* Oxide engine for faster compilation
* PostCSS integration for CSS processing

**Sources**: [README.md L114](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L114-L114)

 Diagram 5 (Frontend Stack section)

---

## Backend Technologies

The server is built on Node.js with Effect platform abstractions for HTTP handling, database access, and observability.

### Backend Stack Architecture

```

```

**Sources**: [packages/server/package.json L22-L35](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L22-L35)

 [README.md L78-L86](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L78-L86)

### Node.js Runtime

* **Version**: 22.14.0 (specified in [package.json L6](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L6-L6) )
* **Package Manager**: pnpm 10.3.0 (enforced in [package.json L4-L7](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L4-L7) )
* **Execution**: `tsx` for development with watch mode [packages/server/package.json L17](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L17-L17)
* **Production**: Compiled JavaScript via TypeScript [packages/server/package.json L18](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L18-L18)

### HTTP Server Configuration

The server uses `@effect/platform-node`'s `NodeHttpServer.layer` to create an HTTP server that serves:

1. **WebSocket RPC**: Primary communication channel for client-server interaction
2. **CORS Middleware**: Configured for `http://localhost:5173` (client dev server)
3. **Request Logging**: Integrated with OpenTelemetry for distributed tracing

### PostgreSQL Integration

```

```

**Database Dependencies**:

* `@effect/sql@0.48.6`: SQL client abstraction
* `@effect/sql-pg@0.49.7`: PostgreSQL-specific implementation
* `pg@^8.16.3`: Underlying node-postgres driver

**Migration System**:

* Migrations located at `packages/server/src/db/migrations/`
* Executed via `pnpm db:migrate` [package.json L27](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L27-L27)
* Reset command: `pnpm db:reset` [package.json L28](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L28-L28)

**Sources**: [packages/server/package.json L27-L28](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L27-L28)

 [README.md L53-L66](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L53-L66)

---

## AI/ML Stack

The AI layer uses BAML (BoundaryML) to provide type-safe, structured extraction from LLMs with configurable providers and retry policies.

### BAML Architecture

```

```

**Sources**: [README.md L15-L105](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L15-L105)

 [package.json L50](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L50-L50)

### BAML Package

* **Version**: `@boundaryml/baml@0.214.0` [package.json L50](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L50-L50)
* **Generation Command**: `pnpm baml:generate` [package.json L29](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L29-L29)
* **Source Directory**: `packages/server/baml_src/`
* **Output Directory**: `baml_client/` (gitignored, [.gitignore L31](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/.gitignore#L31-L31) )

### LLM Provider Configuration

BAML abstracts multiple LLM providers through declarative client configuration:

| Client Name | Provider | Model | Retry Policy |
| --- | --- | --- | --- |
| `CustomGPT5` | OpenAI | `gpt-4o` (fallback) | Constant: 3 retries, 200ms delay |
| `CustomOpus4` | Anthropic | `claude-opus-4` | Exponential: 2 retries, 1.5x multiplier |
| `CustomSonnet4` | Anthropic | `claude-sonnet-4` | Exponential: 2 retries, 1.5x multiplier |

**Environment Variables Required**:

* `OPENAI_API_KEY`: Required for OpenAI clients [README.md L56](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L56-L56)
* Alternative: Configure Anthropic in `baml_src/clients.baml`

### Streaming Extraction

BAML provides streaming APIs that enable progressive data extraction:

1. **Partial Results**: `b.stream.ExtractResume(pdf)` yields incremental data
2. **Type Safety**: BAML validates partial results against schema
3. **Server Mapping**: Server maps BAML types to domain `PartialResumeData` schema
4. **Client Updates**: Client receives `ParseEvent::Partial` events in real-time

**Sources**: [README.md L104-L107](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L104-L107)

 Diagram 3 (AI Pipeline section)

---

## Data Layer

The data layer combines PostgreSQL for structured metadata with UploadThing for binary file storage.

### Data Layer Architecture

| Component | Technology | Purpose | Location |
| --- | --- | --- | --- |
| Metadata Storage | PostgreSQL | Stores file/folder metadata, resume analyses | Docker container |
| File Storage | UploadThing v7 | Stores binary PDFs, provides presigned URLs | External service |
| Schema Management | SQL migrations | Version-controlled database schema | `packages/server/src/db/migrations/` |
| Data Access | `@effect/sql-pg` | Type-safe SQL queries via Effect | `packages/server/src/db/repositories/` |

### PostgreSQL Configuration

```

```

**Docker Setup**:

* Service defined in `docker-compose.yml` at repository root
* Command: `docker compose up -d` [README.md L63](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L63-L63)
* Default credentials: `postgres/postgres`
* Default database: `talentscore`

**Sources**: [README.md L53-L66](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L53-L66)

 [packages/server/package.json L27-L28](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L27-L28)

### UploadThing Integration

**Version**: UploadThing v7 API
**Environment Variable**: `UPLOADTHING_TOKEN` (required, [README.md L54](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L54-L54)

)

**Workflow**:

1. **Client Initiation**: Call `FilesRpc.initiateUpload(filename, filesize)`
2. **Presigned URL**: Server returns presigned S3 URL from UploadThing
3. **Direct Upload**: Client uploads directly to S3 (bypasses server)
4. **Registration**: Server polls for file registration in database
5. **Sync Confirmation**: Client receives confirmation via `getFilesByKeys` polling

**Storage Key Format**: `uploadthing_key` UNIQUE constraint in `files` table ensures no duplicate uploads

**Sources**: [README.md L9-L54](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L9-L54)

 Diagram 4 (File Management Architecture)

---

## Development Tools

The development environment uses modern tooling for type checking, linting, formatting, and testing.

### Development Tools Matrix

| Category | Tool | Version | Configuration | Purpose |
| --- | --- | --- | --- | --- |
| **Package Manager** | pnpm | 10.3.0 | `package.json` | Workspace management, dependency resolution |
| **Type Checking** | TypeScript | 5.8.3 | `tsconfig.json` | Static type analysis across monorepo |
| **Linting** | oxlint | 1.31.0 | `oxlint` config | Fast Rust-based linter |
| **Linting** | ESLint | 9.19.0 | `@eslint/js` | Additional lint rules |
| **Formatting** | Prettier | 3.4.2 | `.prettierrc` | Code formatting |
| **Testing** | Vitest | 3.1.1 | `vitest.config.ts` | Unit and integration tests |
| **Dev Runtime** | tsx | 4.19.2 | `tsx --watch` | TypeScript execution with HMR |
| **Build Tool (Client)** | Vite | 6.x | `vite.config.ts` | Frontend bundling and dev server |

### Development Commands

```

```

**Sources**: [package.json L12-L29](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L12-L29)

 [packages/server/package.json L17-L20](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L17-L20)

### TypeScript Configuration

* **Version**: 5.8.3 with strict type checking
* **Build Output**: `build/esm/` for server, `dist/` for client
* **Type Aliases**: `tsc-alias` for path mapping [packages/server/package.json L15](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L15-L15)
* **Composite Projects**: `tsconfig.json` with project references across packages

### Linting Strategy

**Dual Linter Approach**:

1. **oxlint**: Rust-based linter for performance (runs first) [package.json L18](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L18-L18) * Type-aware mode enabled * `oxlint-tsgolint` plugin for additional rules
2. **ESLint**: JavaScript-based linter for comprehensive rules [package.json L19](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L19-L19) * TypeScript parser: `@typescript-eslint/parser` * Quiet mode in CI to reduce noise

**Fix Command**: `pnpm lint:fix` [package.json L20](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L20-L20)

### Testing Framework

**Vitest Configuration**:

* **Integration**: `@effect/vitest@0.27.0` for Effect-based testing [package.json L62](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L62-L62)
* **Test Runner**: Vitest 3.1.1 (overridden from 2.0.5) [package.json L54](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L54-L54)
* **Watch Mode**: `pnpm test:watch` [package.json L22](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L22-L22)
* **Coverage**: Output to `coverage/` directory [.gitignore L1](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/.gitignore#L1-L1)

**Sources**: [package.json L31-L47](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L31-L47)

 [packages/server/package.json L11-L20](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L11-L20)

---

## Infrastructure and Observability

Docker Compose manages local development services, while OpenTelemetry provides distributed tracing for production observability.

### Infrastructure Services

```

```

**Sources**: [README.md L62-L85](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L62-L85)

 [packages/server/package.json L30-L33](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L30-L33)

### OpenTelemetry Integration

**Packages**:

* `@effect/opentelemetry@0.59.1`: Effect integration layer [package.json L66](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L66-L66)
* `@opentelemetry/exporter-trace-otlp-http@0.200.0`: HTTP trace exporter [packages/server/package.json L30](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L30-L30)
* `@opentelemetry/sdk-trace-node@2.0.0`: Node.js SDK [packages/server/package.json L33](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L33-L33)
* `@opentelemetry/resources@2.0.0`: Resource metadata [packages/server/package.json L31](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L31-L31)

**Tracing Workflow**:

1. Server operations automatically instrumented via Effect runtime
2. Trace context propagated through RPC calls
3. `trace_id` logged in server console output
4. Traces exported to Jaeger via OTLP HTTP endpoint (port 4318)
5. View traces in Jaeger UI at `http://localhost:16686`

**Trace Visibility**:

* All Effect operations automatically traced
* RPC request/response spans captured
* Database query spans via `@effect/sql`
* Custom spans added via `Effect.withSpan`

**Sources**: [README.md L85](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L85-L85)

 [packages/server/package.json L30-L33](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/packages/server/package.json#L30-L33)

### Development Workflow

```

```

**Sources**: [README.md L38-L86](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L38-L86)

 [package.json L12-L29](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L12-L29)

---

## Version Management

All package versions are explicitly controlled to ensure compatibility across the monorepo.

### Version Override Strategy

The root `package.json` uses pnpm overrides to enforce consistent versions of Effect ecosystem packages across all workspace packages:

```

```

**Benefits of Version Overrides**:

1. **Consistency**: All packages use identical Effect ecosystem versions
2. **No Conflicts**: Prevents subtle bugs from version mismatches
3. **Single Source of Truth**: Root `package.json` controls all versions
4. **Simplified Updates**: Change version once to update entire monorepo

**Critical Synchronized Versions**:

* All `@effect/*` packages must align to compatible releases
* `@effect-atom/*` packages versioned together
* Development tools (`@effect/vitest`, `@effect/language-service`) match Effect version

**Sources**: [package.json L53-L67](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/package.json#L53-L67)

---

## Technology Selection Rationale

### Why Effect?

Effect provides several architectural advantages over traditional TypeScript patterns:

1. **Comprehensive Error Handling**: Effect's typed error channel eliminates uncaught exceptions
2. **Dependency Injection**: Layer-based DI enables testable, composable services
3. **Structured Concurrency**: Built-in concurrency primitives prevent resource leaks
4. **Observability**: Native OpenTelemetry integration for distributed tracing
5. **Type Safety**: Runtime schema validation via Effect Schema

**Use Cases in TalentScore**:

* Resume parsing streams with automatic error propagation
* Database transaction management with automatic rollback
* RPC handlers with typed errors returned to client
* File upload retry logic with exponential backoff

### Why BAML?

BAML (BoundaryML) addresses key challenges in LLM integration:

1. **Type Safety**: BAML schemas enforce LLM output structure at generation time
2. **Provider Abstraction**: Switch between OpenAI/Anthropic without code changes
3. **Streaming Support**: Native streaming APIs for progressive data extraction
4. **Retry Policies**: Declarative retry configuration per client
5. **Version Control**: `.baml` files track prompt evolution in git

**Alternative Considered**: Direct OpenAI SDK usage would require manual schema validation and provider-specific code.

### Why React 19 + TanStack Router?

* **React 19**: Concurrent features enable smooth streaming UI updates during resume parsing
* **TanStack Router**: Type-safe routing with automatic route tree generation from file structure
* **Effect Atoms**: Bridge between Effect runtime and React components

### Why PostgreSQL + UploadThing?

* **PostgreSQL**: Rich relational model for file/folder hierarchy, native JSON support for resume analysis
* **UploadThing**: Handles complex upload flows (presigned URLs, resumable uploads) without server code
* **Separation of Concerns**: Binary storage separate from metadata enables independent scaling

**Sources**: [README.md L3-L118](https://github.com/oscaromsn/TalentScore/blob/428ed1eb/README.md#L3-L118)

 Diagram 5 (Technology Stack overview)